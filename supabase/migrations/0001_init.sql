-- =============================================================
-- Citas Pro · Esquema inicial SaaS Multi-Tenant (Supabase)
-- Aislamiento lógico por `tenants` + RLS por políticas
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Helper de timestamp global
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- Helpers RLS (security definer → evitan recursión)
-- -------------------------------------------------------------
create or replace function public.is_zentro_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'zentro_admin'
      and p.is_active
  );
$$;

create or replace function public.is_tenant_member(p_tenant uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = p_tenant
      and p.role in ('owner', 'staff')
      and p.is_active
  );
$$;

create or replace function public.is_tenant_owner(p_tenant uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = p_tenant
      and p.role = 'owner'
      and p.is_active
  );
$$;

-- -------------------------------------------------------------
-- tenants (El negocio/profesional = el tenant)
-- -------------------------------------------------------------
create table if not exists public.tenants (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique
                     check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_name      text not null,
  tagline            text,
  description        text,
  logo_url           text,
  cover_url          text,
  primary_color      text not null default '#4f46e5',
  secondary_color    text not null default '#0ea5e9',
  phone              text,
  email              text,
  address            text,
  website            text,
  facebook_url       text,
  instagram_url      text,
  whatsapp           text,
  owner_id           uuid references auth.users (id) on delete cascade,
  is_active          boolean not null default true,
  subscription_status text not null default 'trial'
                      check (subscription_status in ('trial','active','suspended','cancelled')),
  plan               text not null default 'basic',
  monthly_fee        numeric not null default 0 check (monthly_fee >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- profiles (usuarios de la plataforma + rol)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  tenant_id   uuid references public.tenants (id) on delete set null,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'client'
              check (role in ('zentro_admin','owner','staff','client')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- services (catálogo de cada negocio)
-- -------------------------------------------------------------
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  name             text not null,
  description      text,
  duration_minutes integer not null check (duration_minutes > 0),
  price            numeric check (price >= 0),
  visible_public   boolean not null default true,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index services_tenant_idx on public.services (tenant_id);

-- asignación servicio ↔ colaborador
create table if not exists public.service_staff (
  service_id uuid not null references public.services (id) on delete cascade,
  staff_id   uuid not null references public.profiles (id) on delete cascade,
  primary key (service_id, staff_id)
);

-- -------------------------------------------------------------
-- customers (clientes del negocio)
-- -------------------------------------------------------------
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create index customers_tenant_idx on public.customers (tenant_id);

-- -------------------------------------------------------------
-- appointments (núcleo de citas)
-- -------------------------------------------------------------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete restrict,
  staff_id    uuid references public.profiles (id) on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'pending'
              check (status in ('pending','confirmed','cancelled','completed','no_show')),
  notes       text,
  source      text not null default 'web' check (source in ('web','manual','staff','client','api')),
  cancelled_by text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_tenant_starts_idx on public.appointments (tenant_id, starts_at);
create index appointments_tenant_status_idx on public.appointments (tenant_id, status);

-- Evita solapamientos de citas confirmadas/pendientes (misma agenda)
create or replace function public.prevent_appointment_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.appointments a
    where a.tenant_id = new.tenant_id
      and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000')
      and a.status in ('pending','confirmed')
      and a.starts_at < new.ends_at
      and a.ends_at > new.starts_at
      and (new.staff_id is null or a.staff_id is null or a.staff_id = new.staff_id)
  ) then
    raise exception 'Conflicto de horario con una cita existente';
  end if;
  return new;
end;
$$;

create trigger appointments_no_overlap
before insert or update of starts_at, ends_at, staff_id, status, tenant_id
on public.appointments
for each row
when (new.status in ('pending','confirmed'))
execute function public.prevent_appointment_overlap();

-- -------------------------------------------------------------
-- availability (disponibilidad semanal)
-- -------------------------------------------------------------
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  staff_id    uuid references public.profiles (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7), -- ISO 1=Lun..7=Dom
  start_time  time not null,
  end_time    time not null check (end_time > start_time),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index availability_tenant_idx on public.availability (tenant_id, day_of_week);

-- -------------------------------------------------------------
-- blocks (bloqueos puntuales)
-- -------------------------------------------------------------
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  staff_id   uuid references public.profiles (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null check (ends_at > starts_at),
  reason     text,
  created_at timestamptz not null default now()
);

create index blocks_tenant_idx on public.blocks (tenant_id, starts_at);

-- -------------------------------------------------------------
-- promotions
-- -------------------------------------------------------------
create table if not exists public.promotions (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  code           text not null,
  name           text,
  description    text,
  discount_type  text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric not null check (discount_value > 0),
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz,
  max_uses       integer,
  used_count     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, code)
);

create index promotions_tenant_idx on public.promotions (tenant_id);

-- -------------------------------------------------------------
-- invitations (códigos de invitado / referidos / staff)
-- -------------------------------------------------------------
create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants (id) on delete cascade,
  code       text not null unique,
  type       text not null default 'referral' check (type in ('referral','staff')),
  benefit    text,
  max_uses   integer default 1,
  used_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- tenant_settings (config propia: EmailJS, branding, mensajes)
-- -------------------------------------------------------------
create table if not exists public.tenant_settings (
  tenant_id              uuid primary key references public.tenants (id) on delete cascade,
  emailjs_public_key     text,
  emailjs_service_id     text,
  emailjs_template_id    text,
  confirmation_template_id text,
  reminder_template_id   text,
  cancel_template_id     text,
  welcome_message        text,
  confirmation_message   text,
  reminder_message       text,
  allow_client_cancel    boolean not null default false,
  booking_window_start   integer not null default 1, -- antelación mínima (días)
  booking_window_end     integer not null default 30, -- límite (días)
  updated_at             timestamptz not null default now()
);

-- -------------------------------------------------------------
-- notifications (internas)
-- -------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete cascade,
  type       text not null default 'info'
             check (type in ('new_booking','reschedule','confirmation','cancel','info')),
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at);

