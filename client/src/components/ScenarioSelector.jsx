import React from "react";

export default function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
  scenarioData,
  loading,
}) {
  const scenarios = [
    {
      id: "conservative",
      name: "Conservative",
      lift: "+1.2%",
      capacity: "85%",
      description:
        "Focuses on low-risk, high-certainty adjustments with minimal shelf disruption.",
    },
    {
      id: "balanced",
      name: "Balanced",
      lift: "+4.5%",
      capacity: "89%",
      description:
        "Balances private brand growth with national brand performance and shelf optimization.",
    },
    {
      id: "aggressive",
      name: "Aggressive",
      lift: "+8.1%",
      capacity: "94%",
      description:
        "Maximizes sales lift and private brand mix with higher shelf capacity utilization.",
    },
  ];

  return (
    <div className="flex flex-col gap-sm">
      <h2 className="font-headline-md text-headline-md text-slate-800 font-bold">
        Assortment Scenario Selector
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          // If we have real API data for this scenario, use it, otherwise fallback to static
          const displayLift =
            scenarioData && isSelected
              ? `+${scenarioData.projected_sales_lift.toFixed(1)}%`
              : sc.lift;
          const displayCapacity =
            scenarioData && isSelected
              ? `${scenarioData.shelf_capacity.toFixed(0)}%`
              : sc.capacity;

          return (
            <div
              key={sc.id}
              onClick={() => !loading && onSelectScenario(sc.id)}
              className={`data-card p-md cursor-pointer transition-all relative flex flex-col justify-between min-h-[120px] ${
                isSelected
                  ? "border-2 border-[#FFD100] bg-white shadow-md scale-[1.02]"
                  : "hover:border-slate-300 bg-white hover:shadow-sm"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 bg-[#FFD100] rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-[#1E293B] font-bold">
                    check
                  </span>
                </div>
              )}
              <div>
                <span
                  className={`font-label-md text-label-md font-bold block mb-1 ${isSelected ? "text-slate-900" : "text-slate-700"}`}
                >
                  {sc.name}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  {sc.description}
                </p>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-2 mt-2">
                <span
                  className={isSelected ? "text-slate-800" : "text-slate-500"}
                >
                  Lift: {displayLift}
                </span>
                <span
                  className={isSelected ? "text-slate-800" : "text-slate-500"}
                >
                  Cap: {displayCapacity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
