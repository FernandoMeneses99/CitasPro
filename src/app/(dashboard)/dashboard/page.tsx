import Link from "next/link";
import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppointmentTime } from "@/components/dashboard/rows";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from "@/lib/constants";

export const metadata = { title: "Panel" };

export default async function OverviewPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();
  const tenantId = profile.tenant_id!;

  const [appointmentsCount, customersCount, servicesCount, todayAppointments, promotionsCount] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true),
      supabase
        .from("appointments")
        .select("id, starts_at, status, customers(name), services(name)")
        .eq("tenant_id", tenantId)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(6),
      supabase
        .from("promotions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true),
    ]);

  const stats = [
    { label: "Próximas citas", value: appointmentsCount.count ?? 0, href: "/dashboard/agenda" },
    { label: "Clientes", value: customersCount.count ?? 0, href: "/dashboard/clientes" },
    { label: "Servicios activos", value: servicesCount.count ?? 0, href: "/dashboard/servicios" },
    { label: "Promociones activas", value: promotionsCount.count ?? 0, href: "/dashboard/promociones" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {profile.full_name?.split(" ")[0] ?? ""} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen de tu negocio y próximas citas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition hover:shadow-md">
              <CardContent className="px-6 py-5">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas citas</CardTitle>
          <CardDescription>Las siguientes reservas en tu agenda.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {todayAppointments.data && todayAppointments.data.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {todayAppointments.data.map((appt: any) => (
                <li
                  key={appt.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <AppointmentTime startsAt={appt.starts_at} />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    <span className="font-semibold">{appt.customers?.name}</span>{" "}
                    · {appt.services?.name}
                  </p>
                  <Badge className={APPOINTMENT_STATUS_STYLES[appt.status as keyof typeof APPOINTMENT_STATUS_STYLES] ?? ""}>
                    {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS] ?? appt.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">
              No hay citas próximas. Revisa tu{" "}
              <Link href="/dashboard/agenda" className="font-semibold text-indigo-600">
                agenda
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}