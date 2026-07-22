import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import App from "./App.jsx";
import * as api from "./services/api.js";

// Mock the API service
vi.mock("./services/api.js", () => ({
  getKpis: vi.fn(),
  getSkus: vi.fn(),
  getScenario: vi.fn(),
  submitAssortment: vi.fn(),
}));

describe("DG Cluster Assortment Advisor App", () => {
  const mockKpis = {
    sales_per_linear_ft: 15.75,
    private_brand_pct: 22.0,
    in_stock_rate: 96.4,
    shelf_capacity_utilization: 88.0,
    sales_lift_pct: 4.2,
  };

  const mockSkus = [
    {
      sku_id: "SKU-101",
      name: "Lay's Classic",
      brand: "National",
      sales: 4250,
      units_sold: 1200,
      profit_margin: 0.24,
      in_stock_rate: 0.98,
      status: "GROW",
    },
    {
      sku_id: "SKU-205",
      name: "Clover Valley Pretzels",
      brand: "Private",
      sales: 1800,
      units_sold: 850,
      profit_margin: 0.38,
      in_stock_rate: 0.95,
      status: "MAINTAIN",
    },
  ];

  const mockScenario = {
    scenario_name: "balanced",
    projected_sales_lift: 4.5,
    shelf_capacity: 89.0,
    private_brand_mix: 23.5,
    in_stock_rate: 96.2,
    guardrails: {
      private_brand_ok: true,
      shelf_capacity_ok: true,
    },
    sku_actions: [
      { sku_id: "SKU-101", action: "GROW", name: "Lay's Classic" },
      { sku_id: "SKU-205", action: "MAINTAIN", name: "Clover Valley Pretzels" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getKpis.mockResolvedValue(mockKpis);
    api.getSkus.mockResolvedValue(mockSkus);
    api.getScenario.mockResolvedValue(mockScenario);
  });

  it("renders the dashboard with header and sidebar", async () => {
    render(<App />);

    // Check header title
    expect(
      screen.getByText("DG Cluster Assortment Advisor"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Snacks Category — Small Town Value Cluster"),
    ).toBeInTheDocument();

    // Check sidebar links
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Scenario Planner")).toBeInTheDocument();
  });

  it("fetches and displays KPI data", async () => {
    render(<App />);

    await waitFor(() => {
      expect(api.getKpis).toHaveBeenCalled();
    });

    expect(screen.getByText("$15.75")).toBeInTheDocument();
    expect(screen.getByText("22.0%")).toBeInTheDocument();
    expect(screen.getByText("96.4%")).toBeInTheDocument();
    expect(screen.getByText("88.0%")).toBeInTheDocument();
  });

  it("fetches and displays SKU performance table", async () => {
    render(<App />);

    await waitFor(() => {
      expect(api.getSkus).toHaveBeenCalled();
    });

    expect(screen.getAllByText("Lay's Classic").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Clover Valley Pretzels").length,
    ).toBeGreaterThan(0);
  });
});
