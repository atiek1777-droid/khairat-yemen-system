"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Users as UsersIcon, Pencil, KeyRound, Power, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { userCreateSchema, userUpdateSchema, type UserCreateInput, type UserUpdateInput } from "@/lib/validations";
import { createUserAction, updateUserAction, resetPasswordAction, toggleUserActiveAction } from "@/app/actions/users";
import { generateTempPassword } from "@/lib/password";
import { formatDate, roleLabel } from "@/lib/format";
import type { Database, UserRole } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DistributorOption = { id: string; name: string };

export function UsersClient({
  users,
  distributors,
  currentUserId,
}: {
  users: Profile[];
  distributors: DistributorOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const createForm = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { role: "distributor", can_edit: false, can_delete_financial: false, password: generateTempPassword() },
  });
  const editForm = useForm<UserUpdateInput>({ resolver: zodResolver(userUpdateSchema) });

  const watchedCreateRole = createForm.watch("role");
  const watchedEditRole = editForm.watch("role");
  const watchedRole: UserRole | undefined = editing ? watchedEditRole : watchedCreateRole;

  function openCreate() {
    setEditing(null);
    setGeneratedPassword(null);
    createForm.reset({
      full_name: "",
      username: "",
      phone: "",
      role: "distributor",
      distributor_id: null,
      can_edit: false,
      can_delete_financial: false,
      password: generateTempPassword(),
    });
    setModalOpen(true);
  }

  function openEdit(u: Profile) {
    setEditing(u);
    setGeneratedPassword(null);
    editForm.reset({
      id: u.id,
      full_name: u.full_name,
      phone: u.phone ?? "",
      role: u.role,
      distributor_id: u.distributor_id,
      can_edit: u.can_edit,
      can_delete_financial: u.can_delete_financial,
      is_active: u.is_active,
    });
    setModalOpen(true);
  }

  async function onSubmitCreate(values: UserCreateInput) {
    const result = await createUserAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم إنشاء المستخدم");
    if (result.generatedPassword) setGeneratedPassword(result.generatedPassword);
    else setModalOpen(false);
    router.refresh();
  }

  async function onSubmitEdit(values: UserUpdateInput) {
    const result = await updateUserAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم التحديث");
    setModalOpen(false);
    router.refresh();
  }

  function onResetPassword(u: Profile) {
    confirm({
      title: "إعادة تعيين كلمة المرور",
      description: `سيتم إنشاء كلمة مرور مؤقتة جديدة لـ "${u.full_name}". أخبره بها لتسجيل الدخول.`,
      onConfirm: async () => {
        const result = await resetPasswordAction(u.id);
        if (!result.ok) {
          toast.error(result.message ?? "حدث خطأ");
          return;
        }
        setEditing(u);
        setGeneratedPassword(result.generatedPassword ?? null);
        setModalOpen(true);
      },
    });
  }

  function onToggleActive(u: Profile) {
    confirm({
      title: u.is_active ? "إيقاف المستخدم" : "تفعيل المستخدم",
      description: `سيتم ${u.is_active ? "إيقاف" : "تفعيل"} حساب "${u.full_name}".`,
      danger: u.is_active,
      onConfirm: async () => {
        const result = await toggleUserActiveAction(u.id, !u.is_active);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم التحديث");
          router.refresh();
        }
      },
    });
  }

  async function copyPassword() {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const columns: Column<Profile>[] = [
    { header: "الاسم", accessor: (u) => u.full_name, mobilePrimary: true },
    { header: "اسم المستخدم", accessor: (u) => u.username },
    { header: "الصلاحية", accessor: (u) => <Badge variant="navy">{roleLabel(u.role)}</Badge> },
    { header: "الحالة", accessor: (u) => <Badge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "نشط" : "موقوف"}</Badge> },
    { header: "تاريخ الإنشاء", accessor: (u) => formatDate(u.created_at) },
    {
      header: "إجراءات",
      accessor: (u) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onResetPassword(u)} className="rounded-lg p-1.5 text-gold-700 hover:bg-navy-50" title="إعادة تعيين كلمة المرور">
            <KeyRound className="h-4 w-4" />
          </button>
          {u.id !== currentUserId && (
            <button
              onClick={() => onToggleActive(u)}
              className={`rounded-lg p-1.5 hover:bg-navy-50 ${u.is_active ? "text-danger" : "text-success"}`}
              title={u.is_active ? "إيقاف" : "تفعيل"}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="المستخدمون"
        subtitle="إنشاء وإدارة حسابات المدراء ومالكي المصنع والموزّعين"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> مستخدم جديد
          </button>
        }
      />

      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="لا يوجد مستخدمون بعد" />
      ) : (
        <div className="card p-3 sm:p-4">
          <DataTable columns={columns} rows={users} />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={generatedPassword ? "بيانات الدخول" : editing ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
      >
        {generatedPassword ? (
          <div className="space-y-4">
            <p className="text-sm text-navy-500">
              شارك بيانات الدخول هذه مع المستخدم. لن تظهر كلمة المرور مرة أخرى بعد إغلاق هذه النافذة.
            </p>
            <div className="rounded-xl bg-navy-50 p-4">
              <p className="text-xs font-bold text-navy-400">اسم المستخدم</p>
              <p className="mt-1 font-mono text-sm font-bold text-navy-900">{editing?.username}</p>
              <p className="mt-3 text-xs font-bold text-navy-400">كلمة المرور المؤقتة</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="font-mono text-lg font-extrabold text-emerald-700">{generatedPassword}</p>
                <button onClick={copyPassword} className="btn-outline !px-3 !py-1.5 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
              </div>
            </div>
            <button onClick={() => setModalOpen(false)} className="btn-primary w-full">
              تم
            </button>
          </div>
        ) : editing ? (
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4" noValidate>
            <Field label="الاسم الكامل" htmlFor="e_full_name" error={editForm.formState.errors.full_name?.message} required>
              <Input id="e_full_name" {...editForm.register("full_name")} />
            </Field>
            <Field label="رقم الهاتف" htmlFor="e_phone" error={editForm.formState.errors.phone?.message}>
              <Input id="e_phone" {...editForm.register("phone")} />
            </Field>
            <Field label="الصلاحية" htmlFor="e_role" error={editForm.formState.errors.role?.message} required>
              <Select id="e_role" {...editForm.register("role")}>
                <option value="admin">مدير النظام</option>
                <option value="factory_owner">مالك المصنع</option>
                <option value="distributor">موزّع</option>
              </Select>
            </Field>
            {watchedRole === "distributor" && (
              <Field label="الموزّع المرتبط" htmlFor="e_distributor" error={editForm.formState.errors.distributor_id?.message} required>
                <Select id="e_distributor" {...editForm.register("distributor_id")}>
                  <option value="">اختر الموزّع</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            {watchedRole === "factory_owner" && (
              <label className="flex items-center gap-2.5 text-sm font-bold text-navy-700">
                <Checkbox {...editForm.register("can_edit")} /> السماح بالتعديل (وليس القراءة فقط)
              </label>
            )}
            {watchedRole === "distributor" && (
              <label className="flex items-center gap-2.5 text-sm font-bold text-navy-700">
                <Checkbox {...editForm.register("can_delete_financial")} /> السماح بحذف السجلات المالية
              </label>
            )}
            <label className="flex items-center gap-2.5 text-sm font-bold text-navy-700">
              <Checkbox {...editForm.register("is_active")} /> الحساب نشط
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">إلغاء</button>
              <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary flex-1">حفظ</button>
            </div>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4" noValidate>
            <Field label="الاسم الكامل" htmlFor="c_full_name" error={createForm.formState.errors.full_name?.message} required>
              <Input id="c_full_name" {...createForm.register("full_name")} />
            </Field>
            <Field label="اسم المستخدم (بالإنجليزية)" htmlFor="c_username" error={createForm.formState.errors.username?.message} required>
              <Input id="c_username" placeholder="مثال: distributor1" {...createForm.register("username")} />
            </Field>
            <Field label="رقم الهاتف" htmlFor="c_phone" error={createForm.formState.errors.phone?.message}>
              <Input id="c_phone" {...createForm.register("phone")} />
            </Field>
            <Field label="الصلاحية" htmlFor="c_role" error={createForm.formState.errors.role?.message} required>
              <Select id="c_role" {...createForm.register("role")}>
                <option value="admin">مدير النظام</option>
                <option value="factory_owner">مالك المصنع</option>
                <option value="distributor">موزّع</option>
              </Select>
            </Field>
            {watchedRole === "distributor" && (
              <Field label="الموزّع المرتبط" htmlFor="c_distributor" error={createForm.formState.errors.distributor_id?.message} required>
                <Select id="c_distributor" {...createForm.register("distributor_id")}>
                  <option value="">اختر الموزّع</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="كلمة المرور المؤقتة" htmlFor="c_password" error={createForm.formState.errors.password?.message} hint="تم إنشاؤها تلقائياً، يمكنك تعديلها" required>
              <Input id="c_password" {...createForm.register("password")} />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">إلغاء</button>
              <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary flex-1">إنشاء المستخدم</button>
            </div>
          </form>
        )}
      </Modal>

      {dialog}
    </div>
  );
}
