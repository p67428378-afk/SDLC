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
        return "text-[#10B981]";
      case "MAINTAIN":
      case "KEEP":
        return "text-[#3B82F6]";
      case "SWAP":
        return "text-[#F59E0B]";
      case "REDUCE":
      case "REMOVE":
        return "text-[#EF4444]";
      default:
        return "text-[#ebe2cf]";
    }
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  const isGuardrailPassed =
    scenarioData?.guardrails?.private_brand_ok &&
    scenarioData?.guardrails?.shelf_capacity_ok;

  // Count actions
  const actionCounts = {
    ADD: 0,
    GROW: 0,
    MAINTAIN: 0,
    SWAP: 0,
    REDUCE: 0,
  };

  if (scenarioData?.sku_actions) {
    scenarioData.sku_actions.forEach((act) => {
      const action = act.action?.toUpperCase();
      if (actionCounts[action] !== undefined) {
        actionCounts[action]++;
      } else {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      }
    });
  }

  return (
    <div className="card-base p-6 shadow-xl shadow-black/40 flex-1 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#ebe2cf] flex items-center gap-2">
        <span className="material-symbols-outlined text-[#ffd100]">rule</span>
        Approval Review
      </h2>

      {/* SKU Action Summary */}
      <div className="bg-[#1F2937]/50 rounded-lg p-4 border border-[#1F2937]/50">
        <h4 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-3">
          SKU Action Summary
        </h4>
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 bg-[#111827] border border-[#1F2937] rounded p-3 text-center">
            <div className="text-2xl font-bold text-[#10B981] mb-1">
              {actionCounts.GROW + actionCounts.ADD}
            </div>
            <div className="text-[10px] font-semibold text-[#d1c6ab]">GROW</div>
          </div>
          <div className="flex-1 bg-[#111827] border border-[#1F2937] rounded p-3 text-center">
            <div className="text-2xl font-bold text-[#F59E0B] mb-1">
              {actionCounts.SWAP}
            </div>
            <div className="text-[10px] font-semibold text-[#d1c6ab]">SWAP</div>
          </div>
          <div className="flex-1 bg-[#111827] border border-[#1F2937] rounded p-3 text-center">
            <div className="text-2xl font-bold text-[#EF4444] mb-1">
              {actionCounts.REDUCE}
            </div>
            <div className="text-[10px] font-semibold text-[#d1c6ab]">
              REDUCE
            </div>
          </div>
        </div>
      </div>

      {/* Guardrail Status */}
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-3">
          Guardrail Status
        </h4>
        <div className="flex flex-col gap-3">
          {/* Private Brand Mix */}
          <div
            className={`flex items-center justify-between p-3 rounded border ${
              scenarioData?.guardrails?.private_brand_ok
                ? "bg-[rgba(16,185,129,0.1)] border-[#10B981]/20 text-[#10B981]"
                : "bg-[rgba(239,68,68,0.1)] border-[#EF4444]/20 text-[#EF4444]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">
                {scenarioData?.guardrails?.private_brand_ok
                  ? "check_circle"
                  : "cancel"}
              </span>
              <span className="text-sm font-medium text-[#ebe2cf]">
                Private Brand Mix &gt; 20%
              </span>
            </div>
            <span className="font-mono text-xs font-bold">
              {scenarioData?.guardrails?.private_brand_ok ? "Pass" : "Fail"} (
              {formatPercent(scenarioData?.private_brand_mix)})
            </span>
          </div>

          {/* Shelf Capacity */}
          <div
            className={`flex items-center justify-between p-3 rounded border ${
              scenarioData?.guardrails?.shelf_capacity_ok
                ? "bg-[rgba(16,185,129,0.1)] border-[#10B981]/20 text-[#10B981]"
                : "bg-[rgba(239,68,68,0.1)] border-[#EF4444]/20 text-[#EF4444]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">
                {scenarioData?.guardrails?.shelf_capacity_ok
                  ? "check_circle"
                  : "cancel"}
              </span>
              <span className="text-sm font-medium text-[#ebe2cf]">
                Shelf Capacity &lt; 95%
              </span>
            </div>
            <span className="font-mono text-xs font-bold">
              {scenarioData?.guardrails?.shelf_capacity_ok ? "Pass" : "Fail"} (
              {formatPercent(scenarioData?.shelf_capacity)})
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[#EF4444]/30 text-[#EF4444] p-3 rounded-lg text-xs font-medium flex items-start gap-2">
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
        className={`w-full py-4 px-6 font-bold rounded-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wide ${
          isGuardrailPassed
            ? "bg-[#ffd100] hover:bg-[#ffe07f] text-black shadow-[0_4px_14px_0_rgba(255,209,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,209,0,0.23)] active:scale-[0.98]"
            : "bg-[#1F2937] text-[#d1c6ab] cursor-not-allowed"
        }`}
      >
        {submitting ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
            Submitting Assortment Plan...
          </>
        ) : (
          <>
            Submit Assortment Plan
            <span className="material-symbols-outlined font-bold">send</span>
          </>
        )}
      </button>
      <p className="text-center text-xs text-[#d1c6ab] mt-1">
        This action will update 4 stores in the Small Town Value cluster.
      </p>
    </div>
  );
}
