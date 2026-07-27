import React from "react";

export default function AccountCard({ account, onSelect, isSelected }) {
  const isSavings = account.account_type.toLowerCase().includes("savings");
  const cardBg = isSavings
    ? "bg-gradient-to-br from-slate-600 to-slate-900"
    : "bg-gradient-to-br from-indigo-600 to-slate-900";

  const maskedAccountNumber = account.account_number
    ? `•••• ${account.account_number.slice(-4)}`
    : "";

  return (
    <div
      onClick={() => onSelect && onSelect(account)}
      className={`${cardBg} rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
        isSelected
          ? "ring-4 ring-indigo-400 ring-offset-2 ring-offset-background"
          : ""
      }`}
    >
      <div className='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=")] opacity-30'></div>
      <div className="relative z-10 flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-1">
            {account.account_type}
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono tracking-widest">
              {maskedAccountNumber}
            </span>
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                account.status.toLowerCase() === "active"
                  ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-100 border-rose-500/30"
              }`}
            >
              {account.status}
            </span>
          </div>
        </div>
        <span className="text-white/50 text-3xl group-hover:text-white transition-colors font-bold">
          {isSavings ? "💰" : "💳"}
        </span>
      </div>
      <div className="relative z-10 bg-white/10 -mx-6 -mb-6 p-6 mt-auto rounded-b-xl border-t border-white/10 backdrop-blur-md">
        <p className="text-xs text-white/70 mb-1">Available Balance</p>
        <p className="text-2xl font-bold tracking-tight">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: account.currency || "USD",
          }).format(account.balance)}
        </p>
      </div>
    </div>
  );
}
