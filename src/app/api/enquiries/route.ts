import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getInstitute, defaultInstituteSlug } from "@/lib/data/settings";

/**
 * POST /api/enquiries — public contact/enquiry form (Part 1 storage only).
 * Full lead management belongs to Part 2.
 */
export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    course_id?: string | null;
    source?: string;
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

  const supabase = createPublicSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Form is not configured yet. Please call or WhatsApp us." },
      { status: 503 }
    );
  }

  const institute = await getInstitute(body.institute_slug || defaultInstituteSlug());
  if (!institute.id) {
    return NextResponse.json({ error: "Institute is not configured." }, { status: 503 });
  }

  const { error } = await supabase.from("enquiries").insert({
    institute_id: institute.id,
    name,
    phone,
    email,
    message,
    course_id: body.course_id || null,
    source: body.source || "contact",
  });

  if (error) {
    console.error("[enquiry] insert failed:", error.message);
    return NextResponse.json(
      { error: "Unable to submit your enquiry right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
