// Hand-written types mirroring supabase/schema.sql.
// If you change the schema, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > types/database.types.ts
// and reconcile with the app-level helpers in lib/types.ts.

export type UserRole = "admin" | "factory_owner" | "distributor";
export type SaleType = "cash" | "credit";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type SettlementStatus = "open" | "settled";
export type ExpenseCategory =
  | "مواصلات"
  | "بترول"
  | "تحميل وتنزيل"
  | "صيانة"
  | "اتصالات"
  | "نقد مع عتيق"
  | "مصروفات أخرى";
export type InventoryAdjustmentType = "damaged" | "returned";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          phone: string | null;
          role: UserRole;
          distributor_id: string | null;
          can_edit: boolean;
          can_delete_financial: boolean;
          is_active: boolean;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          username: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      distributors: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          area: string | null;
          notes: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["distributors"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["distributors"]["Row"]>;
      };
      factories: {
        Row: {
          id: string;
          name: string;
          name_ar: string;
          address: string;
          phone_primary: string;
          phone_secondary: string | null;
          currency: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["factories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["factories"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          container_size_liters: number;
          factory_cost: number;
          is_active: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      product_cost_history: {
        Row: {
          id: string;
          product_id: string;
          old_cost: number | null;
          new_cost: number;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_cost_history"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["product_cost_history"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          address: string | null;
          distributor_id: string;
          notes: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          name: string;
          distributor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      inventory_receipts: {
        Row: {
          id: string;
          distributor_id: string;
          product_id: string;
          quantity_containers: number;
          unit_cost: number;
          receipt_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_receipts"]["Row"]> & {
          distributor_id: string;
          product_id: string;
          quantity_containers: number;
          unit_cost: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_receipts"]["Row"]>;
      };
      inventory_adjustments: {
        Row: {
          id: string;
          distributor_id: string;
          product_id: string;
          adjustment_type: InventoryAdjustmentType;
          quantity_containers: number;
          adjustment_date: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_adjustments"]["Row"]> & {
          distributor_id: string;
          product_id: string;
          adjustment_type: InventoryAdjustmentType;
          quantity_containers: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_adjustments"]["Row"]>;
      };
      sales: {
        Row: {
          id: string;
          invoice_number: string;
          distributor_id: string;
          customer_id: string | null;
          customer_name_cash: string | null;
          sale_type: SaleType;
          total_amount: number;
          total_cost: number;
          paid_amount: number;
          payment_status: PaymentStatus;
          due_date: string | null;
          sale_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sales"]["Row"]> & {
          distributor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Row"]>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity_containers: number;
          unit_price: number;
          unit_cost: number;
          line_total: number;
          line_cost: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sale_items"]["Row"]> & {
          sale_id: string;
          product_id: string;
          quantity_containers: number;
          unit_price: number;
          unit_cost: number;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          customer_id: string;
          sale_id: string;
          distributor_id: string;
          amount: number;
          payment_date: string;
          method: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          customer_id: string;
          sale_id: string;
          distributor_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      expenses: {
        Row: {
          id: string;
          distributor_id: string | null;
          category: ExpenseCategory;
          amount: number;
          expense_date: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
          category: ExpenseCategory;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
      };
      weekly_settlements: {
        Row: {
          id: string;
          distributor_id: string;
          week_start: string;
          week_end: string;
          total_sales: number;
          total_cost: number;
          total_collected: number;
          total_expenses: number;
          amount_due_to_factory: number;
          amount_paid_to_factory: number;
          status: SettlementStatus;
          notes: string | null;
          created_by: string | null;
          settled_by: string | null;
          settled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_settlements"]["Row"]> & {
          distributor_id: string;
          week_start: string;
          week_end: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_settlements"]["Row"]>;
      };
      settlement_payments: {
        Row: {
          id: string;
          settlement_id: string;
          amount: number;
          payment_date: string;
          method: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["settlement_payments"]["Row"]> & {
          settlement_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["settlement_payments"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          action: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Record<string, unknown>;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_settings"]["Row"]> & {
          key: string;
          value: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
      };
    };
    Views: {
      distributor_custody: {
        Row: {
          distributor_id: string;
          distributor_name: string;
          product_id: string;
          product_name: string;
          received_containers: number;
          sold_containers: number;
          damaged_containers: number;
          returned_containers: number;
          current_custody: number;
        };
      };
      customer_balances: {
        Row: {
          customer_id: string;
          customer_name: string;
          distributor_id: string;
          total_credit_sales: number;
          total_paid: number;
          total_debt: number;
          last_sale_date: string | null;
        };
      };
    };
    Functions: {
      next_invoice_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
