"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; success?: string };

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email y contraseña son obligatorios" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("accountType") ?? "professional");

  if (!fullName || !email || password.length < 8) {
    return {
      error: "Completa tus datos. La contraseña debe tener al menos 8 caracteres",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getAppUrl()}/login`,
    },
  });

  if (error) return { error: error.message };

  const userId = data?.user?.id;
  if (userId) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
  }

  if (data?.session) {
    redirect(`/onboard?type=${accountType}&name=${encodeURIComponent(fullName)}`);
  }

  return { success: "Revisa tu correo y confirma tu cuenta para continuar." };
}

export async function onboardProfessionalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!businessName) return { error: "El nombre del negocio es obligatorio" };

  const finalSlug = slug || slugify(businessName);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
    return {
      error: "La URL solo puede tener minúsculas, números y guiones",
    };
  }

  const { error } = await supabase.rpc("create_professional_tenant", {
    p_business_name: businessName,
    p_slug: finalSlug,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function joinWithCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!code) return { error: "Ingresa el código de invitación" };

  const { error } = await supabase.rpc("join_tenant_with_code", {
    p_code: code,
    p_full_name: fullName,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}