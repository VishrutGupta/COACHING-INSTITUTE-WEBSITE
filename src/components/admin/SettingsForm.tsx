"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { STORAGE_BUCKETS } from "@/lib/server/storage";

interface StatItem {
  label: string;
  value: string;
}

interface WhyItem {
  title: string;
  description: string;
}

interface AboutContent {
  introduction: string;
  vision: string;
  mission: string;
  why_choose_us: string;
  teaching_philosophy: string;
  experience: string;
  achievements: string;
  cta: string;
}

interface InstituteValues {
  name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  hero_title: string;
  hero_description: string;
  hero_image_url: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  google_maps_url: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  opening_hours: string;
  footer_text: string;
  admission_contact: string;
  accent_color: string;
  seo_title: string;
  seo_description: string;
}

interface SiteContent {
  stats: StatItem[];
  why_choose_us: WhyItem[];
  about: AboutContent;
}

interface Props {
  institute: InstituteValues;
  content: SiteContent;
  canEdit: boolean;
}

export function SettingsForm({ institute, content, canEdit }: Props) {
  const router = useRouter();
  const [base, setBase] = useState<InstituteValues>(institute);
  const [stats, setStats] = useState<StatItem[]>(content.stats);
  const [why, setWhy] = useState<WhyItem[]>(content.why_choose_us);
  const [about, setAbout] = useState<AboutContent>(content.about);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const setBaseField = (key: keyof InstituteValues, value: string) =>
    setBase((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institute: base,
          settings: { stats, why_choose_us: why, about },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save settings.");
      setSaved("Settings saved. The public website now uses these values.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saved}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Institute identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Institute name *</Label>
            <Input
              id="name"
              value={base.name}
              onChange={(e) => setBaseField("name", e.target.value)}
              disabled={!canEdit}
              required
            />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={base.tagline}
              onChange={(e) => setBaseField("tagline", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="accent_color">Accent colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={base.accent_color || "#2563eb"}
                onChange={(e) => setBaseField("accent_color", e.target.value)}
                disabled={!canEdit}
                className="h-10 w-12 rounded border border-slate-300 bg-white"
                aria-label="Accent colour"
              />
              <Input
                id="accent_color"
                value={base.accent_color}
                onChange={(e) => setBaseField("accent_color", e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="opening_hours">Opening hours</Label>
            <Input
              id="opening_hours"
              value={base.opening_hours}
              onChange={(e) => setBaseField("opening_hours", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <MediaUploader
            bucket={STORAGE_BUCKETS.INSTITUTE_ASSETS}
            folder="branding"
            label="Logo"
            kind="image"
            value={base.logo_url}
            onChange={(url) => setBaseField("logo_url", url)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <MediaUploader
            bucket={STORAGE_BUCKETS.INSTITUTE_ASSETS}
            folder="branding"
            label="Favicon"
            kind="image"
            value={base.favicon_url}
            onChange={(url) => setBaseField("favicon_url", url)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="hero_title">Hero title</Label>
            <Input
              id="hero_title"
              value={base.hero_title}
              onChange={(e) => setBaseField("hero_title", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="hero_description">Hero description</Label>
            <Textarea
              id="hero_description"
              rows={3}
              value={base.hero_description}
              onChange={(e) => setBaseField("hero_description", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <MediaUploader
            bucket={STORAGE_BUCKETS.INSTITUTE_ASSETS}
            folder="hero"
            label="Hero image"
            kind="image"
            value={base.hero_image_url}
            onChange={(url) => setBaseField("hero_image_url", url)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & social</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={2}
              value={base.address}
              onChange={(e) => setBaseField("address", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={base.phone}
              onChange={(e) => setBaseField("phone", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={base.whatsapp}
              onChange={(e) => setBaseField("whatsapp", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={base.email}
              onChange={(e) => setBaseField("email", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="admission_contact">Admission contact</Label>
            <Input
              id="admission_contact"
              value={base.admission_contact}
              onChange={(e) => setBaseField("admission_contact", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="google_maps_url">Google Maps URL</Label>
            <Input
              id="google_maps_url"
              value={base.google_maps_url}
              onChange={(e) => setBaseField("google_maps_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              value={base.instagram_url}
              onChange={(e) => setBaseField("instagram_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="facebook_url">Facebook</Label>
            <Input
              id="facebook_url"
              value={base.facebook_url}
              onChange={(e) => setBaseField("facebook_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="youtube_url">YouTube</Label>
            <Input
              id="youtube_url"
              value={base.youtube_url}
              onChange={(e) => setBaseField("youtube_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              value={base.linkedin_url}
              onChange={(e) => setBaseField("linkedin_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={stat.label}
                placeholder="Label"
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...stats];
                  next[index] = { ...stat, label: e.target.value };
                  setStats(next);
                }}
              />
              <Input
                value={stat.value}
                placeholder="Value"
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...stats];
                  next[index] = { ...stat, value: e.target.value };
                  setStats(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canEdit}
                onClick={() => setStats(stats.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEdit}
            onClick={() => setStats([...stats, { label: "", value: "" }])}
          >
            Add statistic
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why choose us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {why.map((item, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
              <Input
                value={item.title}
                placeholder="Title"
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...why];
                  next[index] = { ...item, title: e.target.value };
                  setWhy(next);
                }}
              />
              <Textarea
                rows={2}
                value={item.description}
                placeholder="Description"
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...why];
                  next[index] = { ...item, description: e.target.value };
                  setWhy(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!canEdit}
                onClick={() => setWhy(why.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEdit}
            onClick={() => setWhy([...why, { title: "", description: "" }])}
          >
            Add reason
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About page content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {(
            [
              ["introduction", "Introduction"],
              ["vision", "Vision"],
              ["mission", "Mission"],
              ["why_choose_us", "Why choose us"],
              ["teaching_philosophy", "Teaching philosophy"],
              ["experience", "Experience"],
              ["achievements", "Achievements"],
              ["cta", "Call to action"],
            ] as [keyof AboutContent, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`about-${key}`}>{label}</Label>
              <Textarea
                id={`about-${key}`}
                rows={3}
                value={about[key]}
                disabled={!canEdit}
                onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & footer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="seo_title">Default SEO title</Label>
            <Input
              id="seo_title"
              value={base.seo_title}
              onChange={(e) => setBaseField("seo_title", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="seo_description">Default SEO description</Label>
            <Textarea
              id="seo_description"
              rows={2}
              value={base.seo_description}
              onChange={(e) => setBaseField("seo_description", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="footer_text">Footer text</Label>
            <Textarea
              id="footer_text"
              rows={2}
              value={base.footer_text}
              onChange={(e) => setBaseField("footer_text", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div>
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  );
}
