import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AvailabilityForm,
  BusinessInfoForm,
  EmailJSForm,
  InviteForm,
} from "@/components/dashboard/forms";
import { AvailabilityList } from "@/components/dashboard/availability-list";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();
  const tenantId = profile.tenant_id!;

  const [tenantResult, settingsResult, availabilityResult, invitationsResult] =
    await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenantId).single(),
      supabase
        .from("tenant_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      supabase
        .from("availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("tenant_id", tenantId),
      supabase
        .from("invitations")
        .select("id, code, type, used_count, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]);

  const tenant = tenantResult.data as any;
  const settings = settingsResult.data as any;
  const availability = (availabilityResult.data ?? []) as any[];
  const invitations = (invitationsResult.data ?? []) as any[];
  const isOwner = profile.role === ROLES.OWNER || profile.role === ROLES.ZENTRO_ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Marca, información, horarios, invitaciones y notificaciones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información y marca</CardTitle>
            <CardDescription>
              Se muestra en tu página pública. Cambia colores, logo y datos de
              contacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {tenant && (
              <BusinessInfoForm
                tenant={{
                  business_name: tenant.business_name,
                  tagline: tenant.tagline,
                  description: tenant.description,
                  phone: tenant.phone,
                  email: tenant.email,
                  address: tenant.address,
                  website: tenant.website,
                  instagram_url: tenant.instagram_url,
                  whatsapp: tenant.whatsapp,
                  logo_url: tenant.logo_url,
                  primary_color: tenant.primary_color,
                  secondary_color: tenant.secondary_color,
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios de atención</CardTitle>
            <CardDescription>
              El motor de disponibilidad calcula los espacios libres con estos
              rangos semanales.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AvailabilityList
              items={availability.map((a: any) => ({
                id: a.id,
                day_of_week: a.day_of_week,
                start_time: a.start_time,
                end_time: a.end_time,
              }))}
            />
            <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <AvailabilityForm />
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones por email</CardTitle>
              <CardDescription>
                Tus credenciales de EmailJS (Public Key, Service ID y Template
                ID).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <EmailJSForm
                settings={{
                  emailjs_public_key: settings?.emailjs_public_key ?? null,
                  emailjs_service_id: settings?.emailjs_service_id ?? null,
                  emailjs_template_id: settings?.emailjs_template_id ?? null,
                  confirmation_template_id:
                    settings?.confirmation_template_id ?? null,
                  reminder_template_id: settings?.reminder_template_id ?? null,
                }}
              />
            </CardContent>
          </Card>
        )}

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Invita a tu equipo</CardTitle>
              <CardDescription>
                Genera códigos para que colaboradores accedan a tu agenda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <InviteForm />
              {invitations.length > 0 && (
                <>
                  <p className="mt-6 text-sm font-semibold text-slate-700">
                    Códigos emitidos
                  </p>
                  <ul className="mt-2 divide-y divide-slate-100">
                    {invitations.map((inv: any) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="font-mono font-bold tracking-wide text-slate-800">
                          {inv.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {inv.type === "staff" ? "Colaborador" : "Referido"} ·
                          usos: {inv.used_count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}