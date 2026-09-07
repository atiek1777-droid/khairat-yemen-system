-- ============================================================
-- معامل خيرات اليمن — Seed data
-- Run AFTER schema.sql and policies.sql.
--
-- IMPORTANT: Step 1 (creating the admin auth user) MUST be done
-- from the Supabase Dashboard or Auth API first — you cannot
-- create an auth.users row safely from plain SQL. See README.md
-- "Creating the first administrator" for the exact steps.
--
-- Once you have the admin's auth user id (UUID), replace
-- '00000000-0000-0000-0000-000000000000' everywhere below with
-- that real UUID before running this file.
-- ============================================================

-- 1) Factory record -------------------------------------------------
insert into factories (name, name_ar, address, phone_primary, phone_secondary, currency)
values (
  'Khairat Yemen Factories', 'معامل خيرات اليمن',
  'الحصبة – شارع عمران – جوار جامع السلام',
  '784355755', '738409274', 'ريال يمني'
)
on conflict do nothing;

-- 2) Product ----------------------------------------------------------
insert into products (name, container_size_liters, factory_cost, is_active)
values ('زيت طبخ - عبوة 5 لتر', 5, 12000, true)
on conflict do nothing;

-- 3) Admin profile ------------------------------------------------------
-- ⚠️ Replace the UUID below with the real auth.users id of the admin
-- account you created in the Supabase Dashboard (Authentication > Users).
insert into profiles (id, full_name, username, phone, role, is_active)
values (
  '00000000-0000-0000-0000-000000000000',
  'عتيق', 'admin', '784355755', 'admin', true
)
on conflict (id) do update set role = 'admin', is_active = true;

-- 4) Distributor entity (the main distributor / Atiq himself) ----------
insert into distributors (id, name, phone, area, is_active, created_by)
values (
  '11111111-1111-1111-1111-111111111111',
  'الموزع الرئيسي - عتيق', '784355755', 'صنعاء - الحصبة', true,
  '00000000-0000-0000-0000-000000000000'
)
on conflict (id) do nothing;

-- Link the admin profile to this distributor scope as well (optional —
-- lets the admin see "my distributor" screens without a second account).
update profiles set distributor_id = '11111111-1111-1111-1111-111111111111'
 where id = '00000000-0000-0000-0000-000000000000';

-- 5) Customers referenced by the initial data --------------------------
insert into customers (id, name, distributor_id, is_active, created_by)
values
  ('22222222-2222-2222-2222-222222222221', 'محل عسل بستان العسل',
   '11111111-1111-1111-1111-111111111111', true, '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'محل فول الذهبي',
   '11111111-1111-1111-1111-111111111111', true, '00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

-- 6) Initial data dated 02-09-2026 --------------------------------------
-- Received: 3 containers
insert into inventory_receipts (distributor_id, product_id, quantity_containers, unit_cost, receipt_date, created_by)
select '11111111-1111-1111-1111-111111111111', p.id, 3, p.factory_cost, date '2026-09-02',
       '00000000-0000-0000-0000-000000000000'
from products p limit 1;

-- Sale 1: cash, 1 container @ 12,000
with s as (
  insert into sales (distributor_id, customer_id, sale_type, sale_date, due_date, created_by)
  values ('11111111-1111-1111-1111-111111111111', null, 'cash', date '2026-09-02', null,
          '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into sale_items (sale_id, product_id, quantity_containers, unit_price, unit_cost)
select s.id, p.id, 1, 12000, p.factory_cost from s, products p limit 1;

-- Sale 2: credit to محل عسل بستان العسل, 1 container @ 13,000
with s as (
  insert into sales (distributor_id, customer_id, sale_type, sale_date, due_date, created_by)
  values ('11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222221', 'credit', date '2026-09-02',
          date '2026-09-09', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into sale_items (sale_id, product_id, quantity_containers, unit_price, unit_cost)
select s.id, p.id, 1, 13000, p.factory_cost from s, products p limit 1;

-- Sale 3: credit to محل فول الذهبي, 1 container @ 12,500
with s as (
  insert into sales (distributor_id, customer_id, sale_type, sale_date, due_date, created_by)
  values ('11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222', 'credit', date '2026-09-02',
          date '2026-09-09', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into sale_items (sale_id, product_id, quantity_containers, unit_price, unit_cost)
select s.id, p.id, 1, 12500, p.factory_cost from s, products p limit 1;

-- Expenses: transportation 2,000 + "نقد مع عتيق" 1,000
insert into expenses (distributor_id, category, amount, expense_date, description, created_by)
values
  ('11111111-1111-1111-1111-111111111111', 'مواصلات', 2000, date '2026-09-02',
   'مصروف مواصلات يومي', '00000000-0000-0000-0000-000000000000'),
  ('11111111-1111-1111-1111-111111111111', 'نقد مع عتيق', 1000, date '2026-09-02',
   'نقد مع عتيق', '00000000-0000-0000-0000-000000000000');

-- ============================================================
-- Expected results after running this file (matches the brief):
--   total received        = 3 containers
--   total sold             = 3 containers
--   remaining custody      = 0 containers
--   total sales            = 37,500 ريال
--   cash sales             = 12,000 ريال
--   credit sales           = 25,500 ريال
--   total customer debt    = 25,500 ريال
--   cost of goods sold     = 36,000 ريال
--   gross profit           = 1,500 ريال
--   total expenses         = 3,000 ريال (منها 1,000 نقد مع عتيق)
--   net profit              = -1,500 ريال
--   cash actually collected = 12,000 ريال
-- ============================================================
