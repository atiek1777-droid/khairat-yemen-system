import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { roleLabel } from "@/lib/format";
import {
  ShoppingCart, Package, HandCoins, Receipt, Handshake, CalendarDays, UserSquare2, ShieldCheck,
} from "lucide-react";

export const metadata = { title: "المساعدة — معامل خيرات اليمن" };

const SECTIONS = [
  {
    icon: Package,
    title: "الاستلام والعهدة",
    body: "عند استلام عبوات من المصنع، سجّلها من صفحة «الاستلام والعهدة» باختيار الموزّع والعدد وتاريخ الاستلام. تحدَّث العهدة الحالية تلقائياً بعد كل عملية بيع أو استلام أو تسجيل تالف/مرتجع.",
  },
  {
    icon: ShoppingCart,
    title: "تسجيل المبيعات",
    body: "من صفحة «المبيعات» اختر نوع البيع: نقدي أو آجل. البيع الآجل يتطلب اختيار عميل محفوظ مسبقاً ويُضاف تلقائياً إلى ديونه. يمكنك أيضاً تسجيل دفعة جزئية عند إنشاء فاتورة آجلة.",
  },
  {
    icon: UserSquare2,
    title: "العملاء وكشف الحساب",
    body: "أضف عملاءك من صفحة «العملاء». اضغط على اسم أي عميل للاطلاع على كشف حسابه الكامل (كل الفواتير والدفعات مع الرصيد المتراكم)، ويمكنك طباعته أو تصديره أو مشاركته عبر واتساب.",
  },
  {
    icon: HandCoins,
    title: "تحصيل الديون",
    body: "من صفحة «تحصيل الديون»، اختر العميل وأدخل المبلغ المُحصَّل. يوزَّع المبلغ تلقائياً على أقدم الفواتير المستحقة أولاً، ولا يمكن إدخال مبلغ أكبر من إجمالي دين العميل.",
  },
  {
    icon: Receipt,
    title: "المصروفات",
    body: "سجّل كل مصروف يومي بتصنيفه الصحيح (مواصلات، بترول، تحميل وتنزيل، صيانة، اتصالات، نقد مع عتيق، أو أخرى). تصنيف «نقد مع عتيق» يُحتسب ضمن إجمالي المصروفات كما يظهر بشكل منفصل في كل التقارير.",
  },
  {
    icon: Handshake,
    title: "التسوية الأسبوعية",
    body: "في نهاية كل أسبوع، أنشئ تسوية جديدة لكل موزّع باختيار بداية ونهاية الأسبوع. يحتسب النظام تلقائياً المبيعات والتكلفة والتحصيلات والمصروفات، ويحدد المبلغ المستحق للمصنع. سجّل الدفعات حتى تكتمل التسوية.",
  },
  {
    icon: CalendarDays,
    title: "التقارير",
    body: "التقارير اليومية والأسبوعية والشهرية متاحة مع إمكانية التصفية حسب التاريخ والموزّع. كل تقرير يدعم الطباعة المباشرة، وتصدير PDF وExcel، ومشاركة ملخص عبر واتساب.",
  },
  {
    icon: ShieldCheck,
    title: "الصلاحيات",
    body: "المدير: صلاحية كاملة على كل شيء. مالك المصنع: عرض فقط لكل البيانات ما لم يمنحه المدير صلاحية التعديل. الموزّع: يرى ويُدخل بيانات نطاقه فقط (مبيعاته وعملاءه ومصروفاته)، ولا يمكنه حذف سجلات مالية إلا بإذن خاص من المدير.",
  },
];

export default async function HelpPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-5">
      <PageHeader title="المساعدة" subtitle={`دليل استخدام سريع لصلاحية: ${roleLabel(profile.role)}`} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader title={s.title} action={<s.icon className="h-5 w-5 text-emerald-700" />} />
            <p className="text-sm leading-relaxed text-navy-600">{s.body}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="بحاجة إلى مساعدة إضافية؟" />
        <p className="text-sm text-navy-600">
          تواصل مع إدارة معامل خيرات اليمن على الأرقام 784355755 أو 738409274 — الحصبة، شارع عمران، جوار جامع السلام.
        </p>
      </Card>
    </div>
  );
}
