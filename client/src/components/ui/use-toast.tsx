// client/src/components/ui/use-toast.tsx
"use client";

import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // inside ToastProvider, after defining context values
;(window as any).__toastContext = { toasts, addToast, removeToast };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <strong>{t.title}</strong>
            <p className="text-sm">{t.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ✅ direct helper for shadcn-style `toast(...)`
export function toast(toastData: Omit<Toast, "id">) {
  const context = (window as any).__toastContext as ToastContextType;
  if (context) {
    context.addToast(toastData);
  } else {
    console.warn("ToastProvider not mounted yet");
  }
}
