import React, { useState } from "react";

export default function TransactionTable({
  transactions,
  onSearchChange,
  onTypeChange,
  onDateRangeChange,
  onExport,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleType = (e) => {
    const val = e.target.value;
    setTypeFilter(val);
    if (onTypeChange) onTypeChange(val);
  };

  const handleStartDate = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (onDateRangeChange) onDateRangeChange(val, endDate);
  };

  const handleEndDate = (e) => {
    const val = e.target.value;
    setEndDate(val);
    if (onDateRangeChange) onDateRangeChange(startDate, val);
  };

  const exportToCSV = () => {
    if (onExport) {
      onExport({
        search: searchTerm || null,
        type: typeFilter || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      return;
    }
    // Fallback local export
    const headers = ["Date,Description,Type,Amount,Status\n"];
    const rows = transactions.map(
      (t) =>
        `"${t.transaction_date.split("T")[0]}","${t.description || ""}","${t.type}","${t.amount}","${t.status}"`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + headers.concat(rows.join("\n")).join("");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-200 flex flex-col gap-4 bg-slate-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Transaction History
          </h2>
          <button
            onClick={exportToCSV}
            className="bg-indigo-600 text-white py-1.5 px-4 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>📥</span> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Search description..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={handleType}
              className="w-full py-1.5 pl-3 pr-8 bg-white border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDate}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDate}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600 tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const isDeposit =
                  t.type.toLowerCase() === "deposit" || t.amount > 0;
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono">
                      {t.transaction_date.split("T")[0]}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {t.description || "No description"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 capitalize">
                      {t.type}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold ${
                        isDeposit ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Math.abs(t.amount))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wide ${
                          t.status.toLowerCase() === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
