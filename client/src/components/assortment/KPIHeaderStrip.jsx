import React from "react";
import PropTypes from "prop-types";

export default function KPIHeaderStrip({ kpis, loading, error }) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 text-sm">
        Failed to load KPI metrics. Please try again later.
      </div>
    );
  }

  const data = kpis || {
    sales_per_linear_ft: 0,
    private_brand_pct: 0,
    in_stock_rate: 0,
    shelf_capacity_pct: 0,
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-6">
      {/* Card 1 */}
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-body-sm text-body-sm text-secondary mb-1">
          Sales per Linear Ft
        </h3>
        <div className="flex items-end justify-between">
          <span className="font-headline-md text-headline-md text-2xl font-bold">
            ${data.sales_per_linear_ft?.toFixed(2)}
          </span>
          <span className="bg-green-100 text-green-800 font-label-md text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">
              trending_up
            </span>{" "}
            +8.2% vs LY
          </span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-body-sm text-body-sm text-secondary mb-1">
          Private Brand %
        </h3>
        <div className="flex items-end justify-between">
          <span className="font-headline-md text-headline-md text-2xl font-bold">
            {data.private_brand_pct?.toFixed(1)}%
          </span>
          <span className="bg-yellow-100 text-yellow-800 font-label-md text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
            Target: 25.0%
          </span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-body-sm text-body-sm text-secondary mb-1">
          In-Stock Rate
        </h3>
        <div className="flex items-end justify-between">
          <span className="font-headline-md text-headline-md text-2xl font-bold">
            {data.in_stock_rate?.toFixed(1)}%
          </span>
          <span className="bg-green-100 text-green-800 font-label-md text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
            Target: 98.0%
          </span>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-body-sm text-body-sm text-secondary mb-1">
          Shelf Capacity
        </h3>
        <div className="flex items-end justify-between">
          <span className="font-headline-md text-headline-md text-2xl font-bold">
            {data.shelf_capacity_pct?.toFixed(1)}%
          </span>
          <span className="bg-green-100 text-green-800 font-label-md text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
            Target: &lt;95.0%
          </span>
        </div>
      </div>
    </section>
  );
}

KPIHeaderStrip.propTypes = {
  kpis: PropTypes.shape({
    sales_per_linear_ft: PropTypes.number,
    private_brand_pct: PropTypes.number,
    in_stock_rate: PropTypes.number,
    shelf_capacity_pct: PropTypes.number,
  }),
  loading: PropTypes.bool,
  error: PropTypes.any,
};
