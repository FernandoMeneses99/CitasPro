"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DAYS_OF_WEEK, APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import {
  addAvailabilityAction,
  createAppointmentAction,
  createCustomerAction,
  createPromotionAction,
  createServiceAction,
  createStaffInvitationAction,
  updateBusinessInfoAction,
  updateEmailJSSettingsAction,
  type DashState,
} from "@/lib/actions/dashboard";

const noState: DashState = {};

function Notice({ state }: { state: DashState }) {
  return (
    <>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
    </>
  );
}

// ----------------------------------------------------------
export function ServiceForm() {
  const [state, formAction, pending] = useActionState(
    createServiceAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="sv-name">Servicio</Label>
        <Input id="sv-name" name="name" placeholder="Ej. Consulta inicial" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sv-dur">Duración (min)</Label>
          <Input id="sv-dur" name="duration_minutes" type="number" min={5} step={5} defaultValue={30} required />
        </div>
        <div>
          <Label htmlFor="sv-price">Precio</Label>
          <Input id="sv-price" name="price" type="number" min={0} placeholder="Opcional" />
        </div>
      </div>
      <div>
        <Label htmlFor="sv-desc">Descripción</Label>
        <Textarea id="sv-desc" name="description" rows={2} placeholder="Opcional" />
      </div>
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Crear servicio"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function AppointmentForm({
  services,
}: {
  services: { id: string; name: string; duration_minutes: number }[];
}) {
  const [state, formAction, pending] = useActionState(
    createAppointmentAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="ap-service">Servicio</Label>
        <Select
          id="ap-service"
          name="service_id"
          defaultValue=""
          options={[
            { value: "", label: "Selecciona..." },
            ...services.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.duration_minutes} min)`,
            })),
          ]}
          required
        />
      </div>
      <div>
        <Label htmlFor="ap-datetime">Fecha y hora</Label>
        <Input id="ap-datetime" name="starts_at" type="datetime-local" required />
      </div>
      <div>
        <Label htmlFor="ap-name">Nombre del cliente</Label>
        <Input id="ap-name" name="name" placeholder="Cliente nuevo" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ap-email">Email</Label>
          <Input id="ap-email" name="email" type="email" placeholder="Opcional" />
        </div>
        <div>
          <Label htmlFor="ap-phone">Teléfono</Label>
          <Input id="ap-phone" name="phone" placeholder="Opcional" />
        </div>
      </div>
      <div>
        <Label htmlFor="ap-status">Estado inicial</Label>
        <Select
          id="ap-status"
          name="status"
          defaultValue="pending"
          options={Object.entries(APPOINTMENT_STATUS_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
        />
      </div>
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : "Crear cita"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function CustomerForm() {
  const [state, formAction, pending] = useActionState(
    createCustomerAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="cu-name">Nombre</Label>
        <Input id="cu-name" name="name" placeholder="Nombre del cliente" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cu-email">Email</Label>
          <Input id="cu-email" name="email" type="email" placeholder="Opcional" />
        </div>
        <div>
          <Label htmlFor="cu-phone">Teléfono</Label>
          <Input id="cu-phone" name="phone" placeholder="Opcional" />
        </div>
      </div>
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Agregando..." : "Agregar cliente"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function PromotionForm() {
  const [state, formAction, pending] = useActionState(
    createPromotionAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pr-code">Código</Label>
          <Input
            id="pr-code"
            name="code"
            placeholder="BIENVENIDO10"
            className="uppercase"
            required
          />
        </div>
        <div>
          <Label htmlFor="pr-name">Nombre</Label>
          <Input id="pr-name" name="name" placeholder="Ej. Bienvenida" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pr-type">Tipo</Label>
          <Select
            id="pr-type"
            name="discount_type"
            options={[
              { value: "percent", label: "Porcentaje (%)" },
              { value: "fixed", label: "Monto fijo ($)" },
            ]}
            defaultValue="percent"
          />
        </div>
        <div>
          <Label htmlFor="pr-value">Valor</Label>
          <Input id="pr-value" name="discount_value" type="number" min={1} required />
        </div>
      </div>
      <div>
        <Label htmlFor="pr-ends">Válida hasta</Label>
        <Input id="pr-ends" name="ends_at" type="date" />
      </div>
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Crear promoción"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function AvailabilityForm() {
  const [state, formAction, pending] = useActionState(
    addAvailabilityAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="av-day">Día</Label>
        <Select
          id="av-day"
          name="day_of_week"
          options={DAYS_OF_WEEK.map((d) => ({
            value: String(d.value),
            label: d.label,
          }))}
          defaultValue="1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="av-start">Inicio</Label>
          <Input id="av-start" name="start_time" type="time" defaultValue="09:00" required />
        </div>
        <div>
          <Label htmlFor="av-end">Fin</Label>
          <Input id="av-end" name="end_time" type="time" defaultValue="18:00" required />
        </div>
      </div>
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Agregando..." : "Agregar horario"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
type TenantInfo = {
  business_name: string;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
};

export function BusinessInfoForm({ tenant }: { tenant: TenantInfo }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessInfoAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bi-name">Nombre del negocio</Label>
          <Input id="bi-name" name="business_name" defaultValue={tenant.business_name} required />
        </div>
        <div>
          <Label htmlFor="bi-tagline">Eslogan</Label>
          <Input id="bi-tagline" name="tagline" defaultValue={tenant.tagline ?? ""} placeholder="Ej. El arte del buen corte" />
        </div>
      </div>
      <div>
        <Label htmlFor="bi-desc">Descripción</Label>
        <Textarea id="bi-desc" name="description" rows={4} defaultValue={tenant.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bi-phone">Teléfono</Label>
          <Input id="bi-phone" name="phone" defaultValue={tenant.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="bi-email">Email de contacto</Label>
          <Input id="bi-email" name="email" type="email" defaultValue={tenant.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="bi-address">Dirección</Label>
          <Input id="bi-address" name="address" defaultValue={tenant.address ?? ""} />
        </div>
        <div>
          <Label htmlFor="bi-logo">URL del logo</Label>
          <Input id="bi-logo" name="logo_url" defaultValue={tenant.logo_url ?? ""} placeholder="https://..." />
        </div>
        <div>
          <Label htmlFor="bi-whatsapp">WhatsApp (solo dígitos)</Label>
          <Input id="bi-whatsapp" name="whatsapp" defaultValue={tenant.whatsapp ?? ""} placeholder="573001112222" />
        </div>
        <div>
          <Label htmlFor="bi-instagram">Instagram</Label>
          <Input id="bi-instagram" name="instagram_url" defaultValue={tenant.instagram_url ?? ""} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <Label htmlFor="bi-website">Sitio web</Label>
          <Input id="bi-website" name="website" defaultValue={tenant.website ?? ""} />
        </div>
        <div>
          <Label htmlFor="bi-color1">Color principal</Label>
          <div className="flex items-center gap-2">
            <input
              id="bi-color1"
              name="primary_color"
              type="color"
              defaultValue={tenant.primary_color}
              className="h-9 w-12 cursor-pointer rounded border border-slate-300"
            />
            <span className="text-xs text-slate-500">{tenant.primary_color}</span>
          </div>
        </div>
      </div>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function EmailJSForm({
  settings,
}: {
  settings: {
    emailjs_public_key: string | null;
    emailjs_service_id: string | null;
    emailjs_template_id: string | null;
    confirmation_template_id: string | null;
    reminder_template_id: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateEmailJSSettingsAction,
    noState,
  );
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-slate-500">
        Cada negocio usa sus propias credenciales de EmailJS (crea tus templates
        en emailjs.com).
      </p>
      <div>
        <Label htmlFor="ej-pub">Public Key</Label>
        <Input id="ej-pub" name="emailjs_public_key" defaultValue={settings.emailjs_public_key ?? ""} placeholder="ej. AbC123xY" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ej-svc">Service ID</Label>
          <Input id="ej-svc" name="emailjs_service_id" defaultValue={settings.emailjs_service_id ?? ""} placeholder="ej. service_xxxx" />
        </div>
        <div>
          <Label htmlFor="ej-tpl">Template ID (nueva cita)</Label>
          <Input id="ej-tpl" name="emailjs_template_id" defaultValue={settings.emailjs_template_id ?? ""} placeholder="ej. template_aaaa" />
        </div>
        <div>
          <Label htmlFor="ej-conf">Template (confirmación)</Label>
          <Input id="ej-conf" name="confirmation_template_id" defaultValue={settings.confirmation_template_id ?? ""} placeholder="Opcional" />
        </div>
        <div>
          <Label htmlFor="ej-rem">Template (recordatorio)</Label>
          <Input id="ej-rem" name="reminder_template_id" defaultValue={settings.reminder_template_id ?? ""} placeholder="Opcional" />
        </div>
      </div>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar EmailJS"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------
export function InviteForm() {
  const [state, formAction, pending] = useActionState(
    createStaffInvitationAction,
    noState,
  );
  const [copied, setCopied] = useState(false);
  const code = state.success?.match(/Código (\w+) creado/)?.[1];

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-slate-500">
        Genera un código para que un colaborador se una a tu negocio.
      </p>
      <div>
        <Label htmlFor="inv-code">Código</Label>
        <Input
          id="inv-code"
          name="code"
          placeholder="Ej. ANDRES2026"
          className="uppercase"
          required
        />
      </div>
      <Notice state={state} />
      {code && (
        <button
          type="button"
          className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
          onClick={() => {
            navigator.clipboard.writeText(`Citas Pro · Código colaborador: ${code} · Regístrate en /register y elige "Soy colaborador"`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copiado" : "Copiar código"}
        </button>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Crear invitación"}
      </Button>
    </form>
  );
}