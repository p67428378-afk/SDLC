import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPIHeaderStrip from "./KPIHeaderStrip";

describe("KPIHeaderStrip Component", () => {
  it("renders loading state correctly", () => {
    render(<KPIHeaderStrip loading={true} />);
    // Should render loading skeletons
    const skeletons = screen
      .getAllByRole("generic")
      .filter((el) => el.className.includes("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state correctly", () => {
    render(<KPIHeaderStrip error="Failed to load" />);
    expect(screen.getByText(/Failed to load KPI metrics/i)).toBeInTheDocument();
  });

  it("renders KPI values correctly when data is provided", () => {
    const mockKPIs = {
      sales_per_linear_ft: 425.5,
      private_brand_pct: 24.5,
      in_stock_rate: 98.2,
      shelf_capacity_pct: 92.0,
    };

    render(<KPIHeaderStrip kpis={mockKPIs} />);

    expect(screen.getByText("$425.50")).toBeInTheDocument();
    expect(screen.getByText("24.5%")).toBeInTheDocument();
    expect(screen.getByText("98.2%")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();
  });
});
