import React from "react";

export default function ApprovalReviewPanel({
  selectedScenario,
  scenarioData,
  onSubmit,
  submitting,
  error,
}) {
  const getActionColorClass = (action) => {
    switch (action?.toUpperCase()) {
      case "GROW":
      case "ADD":
        return "text-green-700";
      case "MAINTAIN":
      case "KEEP":
        return "text-yellow-700";
      case "SWAP":
        return "text-orange-600";
      case "REDUCE":
      case "REMOVE":
        return "text-red-600";
      default:
        return "text-slate-700";
    }
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  const isGuardrailPassed =
    scenarioData?.guardrails?.private_brand_ok &&
    scenarioData?.guardrails?.shelf_capacity_ok;

  return (
    <div className="data-card p-md flex flex-col gap-md bg-[#F8FAFC] shadow-sm border border-slate-200 rounded-lg">
      <h3 className="font-label-md text-label-md font-bold text-slate-800 uppercase border-b border-slate-200 pb-2 tracking-wider">
        Approval Review —{" "}
        {selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1)}{" "}
        Scenario
      </h3>

      {/* Proposed Actions */}
      <div>
        <span className="font-label-sm text-label-sm text-slate-500 uppercase mb-2 block font-bold tracking-wider">
          Proposed Actions
        </span>
        {scenarioData?.sku_actions && scenarioData.sku_actions.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
            {scenarioData.sku_actions.map((act, idx) => (
              <li key={idx}>
                <strong
                  className={`${getActionColorClass(act.action)} uppercase mr-1`}
                >
                  {act.action}
                </strong>
                <span className="font-mono text-xs text-slate-500 mr-1">
                  [{act.sku_id}]
                </span>
                {act.name || `SKU Action`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 italic">
            No actions proposed for this scenario.
          </p>
        )}
      </div>

      {/* Guardrail Checks */}
      <div>
        <span className="font-label-sm text-label-sm text-slate-500 uppercase mb-2 block font-bold tracking-wider">
          Guardrail Checks
        </span>
        <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-100">
          {/* Private Brand Mix */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">
              PB Mix ({formatPercent(scenarioData?.private_brand_mix)})
            </span>
            <div className="flex items-center gap-1">
              {scenarioData?.guardrails?.private_brand_ok ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    check_circle
                  </span>
                  Passed (&gt;=20%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    cancel
                  </span>
                  Failed (&lt;20%)
                </span>
              )}
            </div>
          </div>

          {/* Shelf Capacity */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">
              Capacity ({formatPercent(scenarioData?.shelf_capacity)})
            </span>
            <div className="flex items-center gap-1">
              {scenarioData?.guardrails?.shelf_capacity_ok ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    check_circle
                  </span>
                  Passed (&gt;=85%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    cancel
                  </span>
                  Failed (&lt;85%)
                </span>
              )}
            </div>
          </div>

          {/* Proj. In-Stock */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">
              Proj. In-Stock ({formatPercent(scenarioData?.in_stock_rate)})
            </span>
            <div className="flex items-center gap-1">
              {scenarioData?.in_stock_rate >= 95 ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    check_circle
                  </span>
                  Passed (&gt;=95%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px] font-bold">
                    cancel
                  </span>
                  Failed (&lt;95%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium flex items-start gap-2">
          <span className="material-symbols-outlined text-sm font-bold mt-0.5">
            error
          </span>
          <div>
            <p className="font-bold">Submission Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Submit CTA */}
      <button
        onClick={onSubmit}
        disabled={submitting || !isGuardrailPassed}
        className={`w-full font-bold py-3 rounded-lg shadow-sm transition-all mt-auto flex items-center justify-center gap-2 ${
          isGuardrailPassed
            ? "bg-[#FFD100] hover:bg-[#EDC200] text-[#1E293B] active:scale-[0.98]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        {submitting ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-slate-800 border-t-transparent rounded-full"></span>
            Submitting Assortment Changes...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg font-bold">
              send
            </span>
            Submit Assortment Changes
          </>
        )}
      </button>
      {!isGuardrailPassed && (
        <p className="text-[11px] text-red-500 text-center font-medium mt-1">
          ⚠️ Cannot submit: Guardrail checks must pass.
        </p>
      )}
    </div>
  );
}
