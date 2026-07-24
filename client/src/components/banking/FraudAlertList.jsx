import React, { useState } from "react";

export default function FraudAlertList({ alerts, onSuspendAccount }) {
  const [suspendingId, setSuspendingId] = useState(null);
  const [reason, setReason] = useState("");

  const handleSuspend = async (accountId) => {
    if (!reason) {
      alert("Please provide a reason for suspension.");
      return;
    }
    try {
      setSuspendingId(accountId);
      await onSuspendAccount(accountId, reason);
      setReason("");
    } finally {
      setSuspendingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">
          Potential Risk & Fraudulent Activities
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time monitoring of high-risk transactions and alerts
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No fraud alerts detected
          </div>
        ) : (
          alerts.map((alertItem) => {
            const isHighRisk = alertItem.risk_score >= 80;
            const riskColor = isHighRisk
              ? "text-rose-600 bg-rose-50 border-rose-200"
              : "text-amber-600 bg-amber-50 border-amber-200";

            return (
              <div
                key={alertItem.id}
                className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskColor}`}
                    >
                      Risk Score: {alertItem.risk_score}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {alertItem.rule_triggered}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>
                      Alert ID:{" "}
                      <span className="font-mono">{alertItem.id}</span>
                    </p>
                    <p>
                      Transaction ID:{" "}
                      <span className="font-mono">
                        {alertItem.transaction_id}
                      </span>
                    </p>
                    <p>
                      Amount:{" "}
                      <span className="font-semibold text-slate-900">
                        ${alertItem.transaction?.amount?.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      Source Account ID:{" "}
                      <span className="font-mono">
                        {alertItem.transaction?.source_account_id}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Reason for suspension"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-48"
                  />
                  <button
                    onClick={() =>
                      handleSuspend(alertItem.transaction?.source_account_id)
                    }
                    disabled={
                      suspendingId === alertItem.transaction?.source_account_id
                    }
                    className="bg-rose-600 text-white py-2 px-4 rounded text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {suspendingId === alertItem.transaction?.source_account_id
                      ? "Suspending..."
                      : "Suspend Account"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
