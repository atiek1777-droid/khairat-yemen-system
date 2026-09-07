import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import type { CurrentProfile } from "@/lib/auth";

export function AppShell({ profile, children }: { profile: CurrentProfile; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-bg">
      <Sidebar role={profile.role} fullName={profile.full_name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-8">{children}</main>
      </div>
      <MobileNav role={profile.role} />
    </div>
  );
}
