"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  function confirm(opts: { title: string; description?: string; danger?: boolean; onConfirm: () => void }) {
    setState({ open: true, ...opts });
  }

  function close() {
    setState((s) => (s ? { ...s, open: false } : s));
  }

  const dialog: ReactNode = state ? (
    <ConfirmDialogView
      open={state.open}
      title={state.title}
      description={state.description}
      danger={state.danger}
      onCancel={close}
      onConfirm={() => {
        state.onConfirm();
        close();
      }}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialogView({
  open,
  title,
  description,
  danger,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-card-hover">
        <div className="mb-3 flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? "bg-danger-50" : "bg-emerald-50"}`}>
            <AlertTriangle className={`h-5 w-5 ${danger ? "text-danger" : "text-emerald-700"}`} />
          </div>
          <button onClick={onCancel} className="rounded-full p-1 text-navy-400 hover:bg-navy-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-base font-bold text-navy-900">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-navy-500">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="btn-outline flex-1">
            إلغاء
          </button>
          <button onClick={onConfirm} className={danger ? "btn-danger flex-1" : "btn-primary flex-1"}>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
