"use client";

import { useTransition } from "react";
import { deleteAvailabilityAction } from "@/lib/actions/dashboard";
import { DAYS_OF_WEEK } from "@/lib/constants";

type AvailabilityRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export function AvailabilityList({ items }: { items: AvailabilityRow[] }) {
  const [pending, startTransition] = useTransition();

  const sorted = [...items].sort(
    (a, b) =>
      a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
  );

  return (
    <div className="mt-4 space-y-2">
      {sorted.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          No hay horarios configurados. El motor de disponibilidad no mostrará
          citas hasta que agregues uno.
        </p>
      )}
      {sorted.map((item) => {
        const day = DAYS_OF_WEEK.find((d) => d.value === item.day_of_week);
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{day?.label}</p>
              <p className="text-sm text-slate-500">
                {item.start_time.slice(0, 5)} — {item.end_time.slice(0, 5)}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteAvailabilityAction(item.id))}
              className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        );
      })}
    </div>
  );
}