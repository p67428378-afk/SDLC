import React from "react";

export default function KPIHeaderStrip({ kpis }) {
  const salesPerLinearFt =
    kpis?.sales_per_linear_ft !== undefined
      ? `$${kpis.sales_per_linear_ft.toFixed(2)}`
      : "$342.50";
  const salesGrowth =
    kpis?.sales_growth_percentage !== undefined
      ? `+${kpis.sales_growth_percentage.toFixed(1)}%`
      : "+4.2%";
  const privateBrand =
    kpis?.private_brand_percentage !== undefined
      ? `${kpis.private_brand_percentage.toFixed(1)}%`
      : "24.5%";
  const inStockRate =
    kpis?.in_stock_rate !== undefined
      ? `${kpis.in_stock_rate.toFixed(1)}%`
      : "96.8%";
  const shelfCapacity =
    kpis?.shelf_capacity_percentage !== undefined
      ? `${kpis.shelf_capacity_percentage.toFixed(1)}%`
      : "88.2%";
  const remainingLinearFt =
    kpis?.remaining_linear_ft !== undefined
      ? `${kpis.remaining_linear_ft.toFixed(1)} linear ft remaining`
      : "8.2 linear ft remaining";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      {/* KPI 1 */}
      <div className="elevation-1 rounded-lg p-lg flex flex-col gap-2 relative overflow-hidden group hover:border-outline transition-colors bg-white">
        <div className="flex justify-between items-start">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Sales per Linear Ft
          </p>
          <span className="material-symbols-outlined text-on-surface-variant opacity-50">
            payments
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-headline-xl text-headline-xl text-on-surface">
            {salesPerLinearFt}
          </p>
        </div>
        <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded w-max mt-1">
          <span className="material-symbols-outlined text-[14px]">
            trending_up
          </span>
          <span className="font-label-md text-[11px]">{salesGrowth}</span>
        </div>
      </div>

      {/* KPI 2 */}
      <div className="elevation-1 rounded-lg p-lg flex flex-col gap-2 relative overflow-hidden group hover:border-outline transition-colors bg-white">
        <div className="flex justify-between items-start">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Private Brand %
          </p>
          <span className="material-symbols-outlined text-on-surface-variant opacity-50">
            storefront
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-headline-xl text-headline-xl text-on-surface">
            {privateBrand}
          </p>
        </div>
        <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded w-max mt-1">
          <span className="material-symbols-outlined text-[14px] fill">
            check_circle
          </span>
          <span className="font-label-md text-[11px]">
            Success (Target &gt;20.0%)
          </span>
        </div>
      </div>

      {/* KPI 3 */}
      <div className="elevation-1 rounded-lg p-lg flex flex-col gap-2 relative overflow-hidden group hover:border-outline transition-colors bg-white">
        <div className="flex justify-between items-start">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            In-Stock Rate
          </p>
          <span className="material-symbols-outlined text-on-surface-variant opacity-50">
            inventory_2
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-headline-xl text-headline-xl text-on-surface">
            {inStockRate}
          </p>
        </div>
        <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded w-max mt-1">
          <span className="material-symbols-outlined text-[14px] fill">
            check_circle
          </span>
          <span className="font-label-md text-[11px]">
            Success (Target &gt;95.0%)
          </span>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="elevation-1 rounded-lg p-lg flex flex-col gap-2 relative overflow-hidden group hover:border-outline transition-colors bg-white">
        <div className="flex justify-between items-start">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Shelf Capacity
          </p>
          <span className="material-symbols-outlined text-on-surface-variant opacity-50">
            shelves
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-headline-xl text-headline-xl text-on-surface">
            {shelfCapacity}
          </p>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full"
              style={{ width: shelfCapacity }}
            ></div>
          </div>
          <span className="font-body-md text-body-md text-on-surface-variant text-xs">
            {remainingLinearFt}
          </span>
        </div>
      </div>
    </div>
  );
}
