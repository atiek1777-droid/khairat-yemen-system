"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[1000] flex items-center justify-between gap-3 px-4 py-3 shadow-xl" style={{ background: "#17324D", color: "#fff" }}>
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="معامل خيرات اليمن" className="h-9 w-9 rounded-xl" />
        <span className="text-sm font-bold">هل تريد تثبيت معامل خيرات اليمن؟</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={install} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: "#D9A441", color: "#17324D" }}>
          <Download className="h-4 w-4" />
          تثبيت
        </button>
        <button onClick={() => setShow(false)} className="text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
