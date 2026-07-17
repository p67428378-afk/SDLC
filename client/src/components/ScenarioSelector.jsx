import React from "react";

export default function ScenarioSelector({ activeScenario, onSelectScenario }) {
  const scenarios = [
    {
      name: "Conservative",
      risk: "Low Risk",
      desc: "Focus on maintaining current high-performing national brands with minimal changes.",
    },
    {
      name: "Balanced",
      risk: "Recommended",
      desc: "Optimized mix of private brand growth and shelf space efficiency.",
    },
    {
      name: "Aggressive",
      risk: "High Growth",
      desc: "Maximize private brand penetration and aggressively swap low-margin SKUs.",
    },
  ];

  return (
    <div className="elevation-1 rounded-lg p-lg bg-surface-container-lowest shrink-0">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
        Optimization Scenario
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.name;
          return (
            <button
              key={sc.name}
              onClick={() => onSelectScenario(sc.name)}
              className={`flex-1 py-3 px-2 rounded text-center transition-all relative overflow-hidden ${
                isActive
                  ? "border-2 border-secondary-fixed-dim bg-[#FFFBF0]"
                  : "border border-outline-variant hover:border-outline bg-surface-container-lowest text-on-surface-variant group"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-bl">
                  Active
                </div>
              )}
              <span
                className={`font-label-md text-label-md block mb-1 ${isActive ? "text-on-surface font-bold" : ""}`}
              >
                {sc.name}
              </span>
              <span
                className={`text-xs ${isActive ? "text-on-surface-variant" : "text-on-surface-variant opacity-70 group-hover:opacity-100"}`}
              >
                {sc.risk}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
