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
    switch (status) {
      case "GROW":
        return "bg-green-100 text-green-800";
      case "MAINTAIN":
        return "bg-yellow-100 text-yellow-800";
      case "SWAP":
        return "bg-orange-100 text-orange-800";
      case "REDUCE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
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
    // If value is between 0 and 1, multiply by 100
    const displayVal = val <= 1 ? val * 100 : val;
    return `${displayVal.toFixed(0)}%`;
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm mb-sm">
        <h2 className="font-headline-md text-headline-md text-slate-800 font-bold">
          Snacks SKU Performance
        </h2>
        <div className="flex flex-wrap gap-sm w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search SKUs..."
              className="pl-10 pr-4 py-2 border border-[#CBD5E1] rounded-lg focus:border-[#FFD100] focus:ring-1 focus:ring-[#FFD100] outline-none text-sm w-full md:w-64 bg-white"
            />
          </div>
          <div className="flex gap-1 border border-slate-200 rounded-lg p-1 bg-white">
            {["ALL", "GROW", "MAINTAIN", "SWAP", "REDUCE"].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${statusFilter === status ? "bg-[#FFD100] text-[#1E293B]" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="data-card overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header font-label-md text-label-md text-slate-600 uppercase border-b border-slate-200">
                <th className="p-md font-semibold">SKU ID</th>
                <th className="p-md font-semibold">Product Name</th>
                <th className="p-md font-semibold">Brand</th>
                <th className="p-md font-semibold text-right">Sales</th>
                <th className="p-md font-semibold text-right">Units</th>
                <th className="p-md font-semibold text-right">Margin</th>
                <th className="p-md font-semibold text-right">In-Stock</th>
                <th className="p-md font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-slate-800 divide-y divide-slate-100">
              {filteredSkus.length > 0 ? (
                filteredSkus.map((sku) => (
                  <tr
                    key={sku.sku_id}
                    className="row-hover min-h-[48px] transition-colors"
                  >
                    <td className="p-md font-mono text-xs font-semibold text-slate-500">
                      {sku.sku_id}
                    </td>
                    <td className="p-md font-semibold text-slate-800">
                      {sku.name}
                    </td>
                    <td className="p-md text-slate-600">{sku.brand}</td>
                    <td className="p-md text-right font-medium">
                      {formatCurrency(sku.sales)}
                    </td>
                    <td className="p-md text-right">
                      {sku.units_sold.toLocaleString()}
                    </td>
                    <td className="p-md text-right">
                      {formatPercent(sku.profit_margin)}
                    </td>
                    <td className="p-md text-right">
                      {formatPercent(sku.in_stock_rate)}
                    </td>
                    <td className="p-md text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-xs ${getStatusBadgeClass(sku.status)}`}
                      >
                        {sku.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="p-lg text-center text-slate-500 font-medium"
                  >
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
