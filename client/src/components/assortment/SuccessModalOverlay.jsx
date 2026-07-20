import React from "react";
import PropTypes from "prop-types";

export default function SuccessModalOverlay({ isOpen, onClose, submitResult }) {
  if (!isOpen) return null;

  const data = submitResult || {
    id: "AUD-98234-549",
    scenario_name: "Balanced",
    sku_actions: { add_count: 4, remove_count: 1, actions: [] },
    created_at: "2026-01-01T10:45:00Z",
  };

  const addCount = data.sku_actions?.add_count ?? 4;
  const removeCount = data.sku_actions?.remove_count ?? 1;
  const swapCount =
    data.sku_actions?.actions?.filter((a) => a.action?.toUpperCase() === "SWAP")
      .length || 2;

  const formattedDate = data.created_at
    ? new Date(data.created_at)
        .toISOString()
        .replace("T", " ")
        .substring(0, 19) + " UTC"
    : "2026-01-01 10:45:00 UTC";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6 text-center border-b border-outline-variant">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-4xl">
              check
            </span>
          </div>
          <h2 className="font-headline-md text-xl font-bold text-slate-900 mb-1">
            Assortment Plan Submitted Successfully
          </h2>
          <p className="font-mono text-sm text-secondary">
            Audit ID: {data.id}
          </p>
        </div>
        <div className="p-6 bg-slate-50">
          <h4 className="font-label-md text-secondary mb-3 uppercase text-[11px] tracking-wider">
            Plan Summary
          </h4>
          <div className="bg-white border border-outline-variant rounded p-3 text-sm space-y-2">
            <div className="flex justify-between border-b border-outline-variant/30 pb-2">
              <span className="text-secondary">Scenario</span>
              <span className="font-semibold text-slate-800">
                {data.scenario_name}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-secondary">SKUs Added</span>
              <span className="font-mono font-semibold text-slate-700">
                {addCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">SKUs Swapped</span>
              <span className="font-mono font-semibold text-slate-700">
                {swapCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">SKUs Removed</span>
              <span className="font-mono font-semibold text-slate-700">
                {removeCount}
              </span>
            </div>
          </div>
          <p className="text-center text-xs text-secondary mt-4">
            Timestamp: {formattedDate}
          </p>
        </div>
        <div className="p-4 bg-white border-t border-outline-variant flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-2 bg-slate-900 text-white font-headline-md text-[14px] rounded hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

SuccessModalOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  submitResult: PropTypes.shape({
    id: PropTypes.string,
    scenario_name: PropTypes.string,
    sku_actions: PropTypes.shape({
      add_count: PropTypes.number,
      remove_count: PropTypes.number,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          action: PropTypes.string,
          sku_id: PropTypes.string,
          sku_name: PropTypes.string,
        }),
      ),
    }),
    created_at: PropTypes.string,
  }),
};
