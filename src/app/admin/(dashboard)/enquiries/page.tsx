import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { EnquiriesManager } from "@/components/admin/EnquiriesManager";
import { lookupOptions } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.ENQUIRIES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view enquiries.
      </div>
    );
  }

  const lookups = await lookupOptions(user);

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Lead inbox — move each enquiry through the workflow, assign staff and keep notes."
      />
      <EnquiriesManager
        canEdit={hasPermission(user, PERMISSIONS.ENQUIRIES_EDIT)}
        canDelete={hasPermission(user, PERMISSIONS.ENQUIRIES_DELETE)}
        users={lookups.assigned_to}
        courses={lookups.course_id}
      />
    </div>
  );
}
