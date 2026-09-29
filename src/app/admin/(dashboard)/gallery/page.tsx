import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { GalleryManager } from "@/components/admin/GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.GALLERY_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view the gallery.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Upload photos, group them into albums and reorder the public gallery."
      />
      <GalleryManager
        canUpload={hasPermission(user, PERMISSIONS.GALLERY_UPLOAD)}
        canDelete={hasPermission(user, PERMISSIONS.GALLERY_DELETE)}
      />
    </div>
  );
}
