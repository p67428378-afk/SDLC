import React, { useState } from "react";

export default function SKUPerformanceTable({ skus, onSearch, onSort }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "sku_name",
    order: "asc",
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  const handleSort = (key) => {
    let order = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
    onSort(key, order);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "GROW":
        return "bg-green-50 text-green-700 border-green-200";
      case "MAINTAIN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SWAP":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "REDUCE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const safeSkus = Array.isArray(skus) ? skus : [];

  return (
    <div className="lg:w-3/5 elevation-1 rounded-lg flex flex-col overflow-hidden bg-surface-container-lowest">
      <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest z-10 shrink-0">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Snacks SKU Performance
        </h3>
        <div className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              className="pl-8 pr-3 py-1.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:border-secondary-fixed-dim focus:ring-1 focus:ring-secondary-fixed-dim outline-none transition-all w-48 placeholder-on-surface-variant/50"
              placeholder="Search SKUs..."
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button className="p-1.5 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="p-1.5 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead class="sticky top-0 bg-surface-container-low z-10 shadow-sm border-b border-outline-variant">
            <tr>
              <th
                className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-1/3 cursor-pointer hover:bg-surface-container-high"
                onClick={() => handleSort("sku_name")}
              >
                <div className="flex items-center gap-1">
                  SKU Name
                  {sortConfig.key === "sku_name" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.order === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right cursor-pointer hover:bg-surface-container-high"
                onClick={() => handleSort("weekly_sales")}
              >
                <div className="flex items-center justify-end gap-1">
                  Weekly Sales
                  {sortConfig.key === "weekly_sales" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.order === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right cursor-pointer hover:bg-surface-container-high"
                onClick={() => handleSort("yoy_growth")}
              >
                <div className="flex items-center justify-end gap-1">
                  YoY Growth
                  {sortConfig.key === "yoy_growth" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.order === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right cursor-pointer hover:bg-surface-container-high"
                onClick={() => handleSort("profit_margin")}
              >
                <div className="flex items-center justify-end gap-1">
                  Margin
                  {sortConfig.key === "profit_margin" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.order === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right cursor-pointer hover:bg-surface-container-high"
                onClick={() => handleSort("inventory_level")}
              >
                <div className="flex items-center justify-end gap-1">
                  Inventory
                  {sortConfig.key === "inventory_level" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.order === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th className="p-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="font-data-tabular text-data-tabular text-on-surface">
            {safeSkus.map((sku) => (
              <tr
                key={sku.id}
                className="border-b border-outline-variant hover:bg-[#F1F5F9] transition-colors group"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">
                        shopping_bag
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {sku.sku_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {sku.is_private_brand
                          ? "Private Brand"
                          : "National Brand"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-medium">
                  ${sku.weekly_sales?.toLocaleString() || "0"}
                </td>
                <td
                  className={`p-3 text-right ${sku.yoy_growth >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  {sku.yoy_growth >= 0
                    ? `+${sku.yoy_growth}%`
                    : `${sku.yoy_growth}%`}
                </td>
                <td className="p-3 text-right">{sku.profit_margin}%</td>
                <td
                  className={`p-3 text-right ${sku.inventory_level < 50 ? "text-red-600 font-medium" : ""}`}
                >
                  {sku.inventory_level}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-label-md text-[11px] border ${getStatusBadgeClass(sku.status)}`}
                  >
                    {sku.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
