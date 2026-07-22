import React from "react";
import Badge from "../common/Badge.jsx";

export default function SkuPerformanceTable({ skus, loading, error }) {
  if (loading) {
    return (
      <div className="bg-surface-container-high rounded-lg border border-surface-variant overflow-hidden">
        <div className="p-md border-b border-surface-variant bg-surface-container-highest">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            SKU Performance
          </h2>
        </div>
        <div className="p-lg text-center animate-pulse text-on-surface-variant">
          Loading SKU performance data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-md rounded-lg border border-error">
        <p className="font-semibold">Failed to load SKUs: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-high rounded-lg border border-surface-variant overflow-hidden">
      <div className="p-md border-b border-surface-variant bg-surface-container-highest">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          SKU Performance
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-variant bg-surface-dim">
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md">
                SKU ID
              </th>
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md">
                Product Name
              </th>
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md">
                Brand
              </th>
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md text-right">
                Weekly Sales
              </th>
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md text-right">
                Shelf Space
              </th>
              <th className="font-label-md text-label-md text-on-surface-variant py-3 px-md text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {skus && skus.length > 0 ? (
              skus.map((sku) => (
                <tr
                  key={sku.id || sku.sku_code}
                  className="border-b border-surface-variant hover:bg-[#3F4E64] transition-colors group"
                >
                  <td className="font-mono-data text-mono-data text-on-surface-variant py-3 px-md">
                    {sku.sku_code}
                  </td>
                  <td className="font-body-md text-body-md text-on-surface py-3 px-md">
                    {sku.name}
                  </td>
                  <td className="font-body-md text-body-md text-on-surface-variant py-3 px-md">
                    {sku.brand}
                  </td>
                  <td className="font-mono-data text-mono-data text-on-surface py-3 px-md text-right">
                    ${sku.weekly_sales?.toLocaleString()}
                  </td>
                  <td className="font-mono-data text-mono-data text-on-surface py-3 px-md text-right">
                    {sku.shelf_space} ft
                  </td>
                  <td className="py-3 px-md text-center">
                    <Badge status={sku.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="py-8 text-center text-on-surface-variant"
                >
                  No SKU performance data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
