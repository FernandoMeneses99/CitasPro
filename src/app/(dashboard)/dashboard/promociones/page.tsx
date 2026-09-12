import { requireTenantMember } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PromotionForm } from "@/components/dashboard/forms";
import { PromotionRow } from "@/components/dashboard/rows";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Promociones" };

export default async function PromotionsPage() {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, code, name, discount_type, discount_value, ends_at, is_active")
    .eq("tenant_id", profile.tenant_id!)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promociones</h1>
        <p className="mt-1 text-sm text-slate-500">
          Descuentos y códigos visibles en tu página pública.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Tus promociones</CardTitle>
            <CardDescription>Los clientes ven el código al reservar.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {promotions && promotions.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {promotions.map((promo: any) => (
                  <li
                    key={promo.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold tracking-widest text-indigo-600">
                        {promo.code}
                      </p>
                      <p className="text-sm text-slate-500">
                        {promo.name ?? "Sin nombre"} ·{" "}
                        {promo.discount_type === "percent"
                          ? `${promo.discount_value}%`
                          : formatCurrency(promo.discount_value)}
                        {promo.ends_at
                          ? ` · hasta ${new Intl.DateTimeFormat("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(promo.ends_at))}`
                          : " · sin fecha límite"}
                      </p>
                    </div>
                    <PromotionRow id={promo.id} isActive={promo.is_active} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Crea descuentos con códigos como BIENVENIDO10.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nueva promoción</CardTitle>
            <CardDescription>Código, descuento y vigencia.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <PromotionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}