-- =============================================================
-- Vistas públicas (landing SEO-safe, solo datos de negocio activos)
-- =============================================================
create or replace view public.public_profiles as
  select id, slug, business_name, tagline, description, logo_url, cover_url,
         primary_color, secondary_color, phone, email, address, website,
         facebook_url, instagram_url, whatsapp
  from public.tenants
  where is_active = true
    and subscription_status in ('trial','active');

create or replace view public.public_services as
  select s.id, s.tenant_id, s.name, s.description, s.duration_minutes,
         s.price, s.visible_public
  from public.services s
  join public.tenants t on t.id = s.tenant_id
  where t.is_active = true
    and s.is_active = true
    and s.visible_public = true;

create or replace view public.public_promotions as
  select p.id, p.tenant_id, p.code, p.name, p.description,
         p.discount_type, p.discount_value, p.starts_at, p.ends_at
  from public.promotions p
  join public.tenants t on t.id = p.tenant_id
  where t.is_active = true
    and p.is_active = true
    and p.starts_at <= now()
    and (p.ends_at is null or p.ends_at >= now());

grant select on public.public_profiles to anon, authenticated;
grant select on public.public_services to anon, authenticated;
grant select on public.public_promotions to anon, authenticated;

-- =============================================================
-- FUNCIONES RPC (seguridad definer, flujos públicos/acceso)
-- =============================================================

