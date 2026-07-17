import React from "react";

export default function ConfirmationModal({ auditTrail, onDismiss }) {
  if (!auditTrail) return null;

  const formattedDate = auditTrail.submitted_at
    ? new Date(auditTrail.submitted_at)
        .toISOString()
        .replace("T", " ")
        .substring(0, 19) + " UTC"
    : "2026-07-16 17:30 UTC";

  return (
    <div className="absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-lg text-center rounded-lg border-2 border-green-500 transition-opacity duration-300">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-green-600 text-4xl fill">
          check_circle
        </span>
      </div>
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">
        Assortment Submitted Successfully
      </h3>
      <div className="bg-surface p-4 rounded text-left text-sm font-body-md w-full max-w-sm border border-outline-variant mb-6 shadow-sm bg-white">
        <p className="mb-1 text-on-surface-variant">
          <span className="font-semibold text-on-surface w-24 inline-block">
            Manager:
          </span>{" "}
          {auditTrail.user_id || "Category Manager"}
        </p>
        <p className="mb-1 text-on-surface-variant">
          <span className="font-semibold text-on-surface w-24 inline-block">
            Timestamp:
          </span>{" "}
          {formattedDate}
        </p>
        <p className="mb-1 text-on-surface-variant">
          <span className="font-semibold text-on-surface w-24 inline-block">
            Scenario:
          </span>{" "}
          {auditTrail.scenario_name}
        </p>
        <p className="mb-1 text-on-surface-variant">
          <span className="font-semibold text-on-surface w-24 inline-block">
            Changes:
          </span>{" "}
          {auditTrail.changes?.length || 0} SKUs updated
        </p>
        <p className="text-on-surface-variant">
          <span className="font-semibold text-on-surface w-24 inline-block">
            Proj. Lift:
          </span>{" "}
          <span className="text-green-600 font-bold">
            +{auditTrail.projected_sales_lift}%
          </span>
        </p>
      </div>
      <button
        className="text-primary-container font-label-md hover:underline"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
