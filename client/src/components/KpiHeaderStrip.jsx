import React from "react";

export default function KpiHeaderStrip({ kpis }) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return "0.0%";
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Sales per Linear Ft */}
      <div className="card-base p-6 border-t-4 border-t-[#ffd100] flex flex-col relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[120px]">
            attach_money
          </span>
        </div>
        <h3 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-2">
          Sales per Linear Ft
        </h3>
        <div className="flex items-baseline gap-3 mt-auto">
          <span className="text-3xl font-bold text-[#ebe2cf]">
            {formatCurrency(kpis?.sales_per_linear_ft)}
          </span>
          {kpis?.sales_lift_pct !== undefined && (
            <span className="text-sm font-semibold text-[#10B981] flex items-center">
              <span className="material-symbols-outlined text-[16px]">
                arrow_upward
              </span>
              {kpis.sales_lift_pct >= 0 ? "+" : ""}
              {kpis.sales_lift_pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Private Brand % */}
      <div className="card-base p-6 border-t-4 border-t-[#ffd100] flex flex-col relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[120px]">
            storefront
          </span>
        </div>
        <h3 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-2">
          Private Brand %
        </h3>
        <div className="flex items-baseline gap-3 mt-auto flex-wrap">
          <span className="text-3xl font-bold text-[#ebe2cf]">
            {formatPercent(kpis?.private_brand_pct)}
          </span>
          <span className="text-xs font-semibold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded border border-[#10B981]/20">
            Target: &gt;20.0%
          </span>
        </div>
      </div>

      {/* In-Stock Rate */}
      <div className="card-base p-6 border-t-4 border-t-[#ffd100] flex flex-col relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[120px]">
            inventory
          </span>
        </div>
        <h3 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-2">
          In-Stock Rate
        </h3>
        <div className="flex items-baseline gap-3 mt-auto flex-wrap">
          <span className="text-3xl font-bold text-[#ebe2cf]">
            {formatPercent(kpis?.in_stock_rate)}
          </span>
          <span className="text-xs font-semibold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded border border-[#10B981]/20">
            Target: 95.0%
          </span>
        </div>
      </div>

      {/* Shelf Capacity */}
      <div className="card-base p-6 border-t-4 border-t-[#ffd100] flex flex-col relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[120px]">
            shelves
          </span>
        </div>
        <h3 className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider mb-2">
          Shelf Capacity
        </h3>
        <div className="flex items-baseline gap-3 mt-auto flex-wrap">
          <span className="text-3xl font-bold text-[#ebe2cf]">
            {formatPercent(kpis?.shelf_capacity_utilization)}
          </span>
          <span className="text-xs font-semibold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded border border-[#10B981]/20">
            Optimal: 85-95%
          </span>
        </div>
      </div>
    </div>
  );
}
