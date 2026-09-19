-- CVStudio v1.8.4 · Catálogo y precios oficiales
-- Idempotente: inserta productos nuevos y actualiza los existentes.

insert into public.servicios_precios
  (product_id, title, unit_price, active, test_mode, test_price, sort_order, updated_at)
values
  ('cv-express', 'CV Express', 6000, true, false, null, 10, now()),
  ('cv-basico', 'CV Básico', 6500, true, false, null, 20, now()),
  ('cv-estandar', 'CV Estándar', 7500, true, false, null, 30, now()),
  ('cv-avanzado', 'CV Avanzado', 10500, true, false, null, 40, now()),
  ('cv-profesional', 'CV Profesional', 12500, true, false, null, 50, now()),
  ('cv-freelance', 'CV Freelance', 15000, true, false, null, 60, now()),
  ('linkedin', 'LinkedIn Completo', 20000, true, false, null, 70, now()),
  ('combo-2-cv', 'Combo 2 CV Profesionales', 20000, true, false, null, 80, now()),
  ('combo-cv-linkedin', 'Combo CV + LinkedIn', 28000, true, false, null, 90, now()),
  ('entrevistas', 'Preparación para entrevistas', 10000, true, false, null, 100, now()),
  ('kit-emprendedor', 'Kit Emprendedor', 35000, true, false, null, 110, now()),
  ('kit-web', 'Kit Emprendedor + Web', 80000, true, false, null, 120, now())
on conflict (product_id) do update set
  title = excluded.title,
  unit_price = excluded.unit_price,
  active = excluded.active,
  test_mode = excluded.test_mode,
  test_price = excluded.test_price,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

select product_id, title, unit_price, active, test_mode, test_price, sort_order
from public.servicios_precios
order by sort_order, product_id;
