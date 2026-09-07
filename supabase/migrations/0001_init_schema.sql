-- ============================================================
-- معامل خيرات اليمن — Khairat Yemen Factories
-- Core database schema
-- Run this first, then policies.sql, then (optionally) seed.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'factory_owner', 'distributor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_type as enum ('cash', 'credit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('paid', 'partial', 'unpaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type settlement_status as enum ('open', 'settled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_category as enum (
    'مواصلات', 'بترول', 'تحميل وتنزيل', 'صيانة', 'اتصالات', 'نقد مع عتيق', 'مصروفات أخرى'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_adjustment_type as enum ('damaged', 'returned');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- UTILITY: updated_at trigger
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- TABLE: factories  (single business entity, kept as a table
-- for future multi-factory support)
-- ------------------------------------------------------------
create table if not exists factories (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'معامل خيرات اليمن',
  name_ar text not null default 'معامل خيرات اليمن',
  address text not null default 'الحصبة – شارع عمران – جوار جامع السلام',
  phone_primary text not null default '784355755',
  phone_secondary text default '738409274',
  currency text not null default 'ريال يمني',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_factories_updated_at before update on factories
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: distributors (business entity — the person/route that
-- holds custody of containers). A distributor MAY be linked to
-- a login profile via profiles.distributor_id.
-- ------------------------------------------------------------
create table if not exists distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  area text,
  notes text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_distributors_updated_at before update on distributors
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: profiles (1:1 with auth.users) — identity + role
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  phone text,
  role user_role not null default 'distributor',
  distributor_id uuid references distributors(id) on delete set null,
  can_edit boolean not null default false,            -- grants edit rights to a factory_owner
  can_delete_financial boolean not null default false, -- grants delete rights to a distributor
  is_active boolean not null default true,
  avatar_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

alter table distributors
  add constraint fk_distributors_created_by foreign key (created_by) references profiles(id);

-- ------------------------------------------------------------
-- TABLE: products
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'زيت طبخ - عبوة 5 لتر',
  container_size_liters numeric not null default 5,
  factory_cost numeric not null default 12000 check (factory_cost >= 0),
  is_active boolean not null default true,
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create table if not exists product_cost_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  old_cost numeric,
  new_cost numeric not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

create or replace function log_product_cost_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and new.factory_cost is distinct from old.factory_cost) then
    insert into product_cost_history (product_id, old_cost, new_cost, changed_by)
    values (new.id, old.factory_cost, new.factory_cost, new.updated_by);
  end if;
  return new;
end;
$$;
create trigger trg_products_cost_history after update on products
  for each row execute function log_product_cost_change();

-- ------------------------------------------------------------
-- TABLE: customers
-- ------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  distributor_id uuid not null references distributors(id),
  notes text,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_customers_distributor on customers(distributor_id);
create index if not exists idx_customers_name on customers using gin (to_tsvector('simple', name));
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: inventory_receipts (containers received from factory)
-- ------------------------------------------------------------
create table if not exists inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references distributors(id),
  product_id uuid not null references products(id),
  quantity_containers integer not null check (quantity_containers > 0),
  unit_cost numeric not null check (unit_cost >= 0),
  receipt_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_receipts_distributor_date on inventory_receipts(distributor_id, receipt_date);
create trigger trg_receipts_updated_at before update on inventory_receipts
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: inventory_adjustments (damaged / returned containers)
-- ------------------------------------------------------------
create table if not exists inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references distributors(id),
  product_id uuid not null references products(id),
  adjustment_type inventory_adjustment_type not null,
  quantity_containers integer not null check (quantity_containers > 0),
  adjustment_date date not null default current_date,
  reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_adjustments_distributor_date on inventory_adjustments(distributor_id, adjustment_date);

-- ------------------------------------------------------------
-- INVOICE NUMBERING
-- ------------------------------------------------------------
create sequence if not exists invoice_number_seq start 1;

create or replace function next_invoice_number()
returns text language plpgsql as $$
declare
  n bigint;
begin
  n := nextval('invoice_number_seq');
  return 'INV-' || to_char(current_date, 'YYYY') || '-' || lpad(n::text, 6, '0');
end;
$$;

-- ------------------------------------------------------------
-- TABLE: sales (invoice header)
-- ------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default next_invoice_number(),
  distributor_id uuid not null references distributors(id),
  customer_id uuid references customers(id),
  customer_name_cash text, -- used only for walk-in cash sales without a saved customer
  sale_type sale_type not null default 'cash',
  total_amount numeric not null default 0 check (total_amount >= 0),
  total_cost numeric not null default 0 check (total_cost >= 0),
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  payment_status payment_status not null default 'unpaid',
  due_date date,
  sale_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_sale_customer check (
    (sale_type = 'credit' and customer_id is not null) or (sale_type = 'cash')
  ),
  constraint chk_paid_not_exceeding check (paid_amount <= total_amount + 0.0001)
);
create index if not exists idx_sales_distributor_date on sales(distributor_id, sale_date);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sales_status on sales(payment_status);
create index if not exists idx_sales_invoice on sales(invoice_number);
create trigger trg_sales_updated_at before update on sales
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: sale_items (invoice lines)
-- ------------------------------------------------------------
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity_containers integer not null check (quantity_containers > 0),
  unit_price numeric not null check (unit_price >= 0),
  unit_cost numeric not null check (unit_cost >= 0),
  line_total numeric generated always as (quantity_containers * unit_price) stored,
  line_cost numeric generated always as (quantity_containers * unit_cost) stored,
  created_at timestamptz not null default now()
);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_sale_items_product on sale_items(product_id);

