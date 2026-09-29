"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { STORAGE_BUCKETS } from "@/lib/server/storage";

export interface CourseFormValues {
  id?: string;
  title: string;
  short_description: string;
  description: string;
  category: string;
  exam: string;
  target_audience: string;
  duration: string;
  fee: string;
  original_price: string;
  discount: string;
  mode: string;
  start_date: string;
  end_date: string;
  eligibility: string;
  highlights: string;
  syllabus: string;
  cover_image_url: string;
  gallery_urls: string[];
  brochure_url: string;
  featured: boolean;
  is_active: boolean;
  display_order: string;
  whatsapp_number: string;
  seo_title: string;
  seo_description: string;
}

export const EMPTY_COURSE: CourseFormValues = {
  title: "",
  short_description: "",
  description: "",
  category: "",
  exam: "",
  target_audience: "",
  duration: "",
  fee: "",
  original_price: "",
  discount: "",
  mode: "Offline",
  start_date: "",
  end_date: "",
  eligibility: "",
  highlights: "",
  syllabus: "",
  cover_image_url: "",
  gallery_urls: [],
  brochure_url: "",
  featured: false,
  is_active: true,
  display_order: "0",
  whatsapp_number: "",
  seo_title: "",
  seo_description: "",
};

interface FacultyOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface MappingRow {
  faculty_id: string;
  subject_id: string;
}

interface Props {
  initialValues?: CourseFormValues;
  courseId?: string;
}

function textToLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CourseForm({ initialValues, courseId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>(
    initialValues || EMPTY_COURSE
  );
  const [faculty, setFaculty] = useState<FacultyOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/faculty?all=1")
      .then((res) => (res.ok ? res.json() : { faculty: [] }))
      .then((data) =>
        setFaculty((data.faculty || []).map((row: { id: string; name: string }) => ({
          id: row.id,
          name: row.name,
        })))
      )
      .catch(() => setFaculty([]));

    fetch("/api/admin/subjects")
      .then((res) => (res.ok ? res.json() : { subjects: [] }))
      .then((data) =>
        setSubjects((data.subjects || []).map((row: { id: string; name: string }) => ({
          id: row.id,
          name: row.name,
        })))
      )
      .catch(() => setSubjects([]));

    if (courseId) {
      fetch(`/api/admin/courses/${courseId}/faculty`)
        .then((res) => (res.ok ? res.json() : { mappings: [] }))
        .then((data) =>
          setMappings(
            (data.mappings || []).map(
              (row: { faculty_id: string; subject_id: string | null }) => ({
                faculty_id: row.faculty_id,
                subject_id: row.subject_id || "",
              })
            )
          )
        )
        .catch(() => undefined);
    }
  }, [courseId]);

  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!values.title.trim()) {
      setError("Course title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        fee: Number(values.fee) || 0,
        original_price: values.original_price ? Number(values.original_price) : null,
        display_order: Number(values.display_order) || 0,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        highlights: textToLines(values.highlights),
        syllabus: textToLines(values.syllabus),
      };

      const res = await fetch(courseId ? `/api/admin/courses/${courseId}` : "/api/admin/courses", {
        method: courseId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save the course.");

      const savedId = courseId || data.course?.id;

      if (savedId) {
        await fetch(`/api/admin/courses/${savedId}/faculty`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: mappings }),
        });
      }

      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the course.");
      setSaving(false);
    }
  };

  const folder = `courses/${courseId || values.title.toLowerCase().replace(/\s+/g, "-") || "new"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Course title *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="JEE Advanced Foundation"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Engineering"
            />
          </div>

          <div>
            <Label htmlFor="exam">Exam</Label>
            <Input
              id="exam"
              value={values.exam}
              onChange={(e) => set("exam", e.target.value)}
              placeholder="JEE Advanced"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="short_description">Short description</Label>
            <Textarea
              id="short_description"
              rows={2}
              value={values.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              placeholder="One or two line summary shown on course cards."
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              rows={6}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="target_audience">Target audience</Label>
            <Input
              id="target_audience"
              value={values.target_audience}
              onChange={(e) => set("target_audience", e.target.value)}
              placeholder="Class 11-12 students"
            />
          </div>

          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select id="mode" value={values.mode} onChange={(e) => set("mode", e.target.value)}>
              <option>Online</option>
              <option>Offline</option>
              <option>Hybrid</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={values.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="12 months"
            />
          </div>
          <div>
            <Label htmlFor="fee">Fee (₹) *</Label>
            <Input
              id="fee"
              type="number"
              min={0}
              value={values.fee}
              onChange={(e) => set("fee", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="original_price">Original fee (₹)</Label>
            <Input
              id="original_price"
              type="number"
              min={0}
              value={values.original_price}
              onChange={(e) => set("original_price", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="discount">Discount label</Label>
            <Input
              id="discount"
              value={values.discount}
              onChange={(e) => set("discount", e.target.value)}
              placeholder="20% off"
            />
          </div>
          <div>
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              type="date"
              value={values.start_date}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end_date">End date</Label>
            <Input
              id="end_date"
              type="date"
              value={values.end_date}
              onChange={(e) => set("end_date", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="eligibility">Eligibility</Label>
            <Textarea
              id="eligibility"
              rows={2}
              value={values.eligibility}
              onChange={(e) => set("eligibility", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="highlights">Highlights (one per line)</Label>
            <Textarea
              id="highlights"
              rows={4}
              value={values.highlights}
              onChange={(e) => set("highlights", e.target.value)}
              placeholder={"Weekly tests\nDoubt sessions\nPrinted study material"}
            />
          </div>
          <div>
            <Label htmlFor="syllabus">Syllabus (one module per line)</Label>
            <Textarea
              id="syllabus"
              rows={4}
              value={values.syllabus}
              onChange={(e) => set("syllabus", e.target.value)}
              placeholder={"Unit 1: Basics\nUnit 2: Advanced problems"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <MediaUploader
            bucket={STORAGE_BUCKETS.COURSE_IMAGES}
            folder={`${folder}/cover`}
            label="Cover image"
            kind="image"
            value={values.cover_image_url}
            onChange={(url) => set("cover_image_url", url)}
          />

          <MediaUploader
            bucket={STORAGE_BUCKETS.COURSE_BROCHURES}
            folder={`${folder}/brochure`}
            label="Course brochure (PDF)"
            kind="document"
            hint="Original PDF is stored and downloaded unchanged."
            value={values.brochure_url}
            onChange={(url) => set("brochure_url", url)}
          />

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Gallery images
            </span>
            <div className="flex flex-wrap gap-3">
              {values.gallery_urls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "gallery_urls",
                        values.gallery_urls.filter((_, i) => i !== index)
                      )
                    }
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400">
                + Add
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("bucket", STORAGE_BUCKETS.COURSE_IMAGES);
                    formData.append("folder", `${folder}/gallery`);
                    const res = await fetch("/api/admin/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.url) {
                      set("gallery_urls", [...values.gallery_urls, data.url]);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faculty & subject mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mappings.length === 0 && (
            <p className="text-sm text-slate-500">
              No faculty mapped yet. Add rows to show who teaches which subject on the course page.
            </p>
          )}

          {mappings.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Select
                value={row.faculty_id}
                onChange={(event) => {
                  const next = [...mappings];
                  next[index] = { ...row, faculty_id: event.target.value };
                  setMappings(next);
                }}
              >
                <option value="">Select faculty</option>
                {faculty.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
              <Select
                value={row.subject_id}
                onChange={(event) => {
                  const next = [...mappings];
                  next[index] = { ...row, subject_id: event.target.value };
                  setMappings(next);
                }}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMappings(mappings.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMappings([...mappings, { faculty_id: "", subject_id: "" }])}
            disabled={faculty.length === 0}
          >
            Add faculty row
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={values.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">
              Published (visible on the public site)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="featured"
              checked={values.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            <label htmlFor="featured" className="text-sm text-slate-700">
              Featured on homepage
            </label>
          </div>
          <div>
            <Label htmlFor="display_order">Display order</Label>
            <Input
              id="display_order"
              type="number"
              value={values.display_order}
              onChange={(e) => set("display_order", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp number for this course</Label>
            <Input
              id="whatsapp_number"
              value={values.whatsapp_number}
              onChange={(e) => set("whatsapp_number", e.target.value)}
              placeholder="Falls back to institute WhatsApp"
            />
          </div>
          <div>
            <Label htmlFor="seo_title">SEO title</Label>
            <Input
              id="seo_title"
              value={values.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="seo_description">SEO description</Label>
            <Input
              id="seo_description"
              value={values.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {courseId ? "Save changes" : "Create course"}
        </Button>
        <Link href="/admin/courses">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
