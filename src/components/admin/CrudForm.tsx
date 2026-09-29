"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { STORAGE_BUCKETS } from "@/lib/server/storage";
import { WEEKDAYS } from "@/lib/utils/time";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "checkbox"
  | "checks"
  | "media"
  | "days";

export interface FormField {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  /** GET url returning the option list (fetched once). */
  optionsUrl?: string;
  /** Key inside the response holding the array. */
  optionsPath?: string;
  optionValue?: string;
  optionLabel?: string;
  placeholder?: string;
  required?: boolean;
  span?: 1 | 2;
  hint?: string;
  min?: number;
  max?: number;
  rows?: number;
  nullableNumber?: boolean;
  bucket?: string;
  folder?: string;
  kind?: "image" | "document";
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

interface Props {
  endpoint: string;
  id?: string;
  sections: FormSection[];
  backHref: string;
  submitLabel: string;
  initialValues?: Record<string, unknown>;
  /** Option lists supplied by the server page, keyed by field name. */
  staticOptions?: Record<string, { value: string; label: string }[]>;
  /** Final hook before submit (e.g. map UI-only fields). */
  transform?: (payload: Record<string, unknown>) => Record<string, unknown>;
}

type Value = string | boolean | string[];
type Values = Record<string, Value>;

function initialValue(field: FormField, source?: Record<string, unknown>): Value {
  const raw = source?.[field.name];
  if (field.type === "days" || field.type === "checks") {
    return Array.isArray(raw) ? raw.map(String) : [];
  }
  if (field.type === "checkbox") return Boolean(raw);
  if (raw === null || raw === undefined) return "";
  if (field.type === "date") return String(raw).slice(0, 10);
  return String(raw);
}

function buildPayload(field: FormField, value: Value): unknown {
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "days" || field.type === "checks") {
    return Array.isArray(value) ? value : [];
  }
  const text = String(value ?? "");
  if (field.type === "number") {
    if (text.trim() === "") return field.nullableNumber ? null : 0;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (field.type === "date") return text || null;
  return text;
}

export function CrudForm({
  endpoint,
  id,
  sections,
  backHref,
  submitLabel,
  initialValues,
  staticOptions,
  transform,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => {
    const seed: Values = {};
    for (const section of sections) {
      for (const field of section.fields) {
        seed[field.name] = initialValue(field, initialValues);
      }
    }
    return seed;
  });
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const optionUrls = Array.from(
    new Set(
      sections
        .flatMap((section) => section.fields)
        .map((field) => field.optionsUrl)
        .filter((url): url is string => Boolean(url))
    )
  );

  useEffect(() => {
    if (optionUrls.length === 0) return;

    const load = async () => {
      const next: Record<string, { value: string; label: string }[]> = {};
      for (const url of optionUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const field = sections
            .flatMap((section) => section.fields)
            .find((item) => item.optionsUrl === url);
          const path = field?.optionsPath || "";
          const list = path ? data[path] : Array.isArray(data) ? data : data.rows || data.results;
          const valueKey = field?.optionValue || "id";
          const labelKey = field?.optionLabel || "name";
          next[url] = Array.isArray(list)
            ? list.map((item: Record<string, unknown>) => ({
                value: String(item[valueKey] ?? ""),
                label: String(item[labelKey] ?? item[valueKey] ?? ""),
              }))
            : [];
        } catch {
          next[url] = [];
        }
      }
      setOptions(next);
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionUrls.join("|")]);

  const set = (name: string, value: Value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError("");

    for (const section of sections) {
      for (const field of section.fields) {
        if (!field.required) continue;
        const value = values[field.name];
        const empty =
          field.type === "checkbox"
            ? false
            : Array.isArray(value)
              ? value.length === 0
              : String(value ?? "").trim() === "";        if (empty) {
          setError(`${field.label} is required.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      let payload: Record<string, unknown> = {};
      for (const section of sections) {
        for (const field of section.fields) {
          payload[field.name] = buildPayload(field, values[field.name]);
        }
      }
      if (transform) payload = transform(payload);

      const res = await fetch(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save.");

      router.push(backHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const type = field.type || "text";
    const value = values[field.name];
    const key = field.name;

    if (type === "checkbox") {
      return (
        <div key={key} className="flex items-center gap-2 pt-6">
          <Checkbox
            id={key}
            checked={Boolean(value)}
            onChange={(event) => set(key, event.target.checked)}
          />
          <label htmlFor={key} className="text-sm text-slate-700">
            {field.label}
          </label>
        </div>
      );
    }

    if (type === "checks") {
      const list =
        field.options ||
        (staticOptions ? staticOptions[key] : undefined) ||
        (field.optionsUrl ? options[field.optionsUrl] || [] : []);
      const selected = Array.isArray(value) ? value : [];
      return (
        <div key={key} className={field.span === 1 ? "" : "sm:col-span-2"}>
          <Label>{field.label}</Label>
          {list.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing available yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onChange={(event) =>
                      set(
                        key,
                        event.target.checked
                          ? [...selected, option.value]
                          : selected.filter((item) => item !== option.value)
                      )
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
          {field.hint && <p className="mt-1.5 text-xs text-slate-500">{field.hint}</p>}
        </div>
      );
    }

    if (type === "days") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div key={key} className="sm:col-span-2">
          <Label>{field.label}</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = selected.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    set(
                      key,
                      active ? selected.filter((item) => item !== day) : [...selected, day]
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {field.hint && <p className="mt-1.5 text-xs text-slate-500">{field.hint}</p>}
        </div>
      );
    }

    if (type === "media") {
      return (
        <div key={key} className={field.span === 1 ? "" : "sm:col-span-2"}>
          <MediaUploader
            bucket={field.bucket || STORAGE_BUCKETS.INSTITUTE_ASSETS}
            folder={field.folder || "assets"}
            label={field.label}
            kind={field.kind || "image"}
            hint={field.hint}
            value={String(value || "")}
            onChange={(url) => set(key, url)}
          />
        </div>
      );
    }

    const labelNode = <Label htmlFor={key}>{field.label}{field.required ? " *" : ""}</Label>;

    if (type === "textarea") {
      return (
        <div key={key} className={field.span === 1 ? "" : "sm:col-span-2"}>
          {labelNode}
          <Textarea
            id={key}
            rows={field.rows || 4}
            value={String(value || "")}
            placeholder={field.placeholder}
            onChange={(event) => set(key, event.target.value)}
          />
          {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
        </div>
      );
    }

    if (type === "select") {
      const list =
        field.options ||
        (staticOptions ? staticOptions[key] : undefined) ||
        (field.optionsUrl ? options[field.optionsUrl] || [] : []);
      return (
        <div key={key}>
          {labelNode}
          <Select
            id={key}
            value={String(value || "")}
            onChange={(event) => set(key, event.target.value)}
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
            {list.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      );
    }

    return (
      <div key={key} className={field.span === 1 ? "" : ""}>
        {labelNode}
        <Input
          id={key}
          type={type === "number" ? "number" : type === "date" ? "date" : type === "time" ? "time" : "text"}
          value={String(value ?? "")}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          onChange={(event) => set(key, event.target.value)}
        />
        {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            {section.description && (
              <p className="mt-1 text-xs text-slate-500">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        <Link href={backHref}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
