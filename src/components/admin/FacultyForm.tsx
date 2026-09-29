"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Checkbox } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { STORAGE_BUCKETS } from "@/lib/server/storage";

export interface FacultyFormValues {
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  experience: string;
  bio: string;
  specialization: string;
  achievements: string;
  profile_image: string;
  linkedin_url: string;
  display_order: string;
  is_active: boolean;
  featured: boolean;
}

export const EMPTY_FACULTY: FacultyFormValues = {
  name: "",
  designation: "",
  subject: "",
  qualification: "",
  experience: "",
  bio: "",
  specialization: "",
  achievements: "",
  profile_image: "",
  linkedin_url: "",
  display_order: "0",
  is_active: true,
  featured: false,
};

interface Props {
  initialValues?: FacultyFormValues;
  facultyId?: string;
}

export function FacultyForm({ initialValues, facultyId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<FacultyFormValues>(initialValues || EMPTY_FACULTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FacultyFormValues>(key: K, value: FacultyFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        display_order: Number(values.display_order) || 0,
      };
      const res = await fetch(
        facultyId ? `/api/admin/faculty/${facultyId}` : "/api/admin/faculty",
        {
          method: facultyId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save.");
      router.push("/admin/faculty");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
      setSaving(false);
    }
  };

  const folder = `faculty/${facultyId || values.name.toLowerCase().replace(/\s+/g, "-") || "new"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Full name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={values.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="Senior Faculty"
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={values.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Physics"
            />
          </div>
          <div>
            <Label htmlFor="qualification">Qualification</Label>
            <Input
              id="qualification"
              value={values.qualification}
              onChange={(e) => set("qualification", e.target.value)}
              placeholder="M.Sc., B.Ed."
            />
          </div>
          <div>
            <Label htmlFor="experience">Experience</Label>
            <Input
              id="experience"
              value={values.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="10+ years"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" rows={3} value={values.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Textarea
              id="specialization"
              rows={2}
              value={values.specialization}
              onChange={(e) => set("specialization", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="achievements">Achievements</Label>
            <Textarea
              id="achievements"
              rows={2}
              value={values.achievements}
              onChange={(e) => set("achievements", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={values.linkedin_url}
              onChange={(e) => set("linkedin_url", e.target.value)}
            />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUploader
            bucket={STORAGE_BUCKETS.FACULTY_PHOTOS}
            folder={folder}
            label="Profile photo"
            kind="image"
            value={values.profile_image}
            onChange={(url) => set("profile_image", url)}
          />
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
              Published
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {facultyId ? "Save changes" : "Add faculty member"}
        </Button>
        <Link href="/admin/faculty">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
