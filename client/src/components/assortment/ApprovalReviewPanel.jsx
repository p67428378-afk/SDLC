import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

export default function ApprovalReviewPanel({
  scenarioData,
  loading,
  error,
  onSubmit,
  submitting,
  submitError,
}) {
  if (loading) {
    return (
      <div className="bg-surface-container-low border border-surface-variant rounded-lg p-md sticky top-[88px] animate-pulse h-[400px]" />
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-md rounded-lg border border-error sticky top-[88px]">
        <p className="font-semibold">
          Failed to load scenario details: {error}
        </p>
      </div>
    );
  }

  const {
    name = "Balanced",
    sku_actions = [],
    guardrails = [],
  } = scenarioData || {};

  // Count actions by type
  const actionCounts = sku_actions.reduce((acc, curr) => {
    const act = (curr.action || "").toUpperCase();
    acc[act] = (acc[act] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-surface-container-low border border-surface-variant rounded-lg p-md sticky top-[88px]">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-lg border-b border-surface-variant pb-2">
        Assortment Summary
      </h2>

      <div className="mb-md">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs block mb-1">
          Selected Scenario
        </span>
        <span className="font-body-lg text-body-lg text-primary-container font-semibold">
          {name}
        </span>
      </div>

      {/* Action Summary */}
      <div className="mb-md">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs block mb-2">
          Action Summary
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-surface-container p-2 rounded">
            <span className="font-body-md text-body-md text-on-surface">
              Grow / Add
            </span>
            <span className="font-mono-data text-mono-data text-[#38BDF8]">
              {actionCounts["GROW"] || actionCounts["ADD"] || 0}
            </span>
          </div>
          <div className="flex justify-between items-center bg-surface-container p-2 rounded">
            <span className="font-body-md text-body-md text-on-surface">
              Swap
            </span>
            <span className="font-mono-data text-mono-data text-primary-container">
              {actionCounts["SWAP"] || 0}
            </span>
          </div>
          <div className="flex justify-between items-center bg-surface-container p-2 rounded">
            <span className="font-body-md text-body-md text-on-surface">
              Reduce / Remove
            </span>
            <span className="font-mono-data text-mono-data text-[#F43F5E]">
              {actionCounts["REDUCE"] || actionCounts["REMOVE"] || 0}
            </span>
          </div>
          <div className="flex justify-between items-center bg-surface-container p-2 rounded">
            <span className="font-body-md text-body-md text-on-surface">
              Maintain / Keep
            </span>
            <span className="font-mono-data text-mono-data text-secondary">
              {actionCounts["MAINTAIN"] || actionCounts["KEEP"] || 0}
            </span>
          </div>
        </div>
      </div>

      {/* SKU Action List */}
      <div className="mb-md">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs block mb-2">
          SKU Action List
        </span>
        <div className="max-h-[150px] overflow-y-auto flex flex-col gap-1.5 pr-1">
          {sku_actions.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-surface-container/50 p-2 rounded text-xs"
            >
              <span className="font-mono-data text-on-surface">
                {item.sku_code}
              </span>
              <span
                className={`font-bold uppercase ${
                  item.action === "GROW" || item.action === "ADD"
                    ? "text-[#38BDF8]"
                    : item.action === "SWAP"
                      ? "text-primary-container"
                      : item.action === "REDUCE" || item.action === "REMOVE"
                        ? "text-[#F43F5E]"
                        : "text-secondary"
                }`}
              >
                {item.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails */}
      <div className="mb-lg">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs block mb-2">
          Guardrails
        </span>
        <ul className="flex flex-col gap-3">
          {guardrails.map((guard, idx) => {
            const isPass = guard.status === "PASS";
            const isWarning = guard.status === "WARNING";
            return (
              <li
                key={idx}
                className={`flex items-start gap-2 p-2 rounded border ${
                  isPass
                    ? "bg-surface-container/30 border-transparent"
                    : isWarning
                      ? "bg-primary-container/10 border-primary-container/20"
                      : "bg-error-container/10 border-error-container/20"
                }`}
              >
                {isPass ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="h-4.5 w-4.5 text-primary-container mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-[#F43F5E] mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span
                    className={`font-body-md text-body-md block ${isWarning ? "text-primary-container" : "text-on-surface"}`}
                  >
                    {guard.name}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant text-[10px]">
                    {guard.message}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {submitError && (
        <div className="bg-error-container text-on-error-container p-2 rounded text-xs mb-3 border border-error">
          {submitError}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-primary-container text-on-primary-container font-headline-sm text-headline-sm py-3 rounded-md hover:bg-primary-fixed-dim transition-colors font-bold shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        Submit Assortment
      </button>
    </div>
  );
}
