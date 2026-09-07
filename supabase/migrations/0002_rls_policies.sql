-- ============================================================
-- معامل خيرات اليمن — Row Level Security policies
-- Run after schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- HELPER FUNCTIONS (security definer, read the caller's profile)
-- ------------------------------------------------------------
create or replace function current_profile_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_profile_distributor_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select distributor_id from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function is_factory_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'factory_owner' and is_active = true
  );
$$;

create or replace function is_distributor_user()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'distributor' and is_active = true
  );
$$;

create or replace function factory_owner_can_edit()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'factory_owner' and can_edit = true and is_active = true
  );
$$;

create or replace function distributor_can_delete_financial()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'distributor' and can_delete_financial = true and is_active = true
  );
$$;

create or replace function owns_distributor(target_distributor_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select is_distributor_user() and current_profile_distributor_id() = target_distributor_id;
$$;

-- Admin OR (distributor editing their own scope) OR (factory owner granted edit rights)
create or replace function can_write(target_distributor_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or owns_distributor(target_distributor_id)
      or factory_owner_can_edit();
$$;

-- Whether a soft-delete (setting deleted_at) is allowed for this scope
create or replace function can_soft_delete(target_distributor_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or (owns_distributor(target_distributor_id) and distributor_can_delete_financial());
$$;

-- ------------------------------------------------------------
-- ENABLE RLS
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table distributors enable row level security;
alter table factories enable row level security;
alter table products enable row level security;
alter table product_cost_history enable row level security;
alter table customers enable row level security;
alter table inventory_receipts enable row level security;
alter table inventory_adjustments enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table weekly_settlements enable row level security;
alter table settlement_payments enable row level security;
alter table audit_logs enable row level security;
alter table app_settings enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles_select" on profiles for select
  using (is_admin() or is_factory_owner() or id = auth.uid());

create policy "profiles_insert_admin" on profiles for insert
  with check (is_admin());

create policy "profiles_update" on profiles for update
  using (is_admin() or id = auth.uid())
  with check (
    is_admin()
    or (id = auth.uid() and role = current_profile_role()) -- self-edit cannot change own role
  );

create policy "profiles_delete_admin" on profiles for delete
  using (is_admin());

-- ------------------------------------------------------------
-- DISTRIBUTORS
-- ------------------------------------------------------------
create policy "distributors_select" on distributors for select
  using (is_admin() or is_factory_owner() or owns_distributor(id));

create policy "distributors_insert_admin" on distributors for insert
  with check (is_admin());

create policy "distributors_update_admin" on distributors for update
  using (is_admin())
  with check (is_admin());

create policy "distributors_delete_admin" on distributors for delete
  using (is_admin());

-- ------------------------------------------------------------
-- FACTORIES / SETTINGS
-- ------------------------------------------------------------
create policy "factories_select_all" on factories for select
  using (is_admin() or is_factory_owner() or is_distributor_user());

create policy "factories_write_admin" on factories for insert with check (is_admin());
create policy "factories_update_admin" on factories for update using (is_admin()) with check (is_admin());

create policy "app_settings_select_all" on app_settings for select
  using (is_admin() or is_factory_owner() or is_distributor_user());
create policy "app_settings_write_admin" on app_settings for insert with check (is_admin());
create policy "app_settings_update_admin" on app_settings for update using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create policy "products_select_all" on products for select
  using (is_admin() or is_factory_owner() or is_distributor_user());
create policy "products_write_admin" on products for insert with check (is_admin());
create policy "products_update_admin" on products for update using (is_admin()) with check (is_admin());

create policy "product_cost_history_select" on product_cost_history for select
  using (is_admin() or is_factory_owner());

-- ------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------
create policy "customers_select" on customers for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "customers_insert" on customers for insert
  with check (can_write(distributor_id));

create policy "customers_update" on customers for update
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id))
  with check (
    is_admin()
    or factory_owner_can_edit()
    or (owns_distributor(distributor_id) and (deleted_at is null or distributor_can_delete_financial()))
  );

create policy "customers_delete_admin" on customers for delete using (is_admin());

-- ------------------------------------------------------------
-- INVENTORY RECEIPTS
-- ------------------------------------------------------------
create policy "receipts_select" on inventory_receipts for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "receipts_insert" on inventory_receipts for insert
  with check (is_admin() or owns_distributor(distributor_id));

create policy "receipts_update" on inventory_receipts for update
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id))
  with check (
    is_admin()
    or factory_owner_can_edit()
    or (owns_distributor(distributor_id) and (deleted_at is null or distributor_can_delete_financial()))
  );

create policy "receipts_delete_admin" on inventory_receipts for delete using (is_admin());

-- ------------------------------------------------------------
-- INVENTORY ADJUSTMENTS
-- ------------------------------------------------------------
create policy "adjustments_select" on inventory_adjustments for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "adjustments_insert" on inventory_adjustments for insert
  with check (is_admin() or owns_distributor(distributor_id));

