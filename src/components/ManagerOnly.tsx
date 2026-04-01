"use client";

import { useAuth } from "@/lib/AuthContext";
import { Lock } from "lucide-react";
import { useState } from "react";
import PinModal from "./PinModal";
import { useToast } from "./ui/Toast";

export default function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { isManager, login } = useAuth();
  const { toast } = useToast();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  if (isManager) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl border border-border p-10 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Manager Access Required</h2>
        <p className="text-sm text-gray-400 mb-6">
          Login as Manager to access this page.
        </p>
        <button
          onClick={() => setPinModalOpen(true)}
          className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition"
        >
          Login as Manager
        </button>
      </div>

      <PinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSubmit={(pin) => {
          const ok = login(pin);
          if (ok) {
            setPinModalOpen(false);
            toast("Welcome, Manager!", "success");
          }
          return ok;
        }}
      />
    </div>
  );
}
