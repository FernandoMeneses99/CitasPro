"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
};

type Slot = {
  starts_at: string;
  staff_id: string | null;
  staff_name: string | null;
};

type Message = { type: "error" | "success"; text: string } | null;

export function BookingForm({
  tenantSlug,
  services,
}: {
  tenantSlug: string;
  services: PublicService[];
}) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<Message>(null);

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  async function loadSlots() {
    if (!serviceId || !date) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_available_slots", {
      p_tenant_slug: tenantSlug,
      p_service_id: serviceId,
      p_date: date,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setSlots((data as Slot[] | null) ?? []);
    setSelected(null);
  }

  async function submit() {
    if (!selected || !name || !email) {
      setMessage({ type: "error", text: "Completa tus datos y elige un horario" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const selectedSlot = slots.find((s) => s.starts_at === selected);
    const supabase = createClient();
    const { error } = await supabase.rpc("book_appointment", {
      p_tenant_slug: tenantSlug,
      p_service_id: serviceId,
      p_staff_id: selectedSlot?.staff_id ?? null,
      p_starts_at: selected,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_notes: notes,
    });
    setSubmitting(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({
      type: "success",
      text: "¡Solicitud enviada! El negocio te confirmará tu cita.",
    });
    setSlots([]);
    setSelected(null);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setDate("");
  }

  const grouped = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = slot.staff_name ?? "Agenda general";
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="service">Servicio</Label>
        <Select
          id="service"
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSlots([]);
          }}
        >
          <option value="">Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.duration_minutes} min
              {s.price ? ` · ${formatCurrency(s.price)}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="date" className="mb-0 pb-1.5">
          Fecha
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setDate(e.target.value);
            setSlots([]);
          }}
        />
      </div>

      <Button
        type="button"
        onClick={loadSlots}
        disabled={!serviceId || !date || loading}
        className="w-full"
      >
        {loading ? "Buscando horarios..." : "Ver horarios disponibles"}
      </Button>

      {slots.length === 0 && !loading && serviceId && date && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          No hay horarios disponibles para este día.
        </p>
      )}

      {Object.entries(grouped).map(([staff, items]) => (
        <div key={staff}>
          {items[0].staff_name && (
            <p className="mb-2 text-sm font-semibold text-slate-700">{staff}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {items.map((slot) => {
              const time = new Intl.DateTimeFormat("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }).format(new Date(slot.starts_at));
              const active = selected === slot.starts_at;
              return (
                <button
                  key={slot.starts_at}
                  type="button"
                  onClick={() => setSelected(slot.starts_at)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400",
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected && (
        <div className="space-y-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div>
            <Label htmlFor="bk-name">Nombre</Label>
            <Input
              id="bk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <Label htmlFor="bk-email">Correo</Label>
            <Input
              id="bk-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <Label htmlFor="bk-phone">Teléfono</Label>
            <Input
              id="bk-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="bk-notes">Notas</Label>
            <Textarea
              id="bk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cuéntale al profesional el motivo de tu visita (opcional)"
              rows={3}
            />
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Enviando..." : "Solicitar cita"}
          </Button>
        </div>
      )}

      {message && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}