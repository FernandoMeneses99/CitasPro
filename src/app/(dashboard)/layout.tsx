import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug, business_name")
    .eq("id", profile.tenant_id!)
    .single();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        userName={profile.full_name ?? profile.email ?? "Usuario"}
        userEmail={profile.email ?? ""}
        userRole={profile.role}
        businessName={tenant?.business_name ?? "Mi negocio"}
        tenantSlug={tenant?.slug ?? null}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}