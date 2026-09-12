import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/constants";

export type Profile = {
  id: string;
  tenant_id: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, tenant_id, email, full_name, phone, avatar_url, role, is_active",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireTenantMember(): Promise<Profile> {
  const profile = await requireProfile();
  const canAccess =
    profile.role === ROLES.OWNER ||
    profile.role === ROLES.STAFF ||
    profile.role === ROLES.ZENTRO_ADMIN;
  if (!canAccess) redirect("/onboard");
  if (profile.role === ROLES.ZENTRO_ADMIN && !profile.tenant_id) return profile;
  if (!profile.tenant_id) redirect("/onboard");
  return profile;
}

export async function requireTenantOwner(): Promise<Profile> {
  const profile = await requireTenantMember();
  if (profile.role !== ROLES.OWNER) {
    throw new Error("Se requieren permisos de administrador del negocio");
  }
  return profile;
}

export async function getUserRole(): Promise<Role | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}