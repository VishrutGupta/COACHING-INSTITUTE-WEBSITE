-- ====================================================================
-- 002_coaching_functions.sql
-- SECURITY DEFINER helpers (non-recursive), login lookup, owner guards.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. ROLE / SCOPE HELPERS
CREATE OR REPLACE FUNCTION public.is_owner ()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid () AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager ()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid () AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_institute_id ()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT institute_id FROM public.profiles WHERE id = auth.uid ();
$$;

-- ---------------------------------------------------------------- 2. PERMISSION HELPERS
-- OWNER bypasses every permission check.
CREATE OR REPLACE FUNCTION public.has_permission (p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_owner ()
    OR EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid () AND permission = p_permission
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission (p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'owner'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = p_user_id AND permission = p_permission
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions (p_user_id UUID)
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT permission FROM public.user_permissions WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_owner () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_institute_id () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission (TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission (UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions (UUID) TO authenticated;

-- ---------------------------------------------------------------- 3. USERNAME -> EMAIL LOOKUP
-- Used by the admin login flow. Supabase Auth owns the password;
-- this function never returns credentials, only the auth email.
CREATE OR REPLACE FUNCTION public.lookup_auth_email_by_username (p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email TEXT;
  v_disabled BOOLEAN;
BEGIN
  SELECT au.email, p.is_disabled
    INTO v_email, v_disabled
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(trim(p_username))
    AND p.role IN ('owner', 'admin', 'staff')
  LIMIT 1;

  IF v_email IS NULL OR v_disabled THEN
    RETURN NULL;
  END IF;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_auth_email_by_username (TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------- 4. OWNER ACCOUNT GUARDS
-- Blocks owner creation / demotion / deletion / disabling from normal sessions.
-- Service role and the SQL editor have no auth.uid() and are allowed.
CREATE OR REPLACE FUNCTION public.protect_owner_profile ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid () IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role = 'owner' THEN
    RAISE EXCEPTION 'Owner accounts cannot be created from the application.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
      RAISE EXCEPTION 'The owner account cannot be demoted.';
    END IF;
    IF OLD.role <> 'owner' AND NEW.role = 'owner' THEN
      RAISE EXCEPTION 'Accounts cannot be promoted to owner.';
    END IF;
    IF OLD.role = 'owner' AND NEW.institute_id IS DISTINCT FROM OLD.institute_id THEN
      RAISE EXCEPTION 'The owner institute cannot be changed.';
    END IF;
    IF NEW.role = 'owner' AND NEW.is_disabled = true THEN
      RAISE EXCEPTION 'The owner account cannot be disabled.';
    END IF;
    IF OLD.role = 'owner' AND NEW.username IS DISTINCT FROM OLD.username THEN
      RAISE EXCEPTION 'The owner username cannot be changed.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    RAISE EXCEPTION 'The owner account cannot be deleted.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_owner ON public.profiles;
CREATE TRIGGER trg_profiles_protect_owner
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_profile ();