create policy "adjustments_update" on inventory_adjustments for update
  using (is_admin() or owns_distributor(distributor_id))
  with check (is_admin() or (owns_distributor(distributor_id) and distributor_can_delete_financial()));

create policy "adjustments_delete_admin" on inventory_adjustments for delete using (is_admin());

-- ------------------------------------------------------------
-- SALES + SALE_ITEMS
-- ------------------------------------------------------------
create policy "sales_select" on sales for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "sales_insert" on sales for insert
  with check (is_admin() or owns_distributor(distributor_id));

create policy "sales_update" on sales for update
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id))
  with check (
    is_admin()
    or factory_owner_can_edit()
    or (owns_distributor(distributor_id) and (deleted_at is null or distributor_can_delete_financial()))
  );

create policy "sales_delete_admin" on sales for delete using (is_admin());

create policy "sale_items_select" on sale_items for select
  using (
    is_admin() or is_factory_owner()
    or exists (select 1 from sales s where s.id = sale_items.sale_id and owns_distributor(s.distributor_id))
  );

create policy "sale_items_insert" on sale_items for insert
  with check (
    is_admin()
    or exists (select 1 from sales s where s.id = sale_items.sale_id and owns_distributor(s.distributor_id))
  );

create policy "sale_items_update" on sale_items for update
  using (
    is_admin()
    or exists (select 1 from sales s where s.id = sale_items.sale_id and owns_distributor(s.distributor_id))
  )
  with check (
    is_admin()
    or exists (select 1 from sales s where s.id = sale_items.sale_id and owns_distributor(s.distributor_id))
  );

create policy "sale_items_delete" on sale_items for delete
  using (
    is_admin()
    or exists (
      select 1 from sales s
      where s.id = sale_items.sale_id
        and owns_distributor(s.distributor_id)
        and distributor_can_delete_financial()
    )
  );

-- ------------------------------------------------------------
-- PAYMENTS (collections)
-- ------------------------------------------------------------
create policy "payments_select" on payments for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "payments_insert" on payments for insert
  with check (is_admin() or owns_distributor(distributor_id));

create policy "payments_update" on payments for update
  using (is_admin() or owns_distributor(distributor_id))
  with check (
    is_admin()
    or (owns_distributor(distributor_id) and (deleted_at is null or distributor_can_delete_financial()))
  );

create policy "payments_delete_admin" on payments for delete using (is_admin());

-- ------------------------------------------------------------
-- EXPENSES
-- ------------------------------------------------------------
create policy "expenses_select" on expenses for select
  using (
    is_admin() or is_factory_owner()
    or (distributor_id is not null and owns_distributor(distributor_id))
  );

create policy "expenses_insert" on expenses for insert
  with check (is_admin() or (distributor_id is not null and owns_distributor(distributor_id)));

create policy "expenses_update" on expenses for update
  using (is_admin() or (distributor_id is not null and owns_distributor(distributor_id)))
  with check (
    is_admin()
    or (
      distributor_id is not null and owns_distributor(distributor_id)
      and (deleted_at is null or distributor_can_delete_financial())
    )
  );

create policy "expenses_delete_admin" on expenses for delete using (is_admin());

-- ------------------------------------------------------------
-- WEEKLY SETTLEMENTS + SETTLEMENT PAYMENTS
-- ------------------------------------------------------------
create policy "settlements_select" on weekly_settlements for select
  using (is_admin() or is_factory_owner() or owns_distributor(distributor_id));

create policy "settlements_insert" on weekly_settlements for insert
  with check (is_admin() or owns_distributor(distributor_id));

create policy "settlements_update" on weekly_settlements for update
  using (is_admin() or owns_distributor(distributor_id))
  with check (is_admin() or owns_distributor(distributor_id));

create policy "settlements_delete_admin" on weekly_settlements for delete using (is_admin());

create policy "settlement_payments_select" on settlement_payments for select
  using (
    is_admin() or is_factory_owner()
    or exists (
      select 1 from weekly_settlements w
      where w.id = settlement_payments.settlement_id and owns_distributor(w.distributor_id)
    )
  );

create policy "settlement_payments_insert" on settlement_payments for insert
  with check (
    is_admin()
    or exists (
      select 1 from weekly_settlements w
      where w.id = settlement_payments.settlement_id and owns_distributor(w.distributor_id)
    )
  );

create policy "settlement_payments_delete_admin" on settlement_payments for delete using (is_admin());

-- ------------------------------------------------------------
-- AUDIT LOGS — read only, admin (and factory owner, read-only) 
-- ------------------------------------------------------------
create policy "audit_logs_select" on audit_logs for select
  using (is_admin() or is_factory_owner());

create policy "audit_logs_insert_system" on audit_logs for insert
  with check (true); -- triggers run as the invoking user; inserts are system-generated

-- ============================================================
-- End of policies
-- ============================================================
