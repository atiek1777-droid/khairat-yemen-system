import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database.types";

export interface CurrentProfile {
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
}

/** Fetches the signed-in user's profile. Redirects to /login if not authenticated. */
export async function requireProfile(): Promise<CurrentProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, phone, role, distributor_id, can_edit, can_delete_financial, is_active, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/login");
  if (!profile.is_active) redirect("/login?disabled=1");

  return profile as CurrentProfile;
}

/** Redirects non-admins away from admin-only pages. */
export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export function canEditData(profile: CurrentProfile): boolean {
  return profile.role === "admin" || (profile.role === "distributor") || (profile.role === "factory_owner" && profile.can_edit);
}

export function canDeleteFinancial(profile: CurrentProfile): boolean {
  return profile.role === "admin" || (profile.role === "distributor" && profile.can_delete_financial);
}

export function isReadOnly(profile: CurrentProfile): boolean {
  return profile.role === "factory_owner" && !profile.can_edit;
}