-- Recompute sales header totals + payment_status whenever line items change
create or replace function recompute_sale_totals()
returns trigger language plpgsql as $$
declare
  target_sale_id uuid;
  v_total numeric;
  v_cost numeric;
  v_paid numeric;
begin
  target_sale_id := coalesce(new.sale_id, old.sale_id);

  select coalesce(sum(line_total), 0), coalesce(sum(line_cost), 0)
    into v_total, v_cost
    from sale_items where sale_id = target_sale_id;

  select paid_amount into v_paid from sales where id = target_sale_id;

  update sales
     set total_amount = v_total,
         total_cost = v_cost,
         payment_status = case
           when v_total <= 0 then 'unpaid'
           when v_paid >= v_total then 'paid'
           when v_paid > 0 then 'partial'
           else 'unpaid'
         end
   where id = target_sale_id;

  return null;
end;
$$;
create trigger trg_sale_items_recompute
  after insert or update or delete on sale_items
  for each row execute function recompute_sale_totals();

-- ------------------------------------------------------------
-- TABLE: payments (debt collections — always tied to one invoice)
-- ------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  sale_id uuid not null references sales(id),
  distributor_id uuid not null references distributors(id),
  amount numeric not null check (amount > 0),
  payment_date date not null default current_date,
  method text not null default 'نقدي',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_payments_customer on payments(customer_id);
create index if not exists idx_payments_sale on payments(sale_id);
create index if not exists idx_payments_date on payments(payment_date);

-- Keep sales.paid_amount and payment_status in sync with payments,
-- and prevent overpayment beyond the invoice total.
create or replace function apply_payment_to_sale()
returns trigger language plpgsql as $$
declare
  target_sale_id uuid;
  v_total numeric;
  v_paid numeric;
begin
  target_sale_id := coalesce(new.sale_id, old.sale_id);

  select coalesce(sum(amount), 0) into v_paid
    from payments where sale_id = target_sale_id and deleted_at is null;

  select total_amount into v_total from sales where id = target_sale_id;

  if v_paid > v_total + 0.0001 then
    raise exception 'المبلغ المدفوع يتجاوز إجمالي الفاتورة (سداد زائد غير مسموح)';
  end if;

  update sales
     set paid_amount = v_paid,
         payment_status = case
           when v_total <= 0 then 'unpaid'
           when v_paid >= v_total then 'paid'
           when v_paid > 0 then 'partial'
           else 'unpaid'
         end
   where id = target_sale_id;

  return null;
end;
$$;
create trigger trg_payments_apply
  after insert or update or delete on payments
  for each row execute function apply_payment_to_sale();

-- ------------------------------------------------------------
-- TABLE: expenses
-- ------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid references distributors(id), -- null = factory-level expense
  category expense_category not null,
  amount numeric not null check (amount > 0),
  expense_date date not null default current_date,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_expenses_distributor_date on expenses(distributor_id, expense_date);
create index if not exists idx_expenses_category on expenses(category);
create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TABLE: weekly_settlements
-- ------------------------------------------------------------
create table if not exists weekly_settlements (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references distributors(id),
  week_start date not null,
  week_end date not null,
  total_sales numeric not null default 0,
  total_cost numeric not null default 0,
  total_collected numeric not null default 0,
  total_expenses numeric not null default 0,
  amount_due_to_factory numeric not null default 0,
  amount_paid_to_factory numeric not null default 0,
  status settlement_status not null default 'open',
  notes text,
  created_by uuid references profiles(id),
  settled_by uuid references profiles(id),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_week_range check (week_end >= week_start),
  unique (distributor_id, week_start, week_end)
);
create index if not exists idx_settlements_distributor on weekly_settlements(distributor_id, week_start);
create trigger trg_settlements_updated_at before update on weekly_settlements
  for each row execute function set_updated_at();

