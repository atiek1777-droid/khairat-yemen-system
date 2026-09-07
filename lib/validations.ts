import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/calculations";

const requiredText = (label: string, min = 2) =>
  z.string({ required_error: `${label} مطلوب` }).trim().min(min, `${label} يجب أن يكون ${min} أحرف على الأقل`);

const positiveNumber = (label: string) =>
  z.coerce.number({ invalid_type_error: `${label} يجب أن يكون رقماً` }).positive(`${label} يجب أن يكون أكبر من صفر`);

const nonNegativeNumber = (label: string) =>
  z.coerce.number({ invalid_type_error: `${label} يجب أن يكون رقماً` }).min(0, `${label} لا يمكن أن يكون سالباً`);

export const loginSchema = z.object({
  username: requiredText("اسم المستخدم"),
  password: z.string({ required_error: "كلمة المرور مطلوبة" }).min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const distributorSchema = z.object({
  name: requiredText("اسم الموزّع"),
  phone: z.string().trim().optional().or(z.literal("")),
  area: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});
export type DistributorInput = z.infer<typeof distributorSchema>;

export const userCreateSchema = z.object({
  full_name: requiredText("الاسم الكامل"),
  username: requiredText("اسم المستخدم", 3).regex(/^[a-zA-Z0-9_.]+$/, "اسم المستخدم يجب أن يكون بالإنجليزية بدون مسافات"),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["admin", "factory_owner", "distributor"], { required_error: "الصلاحية مطلوبة" }),
  distributor_id: z.string().uuid().optional().nullable(),
  can_edit: z.boolean().default(false),
  can_delete_financial: z.boolean().default(false),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: requiredText("الاسم الكامل"),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["admin", "factory_owner", "distributor"]),
  distributor_id: z.string().uuid().optional().nullable(),
  can_edit: z.boolean().default(false),
  can_delete_financial: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const factorySettingsSchema = z.object({
  name_ar: requiredText("اسم المصنع"),
  address: requiredText("العنوان"),
  phone_primary: requiredText("رقم الهاتف", 6),
  phone_secondary: z.string().trim().optional().or(z.literal("")),
  currency: requiredText("العملة"),
});
export type FactorySettingsInput = z.infer<typeof factorySettingsSchema>;

export const productCostSchema = z.object({
  factory_cost: positiveNumber("تكلفة العبوة"),
});
export type ProductCostInput = z.infer<typeof productCostSchema>;

export const customerSchema = z.object({
  name: requiredText("اسم العميل"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  distributor_id: z.string({ required_error: "الموزّع مطلوب" }).uuid("الموزّع مطلوب"),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const receiptSchema = z.object({
  distributor_id: z.string({ required_error: "الموزّع مطلوب" }).uuid("الموزّع مطلوب"),
  product_id: z.string({ required_error: "المنتج مطلوب" }).uuid("المنتج مطلوب"),
  quantity_containers: z.coerce.number().int("العدد يجب أن يكون رقماً صحيحاً").positive("العدد يجب أن يكون أكبر من صفر"),
  unit_cost: positiveNumber("تكلفة العبوة"),
  receipt_date: requiredText("التاريخ", 8),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type ReceiptInput = z.infer<typeof receiptSchema>;

export const adjustmentSchema = z.object({
  distributor_id: z.string({ required_error: "الموزّع مطلوب" }).uuid("الموزّع مطلوب"),
  product_id: z.string({ required_error: "المنتج مطلوب" }).uuid("المنتج مطلوب"),
  adjustment_type: z.enum(["damaged", "returned"], { required_error: "النوع مطلوب" }),
  quantity_containers: z.coerce.number().int().positive("العدد يجب أن يكون أكبر من صفر"),
  adjustment_date: requiredText("التاريخ", 8),
  reason: z.string().trim().optional().or(z.literal("")),
});
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const saleSchema = z
  .object({
    distributor_id: z.string({ required_error: "الموزّع مطلوب" }).uuid("الموزّع مطلوب"),
    sale_type: z.enum(["cash", "credit"], { required_error: "نوع البيع مطلوب" }),
    customer_id: z.string().uuid().optional().nullable(),
    customer_name_cash: z.string().trim().optional().or(z.literal("")),
    product_id: z.string({ required_error: "المنتج مطلوب" }).uuid("المنتج مطلوب"),
    quantity_containers: z.coerce.number().int("العدد يجب أن يكون رقماً صحيحاً").positive("العدد يجب أن يكون أكبر من صفر"),
    unit_price: positiveNumber("سعر البيع"),
    sale_date: requiredText("تاريخ البيع", 8),
    due_date: z.string().trim().optional().or(z.literal("")),
    paid_amount: nonNegativeNumber("المبلغ المدفوع").default(0),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((v) => v.sale_type === "cash" || !!v.customer_id, {
    message: "يجب اختيار العميل للبيع الآجل",
    path: ["customer_id"],
  });
export type SaleInput = z.infer<typeof saleSchema>;

export const paymentSchema = z.object({
  customer_id: z.string({ required_error: "العميل مطلوب" }).uuid("العميل مطلوب"),
  amount: positiveNumber("المبلغ"),
  payment_date: requiredText("تاريخ السداد", 8),
  method: z.string().trim().default("نقدي"),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const expenseSchema = z.object({
  distributor_id: z.string().uuid().optional().nullable(),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: "التصنيف مطلوب" }),
  amount: positiveNumber("المبلغ"),
  expense_date: requiredText("التاريخ", 8),
  description: z.string().trim().optional().or(z.literal("")),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const settlementCreateSchema = z
  .object({
    distributor_id: z.string({ required_error: "الموزّع مطلوب" }).uuid("الموزّع مطلوب"),
    week_start: requiredText("بداية الأسبوع", 8),
    week_end: requiredText("نهاية الأسبوع", 8),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((v) => v.week_end >= v.week_start, {
    message: "نهاية الأسبوع يجب أن تكون بعد بدايته",
    path: ["week_end"],
  });
export type SettlementCreateInput = z.infer<typeof settlementCreateSchema>;

export const settlementPaymentSchema = z.object({
  settlement_id: z.string().uuid(),
  amount: positiveNumber("المبلغ"),
  payment_date: requiredText("التاريخ", 8),
  method: z.string().trim().default("نقدي"),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type SettlementPaymentInput = z.infer<typeof settlementPaymentSchema>;

export const profileUpdateSchema = z.object({
  full_name: requiredText("الاسم الكامل"),
  phone: z.string().trim().optional().or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    new_password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirm_password: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