-- Registro profesional: crea tenant y sube rol a 'owner'
create or replace function public.create_professional_tenant(
  p_business_name text,
  p_slug text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant public.tenants;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'El slug solo puede contener minúsculas, números y guiones';
  end if;

  begin
    insert into public.tenants (slug, business_name, owner_id, email)
    values (p_slug, p_business_name, v_user, (select email from auth.users where id = v_user))
    returning * into v_tenant;
  exception when unique_violation then
    raise exception 'Ese nombre de página ya está registrado, prueba con otro';
  end;

  update public.profiles
  set tenant_id = v_tenant.id,
      role = 'owner',
      is_active = true
  where id = v_user;

  insert into public.tenant_settings (tenant_id)
  values (v_tenant.id)
  on conflict (tenant_id) do nothing;

  return v_tenant;
end;
$$;

-- Unirse a un negocio como colaborador mediante código de invitación
create or replace function public.join_tenant_with_code(
  p_code text,
  p_full_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations;
  v_profile public.profiles;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select * into v_inv
  from public.invitations
  where code = upper(p_code) and type = 'staff'
  limit 1;

  if v_inv is null then
    raise exception 'Código de invitación inválido';
  end if;
  if v_inv.max_uses is not null and v_inv.used_count >= v_inv.max_uses then
    raise exception 'El código ya no tiene usos disponibles';
  end if;

  update public.profiles
  set tenant_id = v_inv.tenant_id,
      role = 'staff',
      full_name = coalesce(nullif(p_full_name, ''), full_name),
      is_active = true
  where id = v_user
  returning * into v_profile;

  update public.invitations
  set used_count = used_count + 1
  where id = v_inv.id;

  return v_profile;
end;
$$;

-- Motor inteligente de disponibilidad: slots libres por servicio y fecha
create or replace function public.get_available_slots(
  p_tenant_slug text,
  p_service_id uuid,
  p_date date
)
returns table (starts_at timestamptz, staff_id uuid, staff_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_duration  integer;
  v_interval  interval;
  r           record;
  v_slot      time;
begin
  select t.id into v_tenant_id
  from public.tenants t
  where t.slug = p_tenant_slug and t.is_active;

  if not found then
    raise exception 'El negocio no está activo';
  end if;

  select s.duration_minutes into v_duration
  from public.services s
  where s.id = p_service_id
    and s.tenant_id = v_tenant_id
    and s.is_active
    and s.visible_public;

  if not found then
    raise exception 'Servicio no disponible';
  end if;

  v_interval := v_duration * interval '1 minute';

  for r in
    select a.staff_id, a.start_time, a.end_time
    from public.availability a
    where a.tenant_id = v_tenant_id
      and a.day_of_week = extract(isodow from p_date)::integer
      and a.is_active
      and (
        a.staff_id is null
        or exists (
          select 1 from public.service_staff ss
          where ss.service_id = p_service_id and ss.staff_id = a.staff_id
        )
      )
    order by a.start_time
  loop
    v_slot := r.start_time;
    while (v_slot + v_interval) <= r.end_time loop

      starts_at := timezone('UTC', p_date + v_slot);
      if starts_at > now() then

        if not exists (
          select 1 from public.appointments ap
          where ap.tenant_id = v_tenant_id
            and ap.status in ('pending','confirmed')
            and ap.starts_at < starts_at + v_interval
            and ap.ends_at > starts_at
            and (ap.staff_id is null or r.staff_id is null or ap.staff_id = r.staff_id)
        ) and not exists (
          select 1 from public.blocks b
          where b.tenant_id = v_tenant_id
            and b.starts_at < starts_at + v_interval
            and b.ends_at > starts_at
        ) then
          staff_id := r.staff_id;
          if r.staff_id is not null then
            select coalesce(full_name, '') into staff_name
            from public.profiles where id = r.staff_id;
          else
            staff_name := null;
          end if;
          return next;
        end if;
      end if;

      v_slot := v_slot + v_interval;
    end loop;
  end loop;

  return;
end;
$$;

-- Reserva pública de cita (anon): valida todo y crea cliente+cita+notificación
create or replace function public.book_appointment(
  p_tenant_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_name text,
  p_email text,
  p_phone text,
  p_notes text
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant    public.tenants;
  v_service   public.services;
  v_customer  public.customers;
  v_end       timestamptz;
  v_appt      public.appointments;
begin
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'El horario debe ser en el futuro';
  end if;
  if trim(coalesce(p_name,'')) = '' or nullif(p_email,'') is null then
    raise exception 'Nombre y email son obligatorios';
  end if;

  select * into v_tenant
  from public.tenants
  where slug = p_tenant_slug and is_active;
  if v_tenant is null then
    raise exception 'El negocio no está activo';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and tenant_id = v_tenant.id and is_active and visible_public;
  if v_service is null then
    raise exception 'Servicio no disponible';
  end if;

  v_end := p_starts_at + (v_service.duration_minutes * interval '1 minute');

  if p_staff_id is not null then
    if not exists (
      select 1 from public.profiles
      where id = p_staff_id and tenant_id = v_tenant.id and role in ('owner','staff') and is_active
    ) then
      raise exception 'Profesional no válido';
    end if;
    if not exists (
      select 1 from public.service_staff
      where service_id = v_service.id and staff_id = p_staff_id
    ) then
      raise exception 'Profesional no asignado a este servicio';
    end if;
  end if;

  if exists (
    select 1 from public.appointments a
    where a.tenant_id = v_tenant.id
      and a.status in ('pending','confirmed')
      and a.starts_at < v_end
      and a.ends_at > p_starts_at
      and (p_staff_id is null or a.staff_id is null or a.staff_id = p_staff_id)
  ) then
    raise exception 'El horario ya no está disponible';
  end if;

  if exists (
    select 1 from public.blocks b
    where b.tenant_id = v_tenant.id
      and b.starts_at < v_end
      and b.ends_at > p_starts_at
  ) then
    raise exception 'El horario está bloqueado';
  end if;

  select * into v_customer
  from public.customers
  where tenant_id = v_tenant.id and lower(email) = lower(p_email)
  limit 1;

  if v_customer is null then
    insert into public.customers (tenant_id, name, email, phone, notes)
    values (v_tenant.id, p_name, p_email, p_phone, coalesce(p_notes, ''))
    returning * into v_customer;
  else
    update public.customers
    set name = p_name, phone = coalesce(p_phone, phone)
    where id = v_customer.id;
  end if;

  insert into public.appointments
    (tenant_id, customer_id, service_id, staff_id, starts_at, ends_at, status, notes, source)
  values (v_tenant.id, v_customer.id, v_service.id, p_staff_id,
          p_starts_at, v_end, 'pending', p_notes, 'web')
  returning * into v_appt;

  insert into public.notifications (tenant_id, user_id, type, title, body)
  values (v_tenant.id, v_tenant.owner_id, 'new_booking', 'Nueva solicitud de cita',
          'Solicitud de "' || v_service.name || '" el ' ||
          to_char(p_starts_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI') ||
          ' · Cliente: ' || p_name);

  return v_appt;
end;
$$;

grant execute on function public.create_professional_tenant(text, text) to authenticated;
grant execute on function public.join_tenant_with_code(text, text) to authenticated;
grant execute on function public.get_available_slots(text, uuid, date) to anon, authenticated;
grant execute on function public.book_appointment(text, uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;

-- =============================================================
-- RLS: activación + políticas
-- =============================================================
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_staff enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.availability enable row level security;
alter table public.blocks enable row level security;
alter table public.promotions enable row level security;
alter table public.invitations enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.notifications enable row level security;

-- tenants -----------------------------------------------------------------
create policy tenants_select_members on public.tenants
  for select to authenticated
  using (is_zentro_admin() or is_tenant_member(id));

create policy tenants_insert_admin on public.tenants
  for insert to authenticated
  with check (is_zentro_admin());

create policy tenants_update_members on public.tenants
  for update to authenticated
  using (is_zentro_admin() or is_tenant_owner(id))
  with check (is_zentro_admin() or is_tenant_owner(id));

create policy tenants_delete_admin on public.tenants
  for delete to authenticated
  using (is_zentro_admin());

-- profiles ------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or is_zentro_admin()
    or (tenant_id is not null and is_tenant_member(tenant_id))
  );

create policy profiles_insert_owner on public.profiles
  for insert to authenticated
  with check (is_zentro_admin() or (tenant_id is not null and is_tenant_member(tenant_id)));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or is_zentro_admin() or (tenant_id is not null and is_tenant_member(tenant_id)))
  with check (id = auth.uid() or is_zentro_admin() or (tenant_id is not null and is_tenant_member(tenant_id)));

create policy profiles_delete_members on public.profiles
  for delete to authenticated
  using (is_zentro_admin() or (tenant_id is not null and is_tenant_owner(tenant_id)));

-- services -------------------------------------------------------------------
create policy services_select_public on public.services
  for select to anon, authenticated
  using (true);

create policy services_write_members on public.services
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

-- service_staff ----------------------------------------------------------------
create policy service_staff_select_members on public.service_staff
  for select to authenticated
  using (is_zentro_admin() or is_tenant_member(
    (select s.tenant_id from public.services s where s.id = service_id)
  ));

create policy service_staff_write_members on public.service_staff
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(
    (select s.tenant_id from public.services s where s.id = service_id)
  ));

-- customers ---------------------------------------------------------------------
create policy customers_select_members on public.customers
  for select to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id));

create policy customers_write_members on public.customers
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

-- appointments --------------------------------------------------------------------
create or replace function public.can_read_appointment(p_id uuid, p_tenant uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.appointments a
    join public.customers c on c.id = a.customer_id
    where a.id = p_id
      and a.tenant_id = p_tenant
      and lower(c.email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create policy appointments_select on public.appointments
  for select to authenticated
  using (
    is_zentro_admin()
    or is_tenant_member(tenant_id)
    or can_read_appointment(id, tenant_id)
  );

create policy appointments_write_members on public.appointments
  for insert, update to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

create policy appointments_delete_admin on public.appointments
  for delete to authenticated
  using (is_zentro_admin());

-- availability --------------------------------------------------------------------
create policy availability_select_public on public.availability
  for select to anon, authenticated
  using (true);

create policy availability_write_members on public.availability
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

-- blocks ---------------------------------------------------------------------------
create policy blocks_select_members on public.blocks
  for select to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id));

create policy blocks_write_members on public.blocks
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

-- promotions ------------------------------------------------------------------------
create policy promotions_select_public on public.promotions
  for select to anon, authenticated
  using (true);

create policy promotions_write_members on public.promotions
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_member(tenant_id))
  with check (is_zentro_admin() or is_tenant_member(tenant_id));

