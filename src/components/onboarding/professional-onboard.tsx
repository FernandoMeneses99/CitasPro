"use client";

import { useActionState, useState } from "react";
import { onboardProfessionalAction, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

const initialState: ActionState = {};

export function ProfessionalOnboard({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(
    onboardProfessionalAction,
    initialState,
  );
  const [name, setName] = useState("");
  const slug = slugify(name);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-slate-500">
        Hola <strong className="text-slate-900">{fullName}</strong>, crea tu
        espacio profesional.
      </p>
      <div>
        <Label htmlFor="businessName">Nombre del negocio</Label>
        <Input
          id="businessName"
          name="businessName"
          placeholder="Ej. Dra. Marta Psicóloga"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="slug">URL pública de tu página</Label>
        <div className="flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          <span className="flex-none">citas.pro/</span>
          <input
            id="slug"
            name="slug"
            className="min-w-0 flex-1 bg-transparent font-medium text-indigo-600 outline-none"
            placeholder={name ? slug : "tu-negocio"}
            defaultValue={""}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {slug ? `Se generaría: citas.pro/${slug}` : "Solo minúsculas, números y guiones"}
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !name.trim()}>
        {pending ? "Creando..." : "Crear mi negocio"}
      </Button>
    </form>
  );
}