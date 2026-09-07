"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS, MOBILE_PRIMARY_HREFS } from "@/components/layout/nav-items";
import type { UserRole } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const primary = MOBILE_PRIMARY_HREFS.map((h) => items.find((i) => i.href === h)).filter(Boolean) as typeof items;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-navy-100 bg-white/95 backdrop-blur sm:hidden">
        {primary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold",
                active ? "text-emerald-700" : "text-navy-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-navy-400"
        >
          <Menu className="h-5 w-5" />
          المزيد
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-navy-900/50 backdrop-blur-sm sm:hidden animate-fade-in">
          <div className="max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-navy-900">كل الصفحات</h3>
              <button onClick={() => setOpen(false)} className="rounded-full bg-navy-50 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-navy-100 py-3.5 text-center text-[11px] font-bold text-navy-600 active:bg-navy-50"
                  >
                    <Icon className="h-5 w-5 text-emerald-700" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
