-- =============================================================
-- Citas Pro · Datos semilla demo (negocios de ejemplo)
-- Ejecutar después de 0001_init.sql
-- =============================================================

insert into public.tenants
  (slug, business_name, tagline, description, primary_color, secondary_color,
   phone, email, address, is_active, subscription_status)
select
  'dra-marta', 'Dra. Marta Psicóloga', 'Acompañamiento psicológico profesional',
  'Psicóloga clínica con más de 10 años de experiencia. Acompaño a adultos y adolescentes en procesos de ansiedad, depresión y crecimiento personal. Atención presencial y online.',
  '#7c3aed', '#db2777', '+57 300 111 2222', 'contacto@dramarta.com',
  'Consultorio 304, Torre Médica Centro', true, 'active'
where not exists (select 1 from public.tenants where slug = 'dra-marta');

insert into public.tenant_settings (tenant_id)
select id from public.tenants where slug = 'dra-marta'
on conflict (tenant_id) do nothing;

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Consulta inicial', 'Evaluación y plan de tratamiento. Primera sesión diagnóstica.',
       60, 120000
from public.tenants t where t.slug = 'dra-marta'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Consulta inicial'
);

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Consulta de seguimiento', 'Sesión de terapia de seguimiento.',
       45, 90000
from public.tenants t where t.slug = 'dra-marta'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Consulta de seguimiento'
);

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Terapia online', 'Sesión de terapia por videollamada.',
       50, 85000
from public.tenants t where t.slug = 'dra-marta'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Terapia online'
);

insert into public.availability (tenant_id, day_of_week, start_time, end_time)
select t.id, d, '09:00', '13:00'
from public.tenants t, generate_series(1, 5) as d
where t.slug = 'dra-marta'
and not exists (
  select 1 from public.availability a
  where a.tenant_id = t.id and a.day_of_week = d
);

insert into public.availability (tenant_id, day_of_week, start_time, end_time)
select t.id, d, '14:00', '18:00'
from public.tenants t, generate_series(1, 5) as d
where t.slug = 'dra-marta'
and not exists (
  select 1 from public.availability a
  where a.tenant_id = t.id and a.day_of_week = d
);

insert into public.promotions (tenant_id, code, name, description, discount_type, discount_value)
select t.id, 'BIENVENIDO10', 'Bienvenida', '10% de descuento en tu primera consulta.',
       'percent', 10
from public.tenants t where t.slug = 'dra-marta'
and not exists (
  select 1 from public.promotions p
  where p.tenant_id = t.id and p.code = 'BIENVENIDO10'
);

-- ------------------------------------------------------------------
-- Barbería
-- ------------------------------------------------------------------
insert into public.tenants
  (slug, business_name, tagline, description, primary_color, secondary_color,
   phone, email, address, is_active, subscription_status)
select
  'barberia-el-corte', 'Barbería El Corte', 'El arte del buen corte',
  'Barbería profesional especializada en cortes clásicos y modernos, arreglo de barba y tinte. Ambiente relajado y servicio personalizado.',
  '#0f172a', '#f59e0b', '+57 311 444 5555', 'hola@elcorte.co',
  'Carrera 15 # 82-40, Local 2', true, 'active'
where not exists (select 1 from public.tenants where slug = 'barberia-el-corte');

insert into public.tenant_settings (tenant_id)
select id from public.tenants where slug = 'barberia-el-corte'
on conflict (tenant_id) do nothing;

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Corte clásico', 'Corte con máquina y tijera, lavado y arreglo final.',
       45, 35000
from public.tenants t where t.slug = 'barberia-el-corte'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Corte clásico'
);

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Corte + barba', 'Corte completo con arreglo de barba con toalla caliente.',
       60, 50000
from public.tenants t where t.slug = 'barberia-el-corte'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Corte + barba'
);

insert into public.services (tenant_id, name, description, duration_minutes, price)
select t.id, 'Tinte o decoloración', 'Coloración completa con productos premium.',
       90, 90000
from public.tenants t where t.slug = 'barberia-el-corte'
and not exists (
  select 1 from public.services s
  where s.tenant_id = t.id and s.name = 'Tinte o decoloración'
);

insert into public.availability (tenant_id, day_of_week, start_time, end_time)
select t.id, d, '10:00', '19:00'
from public.tenants t, generate_series(2, 7) as d
where t.slug = 'barberia-el-corte'
and not exists (
  select 1 from public.availability a
  where a.tenant_id = t.id and a.day_of_week = d
);

insert into public.promotions (tenant_id, code, name, description, discount_type, discount_value)
select t.id, 'MIERCOLES10', 'Miércoles de barbería', '10% de descuento los miércoles.',
       'percent', 10
from public.tenants t where t.slug = 'barberia-el-corte'
and not exists (
  select 1 from public.promotions p
  where p.tenant_id = t.id and p.code = 'MIERCOLES10'
);