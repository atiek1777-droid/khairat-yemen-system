import type { UserRole } from "@/types/database.types";
import {
  LayoutDashboard,
  Users,
  Truck,
  Settings,
  Package,
  ClipboardList,
  ShoppingCart,
  UserSquare2,
  HandCoins,
  Receipt,
  Handshake,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  FileBarChart,
  FileText,
  ScrollText,
  HelpCircle,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, roles: ["admin", "factory_owner", "distributor"], group: "عام" },

  { href: "/inventory", label: "الاستلام والعهدة", icon: Package, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },
  { href: "/sales", label: "المبيعات", icon: ShoppingCart, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },
  { href: "/customers", label: "العملاء", icon: UserSquare2, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },
  { href: "/collections", label: "تحصيل الديون", icon: HandCoins, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },
  { href: "/expenses", label: "المصروفات", icon: Receipt, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },
  { href: "/settlements", label: "التسوية الأسبوعية", icon: Handshake, roles: ["admin", "factory_owner", "distributor"], group: "العمليات" },

  { href: "/reports/daily", label: "التقرير اليومي", icon: CalendarDays, roles: ["admin", "factory_owner", "distributor"], group: "التقارير" },
  { href: "/reports/weekly", label: "التقرير الأسبوعي", icon: CalendarRange, roles: ["admin", "factory_owner", "distributor"], group: "التقارير" },
  { href: "/reports/monthly", label: "التقرير الشهري", icon: CalendarClock, roles: ["admin", "factory_owner", "distributor"], group: "التقارير" },
  { href: "/reports/distributor", label: "كشف حساب موزّع", icon: FileBarChart, roles: ["admin", "factory_owner"], group: "التقارير" },
  { href: "/reports/factory", label: "كشف حساب المصنع", icon: FileText, roles: ["admin", "factory_owner"], group: "التقارير" },

  { href: "/users", label: "المستخدمون", icon: Users, roles: ["admin"], group: "الإدارة" },
  { href: "/distributors", label: "الموزّعون", icon: Truck, roles: ["admin", "factory_owner"], group: "الإدارة" },
  { href: "/factory-settings", label: "بيانات المصنع", icon: Settings, roles: ["admin"], group: "الإدارة" },
  { href: "/product-settings", label: "المنتج والتكلفة", icon: ClipboardList, roles: ["admin"], group: "الإدارة" },
  { href: "/audit-log", label: "سجل العمليات", icon: ScrollText, roles: ["admin", "factory_owner"], group: "الإدارة" },

  { href: "/profile", label: "الملف الشخصي", icon: UserCircle, roles: ["admin", "factory_owner", "distributor"], group: "أخرى" },
  { href: "/help", label: "المساعدة", icon: HelpCircle, roles: ["admin", "factory_owner", "distributor"], group: "أخرى" },
];

export const MOBILE_PRIMARY_HREFS = ["/dashboard", "/sales", "/customers", "/reports/daily"];
