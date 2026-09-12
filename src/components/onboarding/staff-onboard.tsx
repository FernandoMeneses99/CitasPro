"use client";

import { useActionState, useState } from "react";
import { joinWithCodeAction, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function StaffOnboard({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(
    joinWithCodeAction,
    initialState,
  );
  const [name, setName] = useState(fullName);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-slate-500">
        Ingresa el código de invitación que tu negocio te compartió para unirte
        como colaborador.
      </p>
      <div>
        <Label htmlFor="joinName">Tu nombre completo</Label>
        <Input
          id="joinName"
          name="fullName"
          defaultValue={fullName}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
        />
      </div>
      <div>
        <Label htmlFor="code">Código de invitación</Label>
        <Input
          id="code"
          name="code"
          placeholder="EJEMPLO123"
          className="uppercase"
          required
          autoFocus
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verificando..." : "Unirme al negocio"}
      </Button>
    </form>
  );
}