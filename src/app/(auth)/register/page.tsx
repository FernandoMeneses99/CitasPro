"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const [accountType, setAccountType] = useState("professional");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
        <CardDescription>
          Empieza gratis y configura tu negocio en minutos.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="accountType" value={accountType} />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType("professional")}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                accountType === "professional"
                  ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <span className="block font-semibold text-slate-900">
                Soy profesional
              </span>
              <span className="text-xs text-slate-500">
                Creo mi negocio y agenda
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("staff")}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                accountType === "staff"
                  ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <span className="block font-semibold text-slate-900">
                Soy colaborador
              </span>
              <span className="text-xs text-slate-500">
                Me uno con un código
              </span>
            </button>
          </div>

          <div>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>

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

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Ingresa
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}