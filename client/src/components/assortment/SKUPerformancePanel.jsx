import React from "react";
import PropTypes from "prop-types";

export default function SKUPerformancePanel({
  skus,
  total,
  page,
  limit,
  onPageChange,
  onSearchChange,
  onStatusChange,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(searchTerm);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    onSearchChange("");
  };

  const handleStatusSelect = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    onStatusChange(val);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "GROW":
        return "bg-green-100 text-green-800";
      case "MAINTAIN":
        return "bg-blue-100 text-blue-800";
      case "REDUCE":
        return "bg-red-100 text-red-800";
      case "SWAP":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="bg-white border border-outline-variant rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header with Search and Filter */}
      <div className="p-4 border-b border-outline-variant flex flex-wrap justify-between items-center gap-4 bg-slate-50">
        <h2 className="font-headline-md text-lg font-bold text-slate-800">
          Snacks SKU Performance
        </h2>
        <div className="flex flex-wrap gap-2">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center"
          >
            <span className="material-symbols-outlined absolute left-2.5 text-secondary text-sm">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 py-1.5 border border-outline-variant rounded text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search SKUs..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </form>
          <select
            value={statusFilter}
            onChange={handleStatusSelect}
            className="border border-outline-variant rounded px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Recommendations</option>
            <option value="GROW">GROW</option>
            <option value="MAINTAIN">MAINTAIN</option>
            <option value="REDUCE">REDUCE</option>
            <option value="SWAP">SWAP</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-600 text-sm">
            Failed to load SKU performance data.
          </div>
        ) : skus.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
            No SKUs found matching the criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-secondary font-label-md text-[12px] uppercase tracking-wider">
                <th className="p-3 border-b border-outline-variant">SKU ID</th>
                <th className="p-3 border-b border-outline-variant">Name</th>
                <th className="p-3 border-b border-outline-variant text-center">
                  Private Brand
                </th>
                <th className="p-3 border-b border-outline-variant text-right">
                  Sales ($)
                </th>
                <th className="p-3 border-b border-outline-variant text-right">
                  Sales Growth (%)
                </th>
                <th className="p-3 border-b border-outline-variant text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="font-body-md text-[13px]">
              {skus.map((sku) => (
                <tr
                  key={sku.id}
                  className="border-b border-outline-variant/50 hover:bg-slate-50 transition-colors h-12"
                >
                  <td className="p-3 text-secondary font-mono">
                    {sku.id?.substring(0, 8) || "SKU-N/A"}
                  </td>
                  <td className="p-3 font-medium">{sku.name}</td>
                  <td className="p-3 text-center">
                    {sku.private_brand ? (
                      <span className="material-symbols-outlined text-green-600 text-sm">
                        check_circle
                      </span>
                    ) : (
                      <span className="text-secondary">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">
                    $
                    {sku.sales?.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td
                    className={`p-3 text-right ${sku.sales_growth_pct >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {sku.sales_growth_pct >= 0 ? "+" : ""}
                    {sku.sales_growth_pct?.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded ${getStatusBadgeClass(sku.status)}`}
                    >
                      {sku.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-outline-variant bg-slate-50 text-xs text-secondary flex justify-between items-center">
        <span>
          Showing {Math.min((page - 1) * limit + 1, total)}-
          {Math.min(page * limit, total)} of {total} SKUs
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="p-1 border border-outline-variant rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed material-symbols-outlined text-sm"
          >
            chevron_left
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="p-1 border border-outline-variant rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed material-symbols-outlined text-sm"
          >
            chevron_right
          </button>
        </div>
      </div>
    </div>
  );
}

SKUPerformancePanel.propTypes = {
  skus: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      private_brand: PropTypes.bool.isRequired,
      sales: PropTypes.number.isRequired,
      sales_growth_pct: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
    }),
  ).isRequired,
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.any,
};
