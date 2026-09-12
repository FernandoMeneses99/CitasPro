import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ServiceForm } from "@/components/dashboard/forms";
import { ServiceRow } from "@/components/dashboard/rows";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Servicios" };

export default async function ServicesPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, description, duration_minutes, price, is_active, visible_public",
    )
    .eq("tenant_id", profile.tenant_id!)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catálogo visible en tu página pública con duración y precio.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Tus servicios</CardTitle>
            <CardDescription>Actívalos o desactívalos al instante.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {services && services.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {services.map((service: any) => (
                  <li
                    key={service.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-slate-900">
                        {service.name}
                        {service.price !== null && (
                          <span className="text-sm font-bold text-indigo-600">
                            {formatCurrency(service.price)}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        {service.duration_minutes} min
                        {service.description
                          ? ` · ${service.description}`
                          : ""}
                      </p>
                    </div>
                    <ServiceRow id={service.id} isActive={service.is_active} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Crea tu primer servicio para mostrarlo en tu página pública.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nuevo servicio</CardTitle>
            <CardDescription>Duración y precio configurable.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ServiceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}