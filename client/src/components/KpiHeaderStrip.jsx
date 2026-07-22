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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
      {/* Sales per Linear Ft */}
      <div className="data-card p-lg flex flex-col gap-sm shadow-sm bg-white">
        <span className="font-label-md text-label-md text-slate-500 uppercase tracking-wider">
          Sales per Linear Ft
        </span>
        <div className="flex items-baseline gap-sm">
          <span className="font-headline-lg text-headline-lg text-slate-800 font-bold">
            {formatCurrency(kpis?.sales_per_linear_ft)}
          </span>
          {kpis?.sales_lift_pct !== undefined && (
            <span
              className={`font-label-md text-label-md font-semibold ${kpis.sales_lift_pct >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {kpis.sales_lift_pct >= 0 ? "+" : ""}
              {kpis.sales_lift_pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Private Brand % */}
      <div className="data-card p-lg flex flex-col gap-sm shadow-sm bg-white">
        <span className="font-label-md text-label-md text-slate-500 uppercase tracking-wider">
          Private Brand %
        </span>
        <div className="flex items-baseline gap-sm justify-between">
          <span className="font-headline-lg text-headline-lg text-slate-800 font-bold">
            {formatPercent(kpis?.private_brand_pct)}
          </span>
          <div className="flex items-center gap-xs">
            {kpis?.private_brand_pct >= 20 ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  check_circle
                </span>
                Target &gt;=20%
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  warning
                </span>
                Below Target
              </span>
            )}
          </div>
        </div>
      </div>

      {/* In-Stock Rate */}
      <div className="data-card p-lg flex flex-col gap-sm shadow-sm bg-white">
        <span className="font-label-md text-label-md text-slate-500 uppercase tracking-wider">
          In-Stock Rate
        </span>
        <div className="flex items-baseline gap-sm justify-between">
          <span className="font-headline-lg text-headline-lg text-slate-800 font-bold">
            {formatPercent(kpis?.in_stock_rate)}
          </span>
          <div className="flex items-center gap-xs">
            {kpis?.in_stock_rate >= 95 ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  check_circle
                </span>
                Target &gt;=95%
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  warning
                </span>
                Below Target
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Shelf Capacity */}
      <div className="data-card p-lg flex flex-col gap-sm shadow-sm bg-white">
        <span className="font-label-md text-label-md text-slate-500 uppercase tracking-wider">
          Shelf Capacity
        </span>
        <div className="flex items-baseline gap-sm justify-between">
          <span className="font-headline-lg text-headline-lg text-slate-800 font-bold">
            {formatPercent(kpis?.shelf_capacity_utilization)}
          </span>
          <div className="flex items-center gap-xs">
            {kpis?.shelf_capacity_utilization >= 85 ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  check_circle
                </span>
                {kpis.shelf_capacity_utilization.toFixed(0)}% Utilized
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                <span className="material-symbols-outlined text-sm font-bold">
                  warning
                </span>
                Underutilized
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
