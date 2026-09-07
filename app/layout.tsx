import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const tajawal = localFont({
  src: [
    { path: "../public/fonts/Tajawal-400.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Tajawal-500.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Tajawal-700.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Tajawal-800.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/Tajawal-900.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "معامل خيرات اليمن — نظام إدارة التوزيع",
  description: "نظام إدارة المخزون والمبيعات والديون والمصروفات والتسويات لمعامل خيرات اليمن",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#146B4A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
