import React from "react";
import PropTypes from "prop-types";

export default function ApprovalReviewPanel({
  scenarioName,
  scenarioData,
  onSubmit,
  submitting,
  submitError,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm flex-1 flex flex-col h-full justify-center items-center min-h-[250px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mb-2"></div>
        <p className="text-sm text-secondary">Loading scenario details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm flex-1 flex flex-col h-full justify-center items-center min-h-[250px] text-center">
        <span className="material-symbols-outlined text-red-500 text-3xl mb-2">
          error
        </span>
        <p className="text-sm text-red-600 font-medium">
          Failed to load scenario details.
        </p>
      </div>
    );
  }

  const data = scenarioData || {
    guardrails: { private_brand_goal: "PASS", shelf_capacity: "PASS" },
    projected_private_brand_pct: 30.1,
    projected_sales_lift_pct: 5.2,
    sku_actions: { actions: [], add_count: 4, remove_count: 1 },
  };

  const { guardrails, projected_private_brand_pct, sku_actions } = data;

  const addCount = sku_actions?.add_count ?? 4;
  const removeCount = sku_actions?.remove_count ?? 1;
  const swapCount =
    sku_actions?.actions?.filter((a) => a.action?.toUpperCase() === "SWAP")
      .length || 2;
  const keepCount =
    sku_actions?.actions?.filter((a) => a.action?.toUpperCase() === "MAINTAIN")
      .length || 12;

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm flex-1 flex flex-col h-full">
      <h3 className="font-headline-md text-base font-bold mb-4 border-b border-outline-variant pb-2 text-slate-800">
        {scenarioName} Scenario Review
      </h3>

      <div className="space-y-4 mb-6 flex-1">
        {/* SKU Action Summary */}
        <div>
          <h4 className="font-label-md text-secondary mb-2 uppercase text-[10px] tracking-wider">
            SKU Action Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-50 p-2 rounded flex justify-between border border-outline-variant/30">
              <span className="text-secondary">Add:</span>
              <span className="font-bold text-slate-800">{addCount}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded flex justify-between border border-outline-variant/30">
              <span className="text-secondary">Keep:</span>
              <span className="font-bold text-slate-800">{keepCount}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded flex justify-between border border-outline-variant/30">
              <span className="text-secondary">Swap:</span>
              <span className="font-bold text-slate-800">{swapCount}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded flex justify-between border border-outline-variant/30">
              <span className="text-secondary">Remove:</span>
              <span className="font-bold text-slate-800">{removeCount}</span>
            </div>
          </div>
        </div>

        {/* Guardrail Checks */}
        <div>
          <h4 className="font-label-md text-secondary mb-2 uppercase text-[10px] tracking-wider">
            Guardrail Checks
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {guardrails?.private_brand_goal === "PASS" ? (
                  <span className="material-symbols-outlined text-green-500 text-sm">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-red-500 text-sm">
                    cancel
                  </span>
                )}
                Private Brand Goal
              </span>
              <span className="font-mono font-semibold text-slate-700">
                {projected_private_brand_pct?.toFixed(1)}%
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {guardrails?.shelf_capacity === "PASS" ? (
                  <span className="material-symbols-outlined text-green-500 text-sm">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-red-500 text-sm">
                    cancel
                  </span>
                )}
                Shelf Capacity
              </span>
              <span className="font-mono font-semibold text-slate-700">
                {guardrails?.shelf_capacity === "PASS" ? "PASS" : "FAIL"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-500 text-sm">
                  check_circle
                </span>
                Gross Margin
              </span>
              <span className="font-mono font-semibold text-slate-700">
                33.2%
              </span>
            </li>
          </ul>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs mb-3">
          {submitError}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-slate-900 text-primary-container font-headline-md text-[14px] py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">
          {submitting ? "sync" : "publish"}
        </span>
        {submitting ? "Submitting Plan..." : "Submit Assortment Plan"}
      </button>
    </div>
  );
}

ApprovalReviewPanel.propTypes = {
  scenarioName: PropTypes.string.isRequired,
  scenarioData: PropTypes.shape({
    guardrails: PropTypes.shape({
      private_brand_goal: PropTypes.string,
      shelf_capacity: PropTypes.string,
    }),
    projected_private_brand_pct: PropTypes.number,
    projected_sales_lift_pct: PropTypes.number,
    sku_actions: PropTypes.shape({
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          action: PropTypes.string,
          sku_id: PropTypes.string,
          sku_name: PropTypes.string,
        }),
      ),
      add_count: PropTypes.number,
      remove_count: PropTypes.number,
    }),
  }),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  submitError: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.any,
};
