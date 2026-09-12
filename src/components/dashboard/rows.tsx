"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  togglePromotionAction,
  toggleServiceAction,
  updateAppointmentStatusAction,
} from "@/lib/actions/dashboard";

function Toggle({
  id,
  isActive,
  action,
}: {
  id: string;
  isActive: boolean;
  action: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(id))}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition",
        isActive
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-slate-200 text-slate-600 hover:bg-slate-300",
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </button>
  );
}

export function ServiceRow({ id, isActive }: { id: string; isActive: boolean }) {
  return <Toggle id={id} isActive={isActive} action={toggleServiceAction} />;
}

export function PromotionRow({ id, isActive }: { id: string; isActive: boolean }) {
  return <Toggle id={id} isActive={isActive} action={togglePromotionAction} />;
}

type Appointment = {
  id: string;
  status: string;
};

export function AppointmentStatusSelect({
  appointment,
}: {
  appointment: Appointment;
}) {
  const [pending, startTransition] = useTransition();
  const status = appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS;

  return (
    <div className="flex items-center gap-2">
      <Badge className={APPOINTMENT_STATUS_STYLES[status]}>
        {APPOINTMENT_STATUS_LABELS[status]}
      </Badge>
      <Select
        value={appointment.status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => {
            updateAppointmentStatusAction(appointment.id, e.target.value);
          })
        }
        className="w-auto"
        options={Object.entries(APPOINTMENT_STATUS_LABELS).map(
          ([value, label]) => ({ value, label }),
        )}
      />
    </div>
  );
}

export function AppointmentTime({ startsAt }: { startsAt: string }) {
  return (
    <p className="whitespace-nowrap text-sm font-medium text-slate-900">
      {new Intl.DateTimeFormat("es-CO", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(startsAt))}
    </p>
  );
}