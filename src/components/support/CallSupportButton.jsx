import React, { useState } from "react";
import { Headphones } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import SupportCallModal from "@/components/support/SupportCallModal";

export default function CallSupportButton({ userType, orderContext, bottomClass }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={"fixed right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-saffron text-white font-bold text-sm shadow-lg shadow-saffron/30 hover:bg-saffron/90 transition-all active:scale-95 " + (bottomClass || "bottom-20")}
      >
        <Headphones className="w-4 h-4" />
        <span className="hidden sm:inline">Call Support</span>
        <span className="sm:hidden">Support</span>
      </button>
      {modalOpen && (
        <SupportCallModal
          user={user}
          userType={userType}
          orderContext={orderContext}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}