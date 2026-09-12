"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTenantOwner, requireTenantMember } from "@/lib/tenant";

export type DashState = { error?: string; success?: string };

// ---------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------
export async function createServiceAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const duration = Number(formData.get("duration_minutes"));
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !duration || duration <= 0) {
    return { error: "Nombre y duración (mayor a 0 min) son obligatorios" };
  }

  const { error } = await supabase.from("services").insert({
    tenant_id: profile.tenant_id!,
    name,
    description: description || null,
    duration_minutes: duration,
    price: priceRaw === "" ? null : Number(priceRaw),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/servicios");
  return { success: "Servicio creado" };
}

export async function toggleServiceAction(id: string): Promise<void> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select("is_active")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!)
    .single();

  await supabase
    .from("services")
    .update({ is_active: !data?.is_active })
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!);

  revalidatePath("/dashboard/servicios");
}

// ---------------------------------------------------------------
// Citas
// ---------------------------------------------------------------
export async function createAppointmentAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const serviceId = String(formData.get("service_id") ?? "");
  const startsAtRaw = String(formData.get("starts_at") ?? "");
  const status = String(formData.get("status") ?? "pending");
  const customerId = String(formData.get("customer_id") ?? "");

  if (!serviceId || !startsAtRaw) {
    return { error: "Servicio y fecha/hora son obligatorios" };
  }

  const startsAt = new Date(startsAtRaw).toISOString();
  if (Number.isNaN(Date.parse(startsAt))) {
    return { error: "Fecha inválida" };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("tenant_id", profile.tenant_id!)
    .single();

  if (!service) return { error: "El servicio no existe" };

  const endsAt = new Date(
    new Date(startsAt).getTime() + service.duration_minutes * 60000,
  ).toISOString();

  let finalCustomerId = customerId;
  if (!finalCustomerId) {
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (!name) return { error: "Nombre del cliente es obligatorio" };

    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("tenant_id", profile.tenant_id!)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      finalCustomerId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          tenant_id: profile.tenant_id!,
          name,
          email: email || null,
          phone: phone || null,
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      finalCustomerId = created.id;
    }
  }

  const { error } = await supabase.from("appointments").insert({
    tenant_id: profile.tenant_id!,
    customer_id: finalCustomerId,
    service_id: serviceId,
    starts_at: startsAt,
    ends_at: endsAt,
    status,
    source: "manual",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  return { success: "Cita creada" };
}

export async function updateAppointmentStatusAction(
  id: string,
  status: string,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  return { success: "Cita actualizada" };
}

// ---------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------
export async function createCustomerAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) return { error: "El nombre es obligatorio" };

  const { error } = await supabase.from("customers").insert({
    tenant_id: profile.tenant_id!,
    name,
    email: email || null,
    phone: phone || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/clientes");
  return { success: "Cliente agregado" };
}

// ---------------------------------------------------------------
// Promociones
// ---------------------------------------------------------------
export async function createPromotionAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const discountType = String(formData.get("discount_type") ?? "percent");
  const discountValue = Number(formData.get("discount_value"));
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();

  if (!code || !discountValue || discountValue <= 0) {
    return { error: "Código y valor del descuento son obligatorios" };
  }

  const { error } = await supabase.from("promotions").insert({
    tenant_id: profile.tenant_id!,
    code,
    name: name || null,
    discount_type: discountType,
    discount_value: discountValue,
    ends_at: endsAtRaw ? new Date(endsAtRaw).toISOString() : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/promociones");
  return { success: "Promoción creada" };
}

export async function togglePromotionAction(id: string): Promise<void> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const { data } = await supabase
    .from("promotions")
    .select("is_active")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!)
    .single();

  await supabase
    .from("promotions")
    .update({ is_active: !data?.is_active })
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!);

  revalidatePath("/dashboard/promociones");
}

// ---------------------------------------------------------------
// Configuración: negocio + branding
// ---------------------------------------------------------------
export async function updateBusinessInfoAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const payload = {
    business_name: String(formData.get("business_name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    instagram_url: String(formData.get("instagram_url") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    primary_color: String(formData.get("primary_color") ?? "").trim(),
    secondary_color: String(formData.get("secondary_color") ?? "").trim(),
  };

  if (!payload.business_name) return { error: "El nombre del negocio es obligatorio" };

  const { error } = await supabase
    .from("tenants")
    .update(payload)
    .eq("id", profile.tenant_id!);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/configuracion");
  return { success: "Información actualizada" };
}

export async function addAvailabilityAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (!dayOfWeek || !startTime || !endTime) {
    return { error: "Día, hora de inicio y fin son obligatorios" };
  }

  const { error } = await supabase.from("availability").insert({
    tenant_id: profile.tenant_id!,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/configuracion");
  return { success: "Horario agregado" };
}

export async function deleteAvailabilityAction(id: string): Promise<void> {
  const profile = await requireTenantMember();
  const supabase = await createClient();

  await supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id!);

  revalidatePath("/dashboard/configuracion");
}

// ---------------------------------------------------------------
// Configuración: EmailJS (solo owner)
// ---------------------------------------------------------------
export async function updateEmailJSSettingsAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantOwner();
  const supabase = await createClient();

  const payload = {
    emailjs_public_key: String(formData.get("emailjs_public_key") ?? "").trim() || null,
    emailjs_service_id: String(formData.get("emailjs_service_id") ?? "").trim() || null,
    emailjs_template_id: String(formData.get("emailjs_template_id") ?? "").trim() || null,
    confirmation_template_id: String(formData.get("confirmation_template_id") ?? "").trim() || null,
    reminder_template_id: String(formData.get("reminder_template_id") ?? "").trim() || null,
  };

  const { error } = await supabase
    .from("tenant_settings")
    .upsert({ tenant_id: profile.tenant_id!, ...payload })
    .eq("tenant_id", profile.tenant_id!);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/configuracion");
  return { success: "Configuración de email guardada" };
}

// ---------------------------------------------------------------
// Invitaciones de staff (solo owner)
// ---------------------------------------------------------------
export async function createStaffInvitationAction(
  _prev: DashState,
  formData: FormData,
): Promise<DashState> {
  const profile = await requireTenantOwner();
  const supabase = await createClient();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "El código es obligatorio" };

  const { error } = await supabase.from("invitations").insert({
    tenant_id: profile.tenant_id!,
    code,
    type: "staff",
    benefit: "Acceso como colaborador",
    max_uses: 1,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/configuracion");
  return { success: `Código ${code} creado. Compártelo con tu colaborador.` };
}

export async function dashboardLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}