create table if not exists settlement_payments (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references weekly_settlements(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date date not null default current_date,
  method text not null default 'نقدي',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_settlement_payments_settlement on settlement_payments(settlement_id);

create or replace function apply_settlement_payment()
returns trigger language plpgsql as $$
declare
  target_id uuid;
  v_paid numeric;
  v_due numeric;
begin
  target_id := coalesce(new.settlement_id, old.settlement_id);
  select coalesce(sum(amount), 0) into v_paid from settlement_payments where settlement_id = target_id;
  select amount_due_to_factory into v_due from weekly_settlements where id = target_id;

  update weekly_settlements
     set amount_paid_to_factory = v_paid,
         status = case when v_paid >= v_due and v_due > 0 then 'settled' else status end,
         settled_at = case when v_paid >= v_due and v_due > 0 and settled_at is null then now() else settled_at end
   where id = target_id;

  return null;
end;
$$;
create trigger trg_settlement_payments_apply
  after insert or update or delete on settlement_payments
  for each row execute function apply_settlement_payment();

-- ------------------------------------------------------------
-- TABLE: audit_logs
-- ------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,           -- create | update | delete | login | logout | export | settle | print
  entity_type text not null,      -- table / feature name
  entity_id uuid,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on audit_logs(actor_id);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- Generic audit trigger applied to key business tables
create or replace function log_audit_event()
returns trigger language plpgsql as $$
declare
  v_actor uuid;
  v_action text;
  v_entity_id uuid;
begin
  v_actor := auth.uid();
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_entity_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := case when new.deleted_at is not null and old.deleted_at is null
                      then 'delete' else 'update' end;
    v_entity_id := new.id;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_entity_id := old.id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, v_action, tg_table_name, v_entity_id,
          jsonb_build_object('op', tg_op));
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_sales after insert or update or delete on sales
  for each row execute function log_audit_event();
create trigger trg_audit_payments after insert or update or delete on payments
  for each row execute function log_audit_event();
create trigger trg_audit_expenses after insert or update or delete on expenses
  for each row execute function log_audit_event();
create trigger trg_audit_receipts after insert or update or delete on inventory_receipts
  for each row execute function log_audit_event();
create trigger trg_audit_customers after insert or update or delete on customers
  for each row execute function log_audit_event();
create trigger trg_audit_distributors after insert or update or delete on distributors
  for each row execute function log_audit_event();
create trigger trg_audit_settlements after insert or update or delete on weekly_settlements
  for each row execute function log_audit_event();
create trigger trg_audit_products after insert or update or delete on products
  for each row execute function log_audit_event();

-- ------------------------------------------------------------
-- TABLE: app_settings (key/value store)
-- ------------------------------------------------------------
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- VIEW: current custody per distributor / product
-- custody = received - sold - damaged - returned
-- ------------------------------------------------------------
create or replace view distributor_custody as
select
  d.id as distributor_id,
  d.name as distributor_name,
  p.id as product_id,
  p.name as product_name,
  coalesce(r.received, 0) as received_containers,
  coalesce(s.sold, 0) as sold_containers,
  coalesce(a.damaged, 0) as damaged_containers,
  coalesce(a.returned, 0) as returned_containers,
  coalesce(r.received, 0) - coalesce(s.sold, 0) - coalesce(a.damaged, 0) - coalesce(a.returned, 0) as current_custody
from distributors d
cross join products p
left join (
  select distributor_id, product_id, sum(quantity_containers) as received
  from inventory_receipts where deleted_at is null
  group by distributor_id, product_id
) r on r.distributor_id = d.id and r.product_id = p.id
left join (
  select s.distributor_id, si.product_id, sum(si.quantity_containers) as sold
  from sales s
  join sale_items si on si.sale_id = s.id
  where s.deleted_at is null
  group by s.distributor_id, si.product_id
) s on s.distributor_id = d.id and s.product_id = p.id
left join (
  select distributor_id, product_id,
    sum(quantity_containers) filter (where adjustment_type = 'damaged') as damaged,
    sum(quantity_containers) filter (where adjustment_type = 'returned') as returned
  from inventory_adjustments where deleted_at is null
  group by distributor_id, product_id
) a on a.distributor_id = d.id and a.product_id = p.id;

-- ------------------------------------------------------------
-- VIEW: customer balances (total debt outstanding)
-- ------------------------------------------------------------
create or replace view customer_balances as
select
  c.id as customer_id,
  c.name as customer_name,
  c.distributor_id,
  coalesce(sum(s.total_amount) filter (where s.sale_type = 'credit'), 0) as total_credit_sales,
  coalesce(sum(s.paid_amount) filter (where s.sale_type = 'credit'), 0) as total_paid,
  coalesce(sum(s.total_amount - s.paid_amount) filter (where s.sale_type = 'credit'), 0) as total_debt,
  max(s.sale_date) as last_sale_date
from customers c
left join sales s on s.customer_id = c.id and s.deleted_at is null
where c.deleted_at is null
group by c.id, c.name, c.distributor_id;
