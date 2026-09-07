"use client";

import { LogOut, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoIcon } from "@/components/brand/Logo";
import { roleLabel } from "@/lib/format";
import type { UserRole } from "@/types/database.types";

export function Topbar({ fullName, role }: { fullName: string; role: UserRole }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2 sm:hidden">
        <LogoIcon size={30} />
        <span className="text-sm font-extrabold text-navy-900">خيرات اليمن</span>
      </div>
      <div className="hidden sm:block" />
      <div className="flex items-center gap-3">
        <div className="hidden text-left sm:block">
          <p className="text-sm font-bold text-navy-800">{fullName}</p>
          <p className="text-xs text-navy-400">{roleLabel(role)}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-50 text-sm font-extrabold text-gold-700">
          {fullName.trim().charAt(0)}
        </div>
        <button
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-500 hover:bg-danger-50 hover:text-danger"
          title="تسجيل الخروج"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
