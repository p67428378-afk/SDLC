import React from "react";
import { ArrowUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function KpiHeaderStrip({ kpis, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-container-high rounded-lg p-md border border-surface-variant h-[120px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-md rounded-lg mb-lg border border-error">
        <p className="font-semibold">Failed to load KPIs: {error}</p>
      </div>
    );
  }

  const {
    sales_per_linear_ft = 0,
    private_brand_pct = 0,
    in_stock_rate = 0,
    shelf_capacity = 0,
  } = kpis || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
      {/* Card 1: Sales per Linear Ft */}
      <div className="bg-surface-container-high rounded-lg p-md border border-surface-variant flex flex-col justify-between h-[120px]">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Sales per Linear Ft
        </h3>
        <div className="flex items-end justify-between">
          <span className="font-headline-md text-headline-md text-on-surface">
            $
            {sales_per_linear_ft.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <div className="flex items-center gap-1 text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-full">
            <ArrowUp className="h-3 w-3" />
            <span className="font-mono-data text-mono-data text-xs">+8.2%</span>
          </div>
        </div>
      </div>

      {/* Card 2: Private Brand % */}
      <div className="bg-surface-container-high rounded-lg p-md border border-surface-variant flex flex-col justify-between h-[120px]">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Private Brand %
        </h3>
        <div className="flex flex-col">
          <div className="flex items-end justify-between mb-1">
            <span className="font-headline-md text-headline-md text-on-surface">
              {private_brand_pct}%
            </span>
            {private_brand_pct < 25.0 ? (
              <AlertTriangle className="h-5 w-5 text-primary-container" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[#38BDF8]" />
            )}
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant text-xs">
            Target 25.0%
          </span>
        </div>
      </div>

      {/* Card 3: In-Stock Rate */}
      <div className="bg-surface-container-high rounded-lg p-md border border-surface-variant flex flex-col justify-between h-[120px]">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          In-Stock Rate
        </h3>
        <div className="flex flex-col">
          <div className="flex items-end justify-between mb-1">
            <span className="font-headline-md text-headline-md text-on-surface">
              {in_stock_rate}%
            </span>
            {in_stock_rate >= 98.0 ? (
              <CheckCircle2 className="h-5 w-5 text-[#38BDF8]" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-primary-container" />
            )}
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant text-xs">
            Target 98.0%
          </span>
        </div>
      </div>

      {/* Card 4: Shelf Capacity */}
      <div className="bg-surface-container-high rounded-lg p-md border border-surface-variant flex flex-col justify-between h-[120px]">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Shelf Capacity
        </h3>
        <div className="flex flex-col w-full">
          <div className="flex items-end justify-between mb-2">
            <span className="font-headline-md text-headline-md text-on-surface">
              {shelf_capacity}%
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant text-xs">
              {Math.round((shelf_capacity / 100) * 200)}/200 ft
            </span>
          </div>
          <div className="w-full bg-surface-bright rounded-full h-1.5">
            <div
              className="bg-secondary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(shelf_capacity, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
