import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/tenant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfessionalOnboard } from "@/components/onboarding/professional-onboard";
import { StaffOnboard } from "@/components/onboarding/staff-onboard";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "Configura tu cuenta" };

async function OnboardContent({
  type,
  name,
}: {
  type: string;
  name: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isStaff = type === "staff";
  const isReady =
    profile.role === ROLES.OWNER ||
    profile.role === ROLES.STAFF ||
    profile.role === ROLES.ZENTRO_ADMIN;
  if (isReady) redirect("/dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Configura tu cuenta</CardTitle>
        <CardDescription>
          {isStaff
            ? "Únete al negocio con tu código de invitación"
            : "Crea el espacio de trabajo de tu negocio"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isStaff ? (
          <StaffOnboard fullName={name} />
        ) : (
          <ProfessionalOnboard fullName={name} />
        )}
      </CardContent>
    </Card>
  );
}

export default function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; name?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
          </svg>
        </span>
        <span className="text-xl font-bold tracking-tight">
          Citas<span className="text-indigo-600">Pro</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        <Suspense>
          <OnboardContentAsync searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function OnboardContentAsync({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; name?: string }>;
}) {
  const { type, name } = await searchParams;
  return <OnboardContent type={type ?? "professional"} name={name ?? ""} />;
}