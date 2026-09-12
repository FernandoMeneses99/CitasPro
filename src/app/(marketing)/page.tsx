import Link from "next/link";

const features = [
  {
    title: "Agenda inteligente",
    description:
      "Calendario interactivo con vistas diaria, semanal y mensual. Reprograma, cancela y bloquea horarios en segundos.",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  },
  {
    title: "Disponibilidad automática",
    description:
      "El motor calcula los espacios libres reales según tus horarios, la duración del servicio y los bloqueos.",
    icon: "M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z",
  },
  {
    title: "Página pública con SEO",
    description:
      "Cada profesional obtiene su landing indexable con servicios, precios, promociones y botón de reserva.",
    icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.7 4 6.2 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.2-4-10s1.5-7.3 4-10z",
  },
  {
    title: "Multi-negocio y roles",
    description:
      "Cada negocio opera aislado. Administra dueños, colaboradores y clientes con permisos configurables.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
  {
    title: "Notificaciones por email",
    description:
      "Integra tus propias credenciales de EmailJS y envía confirmaciones, recordatorios y avisos de cancelación.",
    icon: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  },
  {
    title: "Promociones y referidos",
    description:
      "Crea descuentos, códigos promocionales y campañas de invitación para hacer crecer tu negocio.",
    icon: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  },
];

const professions = [
  "Psicólogos",
  "Médicos",
  "Odontólogos",
  "Abogados",
  "Esteticistas",
  "Barberos",
  "Estilistas",
  "Spas",
];

const plans = [
  {
    name: "Emprendedor",
    price: "Gratis",
    period: "durante el lanzamiento",
    features: [
      "Agenda y reservas online",
      "Página pública con tu marca",
      "Servicios ilimitados",
      "Hasta 100 citas al mes",
    ],
    highlight: false,
    cta: "Crear cuenta",
  },
  {
    name: "Profesional",
    price: "$49.900",
    period: "COP / mes",
    features: [
      "Todo lo del plan Emprendedor",
      "Citas ilimitadas",
      "Colaboradores y roles",
      "Recordatorios con EmailJS",
      "Promociones y códigos",
    ],
    highlight: true,
    cta: "Empezar ahora",
  },
  {
    name: "Negocio",
    price: "Próximamente",
    period: "multi-sede",
    features: [
      "Varias sedes y agendas",
      "Pagos online",
      "WhatsApp API",
      "Dominio personalizado",
    ],
    highlight: false,
    cta: "Hablar con ventas",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              SaaS multi-tenant para profesionales
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Tu agenda profesional,{" "}
              <span className="text-indigo-600">sin complicaciones</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Citas Pro digitaliza y automatiza la gestión de citas, clientes y
              reservas. Diseñado para psicólogos, médicos, odontólogos,
              abogados, barberos, estilistas y spas.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Comenzar gratis
              </Link>
              <Link
                href="/dra-marta"
                className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                Ver página demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Sin tarjeta de crédito · Configúralo en menos de 5 minutos
            </p>
          </div>
        </div>
      </section>

      <section id="funciones" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Todo lo que necesita tu negocio
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Un sistema completo, seguro y aislado para cada profesional.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={feature.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="profesiones" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Para cada profesión
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {professions.map((profession) => (
              <span
                key={profession}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {profession}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Precios simples
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Empieza gratis y crece cuando lo necesites.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border bg-white p-8 shadow-sm ${
                plan.highlight
                  ? "border-indigo-600 ring-2 ring-indigo-600"
                  : "border-slate-200"
              }`}
            >
              {plan.highlight && (
                <span className="mb-4 self-start rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-none text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415L8.5 12.086l6.79-6.795a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-8 rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                  plan.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-slate-900 text-white hover:bg-slate-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section
        id="contacto"
        className="mx-auto max-w-7xl px-4 pb-24 sm:px-6"
      >
        <div className="rounded-3xl bg-indigo-600 px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Digitaliza tu agenda hoy mismo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            Únete a los profesionales que ya gestionan sus citas con Citas Pro.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>
    </>
  );
}