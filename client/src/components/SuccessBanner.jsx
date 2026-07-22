import React from "react";

export default function SuccessBanner({ auditTrail, onClose }) {
  if (!auditTrail) return null;

  return (
    <div className="w-full bg-[#10B981] text-black px-6 py-4 rounded-lg flex items-center justify-between gap-3 shadow-lg shadow-black/20 font-medium transition-all animate-fadeIn">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-black filled">
          check_circle
        </span>
        <div className="flex-1 text-sm">
          <span className="font-bold">
            ✓ Assortment Plan Submitted Successfully!
          </span>{" "}
          Audit ID: {auditTrail.audit_id} | Submitted by:{" "}
          {auditTrail.submitted_by} | Timestamp:{" "}
          {new Date(auditTrail.submitted_at)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19)}{" "}
          UTC
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-black/70 hover:text-black font-bold text-sm px-2 py-1 rounded hover:bg-black/10 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
