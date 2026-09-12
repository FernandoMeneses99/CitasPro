import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CustomerForm } from "@/components/dashboard/forms";

export const metadata = { title: "Clientes" };

export default async function CustomersPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone, created_at")
    .eq("tenant_id", profile.tenant_id!)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tu base de clientes se alimenta con cada reserva o alta manual.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Todos los clientes</CardTitle>
            <CardDescription>{customers?.length ?? 0} registrados.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {customers && customers.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {customers.map((customer: any) => (
                  <li
                    key={customer.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {customer.email ?? "Sin email"}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(customer.created_at))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Aún no hay clientes. Las reservas públicas los agregan
                automáticamente.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Agregar cliente</CardTitle>
            <CardDescription>Registra un cliente manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <CustomerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}