import React from "react";
import { Check } from "lucide-react";

export default function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
}) {
  const scenarios = [
    {
      name: "Conservative",
      salesImpact: "+1.2%",
      brandMix: "24.8%",
    },
    {
      name: "Balanced",
      salesImpact: "+3.5%",
      brandMix: "25.2%",
    },
    {
      name: "Aggressive",
      salesImpact: "+5.8%",
      brandMix: "26.0%",
    },
  ];

  return (
    <div>
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">
        Scenario Selector
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {scenarios.map((scenario) => {
          const isActive = selectedScenario === scenario.name;
          return (
            <div
              key={scenario.name}
              onClick={() => onSelectScenario(scenario.name)}
              className={`rounded-lg p-md cursor-pointer transition-all relative ${
                isActive
                  ? "bg-surface-container-highest border-2 border-primary-container shadow-lg"
                  : "bg-surface-container-high border border-surface-variant hover:bg-surface-bright"
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 bg-primary-container text-on-primary-container rounded-full p-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <h4 className="font-label-md text-label-md text-on-surface mb-2">
                {scenario.name}
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface-variant text-xs">
                    Sales
                  </span>
                  <span className="font-mono-data text-mono-data text-[#38BDF8] text-xs">
                    {scenario.salesImpact}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface-variant text-xs">
                    PB
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface text-xs">
                    {scenario.brandMix}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
