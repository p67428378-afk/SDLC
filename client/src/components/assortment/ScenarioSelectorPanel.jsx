import React from "react";
import PropTypes from "prop-types";

export default function ScenarioSelectorPanel({
  selectedScenario,
  onScenarioSelect,
  scenariosData,
}) {
  const scenarios = [
    {
      name: "Conservative",
      label: "Conservative",
      desc: "Focus on low-risk, high-margin core SKUs.",
      defaultSalesLift: "+1.5%",
      defaultPrivateBrand: "23.8%",
    },
    {
      name: "Balanced",
      label: "Balanced",
      desc: "Optimized mix of private brand growth and shelf space.",
      defaultSalesLift: "+5.2%",
      defaultPrivateBrand: "30.1%",
    },
    {
      name: "Aggressive",
      label: "Aggressive",
      desc: "Maximize private brand penetration and sales lift.",
      defaultSalesLift: "+8.7%",
      defaultPrivateBrand: "34.5%",
    },
  ];

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-4 shadow-sm">
      <h3 className="font-headline-md text-base font-bold mb-3 text-slate-800">
        Assortment Scenarios
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((sc) => {
          const isSelected =
            selectedScenario?.toLowerCase() === sc.name.toLowerCase();
          const data = scenariosData?.[sc.name.toLowerCase()];

          const salesLift = data
            ? `+${data.projected_sales_lift_pct?.toFixed(1)}%`
            : sc.defaultSalesLift;

          const privateBrand = data
            ? `${data.projected_private_brand_pct?.toFixed(1)}%`
            : sc.defaultPrivateBrand;

          return (
            <button
              key={sc.name}
              type="button"
              onClick={() => onScenarioSelect(sc.name)}
              className={`p-3 border rounded flex flex-col items-center justify-center text-center transition-all ${
                isSelected
                  ? "border-2 border-primary-container bg-yellow-50/50 shadow-sm"
                  : "border-outline-variant bg-white hover:bg-slate-50"
              }`}
            >
              <span
                className={`font-label-md text-xs block ${isSelected ? "text-slate-900 font-bold" : "text-secondary"}`}
              >
                {sc.label}
              </span>
              <div className="mt-2 space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Lift: {salesLift}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  PB: {privateBrand}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ScenarioSelectorPanel.propTypes = {
  selectedScenario: PropTypes.string.isRequired,
  onScenarioSelect: PropTypes.func.isRequired,
  scenariosData: PropTypes.object,
};
