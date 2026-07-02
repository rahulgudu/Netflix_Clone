import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Single Toast item ─────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const t = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 4 seconds
    const d = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, 4000);
    return () => {
      clearTimeout(t);
      clearTimeout(d);
    };
  }, [toast.id, onRemove]);

  const config = {
    success: {
      icon: <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />,
      bar: "bg-emerald-500",
      border: "border-emerald-500/20",
    },
    error: {
      icon: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
      bar: "bg-[#e50914]",
      border: "border-[#e50914]/20",
    },
    info: {
      icon: <Info size={18} className="text-blue-400 flex-shrink-0" />,
      bar: "bg-blue-500",
      border: "border-blue-500/20",
    },
  }[toast.type];

  return (
    <div
      className={`relative flex items-start gap-3 bg-[#1e1e1e] border ${config.border} rounded-md px-4 py-3.5 shadow-xl shadow-black/60 min-w-[300px] max-w-[400px] transition-all duration-350 overflow-hidden`}
      style={{
        transform: visible ? "translateX(0)" : "translateX(110%)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Colored left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar} rounded-l-md`} />

      {config.icon}

      <p className="text-sm text-white font-medium leading-snug flex-1 pr-4">{toast.message}</p>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 350);
        }}
        className="text-zinc-600 hover:text-white transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 at once
  }, []);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
