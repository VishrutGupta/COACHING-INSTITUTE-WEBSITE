"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Field";

interface CourseOption {
  id: string;
  title: string;
}

interface Props {
  courses: CourseOption[];
  source?: string;
}

export function EnquiryForm({ courses, source = "contact" }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseId: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          course_id: form.courseId || null,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to submit your enquiry.");
      setStatus("done");
      setForm({ name: "", phone: "", email: "", courseId: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to submit your enquiry.");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-800">
        Thank you! Your enquiry has been received. Our team will contact you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="enquiry-name">Full name *</Label>
          <Input
            id="enquiry-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <Label htmlFor="enquiry-phone">Phone *</Label>
          <Input
            id="enquiry-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile number"
            inputMode="tel"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="enquiry-email">Email</Label>
          <Input
            id="enquiry-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="enquiry-course">Course of interest</Label>
          <Select
            id="enquiry-course"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="enquiry-message">Message *</Label>
        <Textarea
          id="enquiry-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us your goal, preferred batch timing or any question."
          required
        />
      </div>

      <Button type="submit" loading={status === "saving"}>
        Submit enquiry
      </Button>
    </form>
  );
}
