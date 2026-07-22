import React, { useState } from "react";

export default function SkuPerformanceTable({ skus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
  };

  const filteredSkus = skus.filter((sku) => {
    const matchesSearch =
      sku.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || sku.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "GROW":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[#10B981]/30";
      case "MAINTAIN":
        return "bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border border-[#3B82F6]/30";
      case "SWAP":
        return "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[#F59E0B]/30";
      case "REDUCE":
        return "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[#EF4444]/30";
      default:
        return "bg-[#1F2937]/50 text-[#ebe2cf] border border-[#1F2937]";
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatPercent = (val) => {
    const displayVal = val <= 1 ? val * 100 : val;
    return `${displayVal.toFixed(0)}%`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#ebe2cf]">
            Snacks SKU Performance
          </h2>
          <p className="text-xs text-[#d1c6ab] mt-1">
            Analyzing {skus.length} SKUs in Small Town Value Cluster
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[#d1c6ab]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search SKUs..."
              className="pl-10 pr-4 py-2 border border-[#1F2937] rounded-lg focus:border-[#ffd100] focus:ring-1 focus:ring-[#ffd100] outline-none text-sm w-full md:w-64 bg-[#111827] text-[#ebe2cf]"
            />
          </div>
          <div className="flex gap-1 border border-[#1F2937] rounded-lg p-1 bg-[#111827]">
            {["ALL", "GROW", "MAINTAIN", "SWAP", "REDUCE"].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${statusFilter === status ? "bg-[#ffd100] text-[#111827]" : "text-[#d1c6ab] hover:bg-[#1F2937]"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#1F2937]/50 text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider">
                <th className="p-3 pl-6">SKU ID</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Brand</th>
                <th className="p-3 text-right">Sales</th>
                <th className="p-3 text-right">Units</th>
                <th className="p-3 text-right">Margin</th>
                <th className="p-3 text-right">In-Stock</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#ebe2cf] divide-y divide-[#1F2937]">
              {filteredSkus.length > 0 ? (
                filteredSkus.map((sku) => (
                  <tr
                    key={sku.sku_id}
                    className="hover:bg-[#1F2937]/30 transition-colors h-12"
                  >
                    <td className="p-3 pl-6 font-mono text-xs text-[#d1c6ab]">
                      {sku.sku_id}
                    </td>
                    <td className="p-3 font-medium">{sku.name}</td>
                    <td className="p-3 text-[#d1c6ab]">{sku.brand}</td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(sku.sales)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {sku.units_sold.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatPercent(sku.profit_margin)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatPercent(sku.in_stock_rate)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide min-w-[80px] ${getStatusBadgeClass(sku.status)}`}
                      >
                        {sku.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-[#d1c6ab]">
                    No SKUs found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
