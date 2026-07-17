import React from "react";

export default function ApprovalReviewPanel({
  activeScenario,
  actions,
  onSubmit,
  isSubmitting,
}) {
  // Guardrail checks: Private Brand % > 20%, Shelf Capacity < 95%
  // For Conservative: projected brand mix is 21.0%
  // For Balanced: projected brand mix is 24.5%
  // For Aggressive: projected brand mix is 28.2%
  // Shelf capacity is 88.2% for all scenarios in this simulation
  const getProjectedBrandMix = () => {
    if (activeScenario === "Conservative") return 21.0;
    if (activeScenario === "Aggressive") return 28.2;
    return 24.5;
  };

  const brandMix = getProjectedBrandMix();
  const capacity = 88.2;

  const isBrandMixPassed = brandMix > 20.0;
  const isCapacityPassed = capacity < 95.0;
  const isGuardrailsPassed = isBrandMixPassed && isCapacityPassed;

  const getActionIcon = (action) => {
    switch (action) {
      case "ADD":
        return (
          <span className="material-symbols-outlined text-green-600 text-[20px]">
            add_circle
          </span>
        );
      case "SWAP":
        return (
          <span className="material-symbols-outlined text-orange-500 text-[20px]">
            swap_horiz
          </span>
        );
      case "REMOVE":
        return (
          <span className="material-symbols-outlined text-red-500 text-[20px]">
            do_not_disturb_on
          </span>
        );
      default:
        return (
          <span className="material-symbols-outlined text-blue-500 text-[20px]">
            info
          </span>
        );
    }
  };

  const getActionColorClass = (action) => {
    switch (action) {
      case "ADD":
        return "text-green-700";
      case "SWAP":
        return "text-orange-600";
      case "REMOVE":
        return "text-red-600";
      default:
        return "text-blue-700";
    }
  };

  return (
    <div className="elevation-1 rounded-lg p-lg bg-surface-container-lowest flex-1 flex flex-col min-h-0 relative">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Scenario Review: {activeScenario}
        </h3>
        <span className="text-xs bg-surface-container px-2 py-1 rounded text-on-surface-variant">
          {actions.length} Actions
        </span>
      </div>
      <div className="flex-1 overflow-auto pr-2 mb-4 space-y-3">
        {actions.map((act, idx) => (
          <div
            key={idx}
            className="p-3 border border-outline-variant rounded-lg bg-surface flex items-start gap-3 bg-white"
          >
            <div className="mt-0.5">{getActionIcon(act.action)}</div>
            <div className="flex-1">
              <p
                className={`font-label-md text-label-md uppercase mb-0.5 text-[11px] ${getActionColorClass(act.action)}`}
              >
                {act.action}
              </p>
              <p className="font-body-md text-body-md text-on-surface font-semibold text-sm leading-tight">
                {act.sku_name}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {act.details}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 bg-surface-container p-4 rounded-lg mb-4">
        <h4 className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">
          Guardrail Checks
        </h4>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body-md text-sm text-on-surface">
            Private Brand % &gt; 20%
          </span>
          <div
            className={`flex items-center gap-1 ${isBrandMixPassed ? "text-green-700" : "text-red-600"}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isBrandMixPassed ? "check" : "close"}
            </span>
            <span className="text-xs font-semibold">
              {isBrandMixPassed
                ? `Passed (${brandMix}%)`
                : `Failed (${brandMix}%)`}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body-md text-sm text-on-surface">
            Capacity &lt; 95%
          </span>
          <div
            className={`flex items-center gap-1 ${isCapacityPassed ? "text-green-700" : "text-red-600"}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isCapacityPassed ? "check" : "close"}
            </span>
            <span className="text-xs font-semibold">
              {isCapacityPassed
                ? `Passed (${capacity}%)`
                : `Failed (${capacity}%)`}
            </span>
          </div>
        </div>
      </div>
      <button
        disabled={!isGuardrailsPassed || isSubmitting}
        onClick={onSubmit}
        className={`w-full font-bold py-3 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0 ${
          isGuardrailsPassed && !isSubmitting
            ? "bg-secondary-fixed-dim text-on-secondary-fixed hover:bg-yellow-400"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <span className="material-symbols-outlined">send</span>
        {isSubmitting ? "Submitting..." : "Submit Assortment Changes"}
      </button>
    </div>
  );
}
