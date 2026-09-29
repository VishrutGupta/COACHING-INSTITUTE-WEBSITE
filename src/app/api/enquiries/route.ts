import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getInstitute, defaultInstituteSlug } from "@/lib/data/settings";
import { auditLog } from "@/lib/server/auditLog";

const SOURCES = ["contact", "course", "apply", "callback"];

/**
 * POST /api/enquiries — public contact/enquiry form.
 * Stores the lead and writes exactly one enquiry.create audit row (actor: public-form).
 */
export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    course_id?: string | null;
    source?: string;
    preferred_batch?: string;
    institute_slug?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!phone && !email) {
    return NextResponse.json(
      { error: "Please provide a phone number or an email address." },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Please tell us how we can help." }, { status: 400 });
  }

  const insertClient = createPublicSupabase();
  if (!insertClient) {
    return NextResponse.json(
      { error: "Form is not configured yet. Please call or WhatsApp us." },
      { status: 503 }
    );
  }

  const institute = await getInstitute(body.institute_slug || defaultInstituteSlug());
  if (!institute.id) {
    return NextResponse.json({ error: "Institute is not configured." }, { status: 503 });
  }

  const source = SOURCES.includes(String(body.source)) ? String(body.source) : "contact";
  const preferredBatch = (body.preferred_batch || "").trim();

  const row = {
    institute_id: institute.id,
    name,
    phone,
    email,
    message,
    course_id: body.course_id || null,
    source,
    status: "new",
    preferred_batch: preferredBatch,
    notes: "",
    assigned_to: null as string | null,
  };

  const { data, error } = await insertClient
    .from("enquiries")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[enquiry] insert failed:", error?.message);
    return NextResponse.json(
      { error: "Unable to submit your enquiry right now. Please try again." },
      { status: 500 }
    );
  }

  if (isSupabaseAdminConfigured()) {
    await auditLog({
      supabase: getSupabaseAdmin(),
      instituteId: institute.id,
      actorUserId: null,
      actorUsername: "public-form",
      action: "enquiry.create",
      resourceType: "Enquiry",
      resourceId: data.id as string,
      description: `New enquiry received from "${name}"`,
      beforeData: null,
      afterData: {
        name,
        phone,
        email,
        message,
        course_id: row.course_id || "",
        source,
        status: "new",
        preferred_batch: preferredBatch,
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
