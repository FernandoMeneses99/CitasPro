import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm, type PublicService } from "@/components/booking/booking-form";
import { formatCurrency } from "@/lib/utils";

type PublicProfile = {
  id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
};

type PublicPromotion = {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  ends_at: string | null;
};

async function getPublicData(slug: string) {
  const supabase = await createClient();

  const { data: profileRow } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const profile = profileRow as PublicProfile | null;
  if (!profile) return { profile: null, services: [], promotions: [] };

  const [servicesResult, promotionsResult] = await Promise.all([
    supabase
      .from("public_services")
      .select("id, tenant_id, name, description, duration_minutes, price")
      .eq("tenant_id", profile.id)
      .order("name"),
    supabase
      .from("public_promotions")
      .select("id, tenant_id, code, name, description, discount_type, discount_value, ends_at")
      .eq("tenant_id", profile.id),
  ]);

  const services: PublicService[] = servicesResult.data
    ? servicesResult.data.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description as string | null,
        duration_minutes: s.duration_minutes,
        price: s.price as number | null,
      }))
    : [];

  const promotions = (promotionsResult.data ?? []) as PublicPromotion[];

  return { profile, services, promotions };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicData(slug);

  if (!data.profile) return { title: "Profesional no encontrado" };

  const title = data.profile.business_name;
  const description =
    data.profile.tagline ??
    data.profile.description ??
    `Agenda una cita con ${data.profile.business_name}`;

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: data.profile.logo_url ?? undefined,
    },
  };
}

export default async function PublicProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { profile, services, promotions } = await getPublicData(slug);

  if (!profile) notFound();

  const primary = profile.primary_color ?? "#4f46e5";
  const secondary = profile.secondary_color ?? "#0ea5e9";

  const contactItems = [
    profile.phone && { label: "Teléfono", value: profile.phone, href: `tel:${profile.phone}` },
    profile.website && { label: "Web", value: profile.website, href: profile.website },
    profile.whatsapp && { label: "WhatsApp", value: profile.whatsapp, href: `https://wa.me/${profile.whatsapp}` },
    profile.instagram_url && { label: "Instagram", value: "@" + profile.instagram_url.split("/").filter(Boolean).pop(), href: profile.instagram_url },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`:root{--tenant-primary:${primary};--tenant-secondary:${secondary}}`}</style>

      <section
        className="text-white"
        style={{
          background: `linear-gradient(120deg, ${primary}, ${secondary})`,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:px-6 sm:py-16 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            {profile.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="h-20 w-20 rounded-2xl bg-white object-cover shadow-lg sm:h-24 sm:w-24"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold shadow-lg sm:h-24 sm:w-24">
                {profile.business_name.charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {profile.business_name}
              </h1>
              {profile.tagline && (
                <p className="mt-1 text-white/90">{profile.tagline}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {contactItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full bg-white/15 px-3 py-1.5 font-medium backdrop-blur hover:bg-white/25"
              >
                {item.value}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-10">
          {profile.description && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">Acerca de</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {profile.description}
              </p>
              {profile.address && (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.address}
                </p>
              )}
            </section>
          )}

          {services.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">Servicios</h2>
              <div className="mt-4 space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {service.name}
                      </p>
                      {service.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          {service.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {service.duration_minutes} minutos
                      </p>
                    </div>
                    {service.price !== null && (
                      <p className="flex-none text-lg font-bold text-slate-900">
                        {formatCurrency(service.price)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {promotions.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">Promociones</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-xl border-2 border-dashed p-4"
                    style={{ borderColor: primary }}
                  >
                    <p className="font-mono text-sm font-bold tracking-widest" style={{ color: primary }}>
                      {promo.code}
                    </p>
                    {promo.name && (
                      <p className="mt-1 font-semibold text-slate-900">
                        {promo.name}
                      </p>
                    )}
                    {promo.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {promo.description}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {promo.discount_type === "percent"
                        ? `${promo.discount_value}% de descuento`
                        : formatCurrency(promo.discount_value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Agenda una cita</h2>
            <p className="mt-1 text-sm text-slate-500">
              Elige un servicio y te mostramos la disponibilidad real.
            </p>
            <div className="mt-5">
              <BookingForm tenantSlug={slug} services={services} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}