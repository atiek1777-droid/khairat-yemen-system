"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { profileUpdateSchema, passwordChangeSchema, type ProfileUpdateInput, type PasswordChangeInput } from "@/lib/validations";
import { updateOwnProfileAction, changeOwnPasswordAction } from "@/app/actions/profile";
import { roleLabel } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";

export function ProfileClient({ profile }: { profile: CurrentProfile }) {
  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: profile.full_name, phone: profile.phone ?? "" },
  });
  const passwordForm = useForm<PasswordChangeInput>({ resolver: zodResolver(passwordChangeSchema) });

  async function onProfileSubmit(values: ProfileUpdateInput) {
    const result = await updateOwnProfileAction(values);
    if (!result.ok) toast.error(result.message ?? "حدث خطأ");
    else toast.success(result.message ?? "تم الحفظ");
  }

  async function onPasswordSubmit(values: PasswordChangeInput) {
    const result = await changeOwnPasswordAction(values);
    if (!result.ok) toast.error(result.message ?? "حدث خطأ");
    else {
      toast.success(result.message ?? "تم التغيير");
      passwordForm.reset({ new_password: "", confirm_password: "" });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="الملف الشخصي" subtitle={`${roleLabel(profile.role)} · ${profile.username}`} />

      <Card className="max-w-xl">
        <CardHeader title="البيانات الشخصية" />
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" noValidate>
          <Field label="الاسم الكامل" htmlFor="p_name" error={profileForm.formState.errors.full_name?.message} required>
            <Input id="p_name" {...profileForm.register("full_name")} />
          </Field>
          <Field label="رقم الهاتف" htmlFor="p_phone" error={profileForm.formState.errors.phone?.message}>
            <Input id="p_phone" {...profileForm.register("phone")} />
          </Field>
          <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
            <Save className="h-4 w-4" /> حفظ التغييرات
          </button>
        </form>
      </Card>

      <Card className="max-w-xl">
        <CardHeader title="تغيير كلمة المرور" />
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
          <Field label="كلمة المرور الجديدة" htmlFor="new_password" error={passwordForm.formState.errors.new_password?.message} required>
            <Input id="new_password" type="password" {...passwordForm.register("new_password")} />
          </Field>
          <Field label="تأكيد كلمة المرور" htmlFor="confirm_password" error={passwordForm.formState.errors.confirm_password?.message} required>
            <Input id="confirm_password" type="password" {...passwordForm.register("confirm_password")} />
          </Field>
          <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-gold">
            <KeyRound className="h-4 w-4" /> تغيير كلمة المرور
          </button>
        </form>
      </Card>
    </div>
  );
}
