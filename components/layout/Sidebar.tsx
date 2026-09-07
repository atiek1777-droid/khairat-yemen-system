"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { LogoIcon } from "@/components/brand/Logo";
import type { UserRole } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/format";

export function Sidebar({ role, fullName }: { role: UserRole; fullName: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-l border-navy-100 bg-white sm:flex">
      <div className="flex items-center gap-2.5 border-b border-navy-100 px-5 py-5">
        <LogoIcon size={38} />
        <div>
          <p className="text-sm font-extrabold text-navy-900 leading-tight">معامل خيرات اليمن</p>
          <p className="text-xs text-navy-400">{roleLabel(role)}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className="mb-1.5 px-2 text-[11px] font-bold text-navy-300">{group}</p>
            <div className="space-y-0.5">
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                        active ? "bg-emerald-700 text-white" : "text-navy-600 hover:bg-navy-50"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-navy-100 px-4 py-3 text-center text-[11px] text-navy-300">
        {fullName} — {new Date().getFullYear()}
      </div>
    </aside>
  );
}
