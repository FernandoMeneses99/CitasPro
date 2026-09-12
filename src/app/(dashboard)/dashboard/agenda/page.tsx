import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppointmentForm } from "@/components/dashboard/forms";
import { AppointmentStatusSelect, AppointmentTime } from "@/components/dashboard/rows";

export const metadata = { title: "Agenda" };

export default async function AgendaPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();
  const tenantId = profile.tenant_id!;

  const [appointmentsResult, servicesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, starts_at, status, customers(name, email, phone), services(name), staff_id",
      )
      .eq("tenant_id", tenantId)
      .order("starts_at", { ascending: false })
      .limit(30),
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name"),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const services = servicesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea citas manualmente o gestiona el estado de las reservas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Últimas citas</CardTitle>
            <CardDescription>Las 30 más recientes de tu agenda.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Aún no tienes citas. Crea la primera o comparte tu página pública
                para recibir solicitudes.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {appointments.map((appt: any) => (
                  <li
                    key={appt.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <AppointmentTime startsAt={appt.starts_at} />
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">
                          {appt.customers?.name ?? "Cliente"}
                        </span>{" "}
                        · {appt.services?.name}
                        {appt.customers?.phone ? ` · ${appt.customers.phone}` : ""}
                      </p>
                    </div>
                    <AppointmentStatusSelect appointment={appt} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nueva cita</CardTitle>
            <CardDescription>Registra una reserva manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AppointmentForm
              services={services.map((s: any) => ({
                id: s.id,
                name: s.name,
                duration_minutes: s.duration_minutes,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}