-- invitations -------------------------------------------------------------------------
create policy invitations_select_members on public.invitations
  for select to authenticated
  using (is_zentro_admin() or (tenant_id is not null and is_tenant_member(tenant_id)));

create policy invitations_write_owner on public.invitations
  for insert, update, delete to authenticated
  using (is_zentro_admin() or (tenant_id is not null and is_tenant_owner(tenant_id)))
  with check (is_zentro_admin() or (tenant_id is not null and is_tenant_owner(tenant_id)));

-- tenant_settings ----------------------------------------------------------------------
create policy tenant_settings_select_owner on public.tenant_settings
  for select to authenticated
  using (is_zentro_admin() or is_tenant_owner(tenant_id));

create policy tenant_settings_write_owner on public.tenant_settings
  for insert, update, delete to authenticated
  using (is_zentro_admin() or is_tenant_owner(tenant_id))
  with check (is_zentro_admin() or is_tenant_owner(tenant_id));

-- notifications --------------------------------------------------------------------------
create policy notifications_select_receiver on public.notifications
  for select to authenticated
  using (is_zentro_admin() or (user_id is not null and user_id = auth.uid()));

create policy notifications_insert_members on public.notifications
  for insert to authenticated
  with check (is_zentro_admin() or (tenant_id is not null and is_tenant_member(tenant_id)));

create policy notifications_update_receiver on public.notifications
  for update to authenticated
  using (user_id = auth.uid() or is_zentro_admin());

create policy notifications_delete_owner on public.notifications
  for delete to authenticated
  using (is_zentro_admin() or is_tenant_owner(tenant_id));