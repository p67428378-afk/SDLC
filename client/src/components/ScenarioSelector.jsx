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
    <div className="card-base p-6 shadow-xl shadow-black/40 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#ebe2cf] flex items-center gap-2">
        <span className="material-symbols-outlined text-[#ffd100]">tune</span>
        Assortment Scenario Selector
      </h2>
      <div className="flex flex-col gap-3">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
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
              className={`rounded-lg p-4 cursor-pointer transition-all relative flex items-start gap-3 ${
                isSelected
                  ? "border-2 border-[#ffd100] bg-[#ffd100]/5 shadow-[0_0_15px_rgba(255,209,0,0.1)]"
                  : "border border-[#1F2937] hover:bg-[#1F2937]/50"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-[#ffd100]">
                  <span className="material-symbols-outlined filled">
                    check_circle
                  </span>
                </div>
              )}
              <div
                className={`mt-1 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                  isSelected ? "border-[#ffd100]" : "border-[#d1c6ab]"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#ffd100]"></div>
                )}
              </div>
              <div className="pr-6 flex-1">
                <h4
                  className={`text-sm font-bold ${isSelected ? "text-[#ffd100]" : "text-[#ebe2cf]"}`}
                >
                  {sc.name} {sc.id === "balanced" && "(Recommended)"}
                </h4>
                <p className="text-xs text-[#d1c6ab] mt-1 leading-relaxed">
                  {sc.description}
                </p>
                <div className="flex gap-4 text-xs font-semibold mt-2 text-[#d1c6ab]">
                  <span>Lift: {displayLift}</span>
                  <span>Cap: {displayCapacity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
