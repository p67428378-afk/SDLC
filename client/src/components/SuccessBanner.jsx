import React from "react";

export default function SuccessBanner({ auditTrail, onClose }) {
  if (!auditTrail) return null;

  return (
    <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg p-md flex flex-col md:flex-row md:items-center justify-between gap-sm shadow-sm mb-lg transition-all animate-fadeIn">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-[#16A34A] font-bold">
          check_circle
        </span>
        <span className="font-body-md text-body-md text-slate-800">
          ✅ Assortment changes submitted successfully.
          <strong className="ml-1">Audit ID:</strong> {auditTrail.audit_id}.
          <strong className="ml-2">Approved by:</strong>{" "}
          {auditTrail.submitted_by}
          <strong className="ml-2">on:</strong>{" "}
          {new Date(auditTrail.submitted_at).toLocaleString()}.
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-800 font-bold text-sm px-2 py-1 rounded hover:bg-green-100 transition-colors self-end md:self-auto"
      >
        Dismiss
      </button>
    </div>
  );
}
