import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ScenarioSelectorPanel from "./ScenarioSelectorPanel";

describe("ScenarioSelectorPanel Component", () => {
  const mockScenariosData = {
    conservative: {
      projected_sales_lift_pct: 1.5,
      projected_private_brand_pct: 23.8,
    },
    balanced: {
      projected_sales_lift_pct: 5.2,
      projected_private_brand_pct: 30.1,
    },
    aggressive: {
      projected_sales_lift_pct: 8.7,
      projected_private_brand_pct: 34.5,
    },
  };

  it("renders all three scenario options", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioSelectorPanel
        selectedScenario="Balanced"
        onScenarioSelect={handleSelect}
        scenariosData={mockScenariosData}
      />,
    );

    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
  });

  it("calls onScenarioSelect when a scenario card is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioSelectorPanel
        selectedScenario="Balanced"
        onScenarioSelect={handleSelect}
        scenariosData={mockScenariosData}
      />,
    );

    const conservativeBtn = screen.getByRole("button", {
      name: /Conservative/i,
    });
    fireEvent.click(conservativeBtn);

    expect(handleSelect).toHaveBeenCalledWith("Conservative");
  });
});
