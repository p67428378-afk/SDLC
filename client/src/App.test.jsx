import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";

// Mock the API services
vi.mock("./services/api.js", () => ({
  getKpis: vi.fn(() =>
    Promise.resolve({
      sales_per_linear_ft: 425.5,
      private_brand_pct: 24.5,
      in_stock_rate: 98.2,
      shelf_capacity: 88,
    }),
  ),
  getSkus: vi.fn(() =>
    Promise.resolve([
      {
        id: "SKU-1001",
        sku_code: "SKU-1001",
        name: "Clover Valley Potato Chips",
        brand: "Private",
        weekly_sales: 1250,
        shelf_space: 4.0,
        status: "GROW",
      },
    ]),
  ),
  getScenario: vi.fn(() =>
    Promise.resolve({
      name: "Balanced",
      projected_sales_impact: 3.5,
      projected_brand_mix: 25.2,
      sku_actions: [{ sku_code: "SKU-1001", action: "GROW" }],
      guardrails: [{ name: "Shelf Space", status: "PASS", message: "PASSED" }],
    }),
  ),
  submitAssortment: vi.fn(() =>
    Promise.resolve({
      id: "DEC-2026-001",
      message: "Assortment plan submitted successfully.",
      scenario_name: "Balanced",
      sku_actions: [{ sku_code: "SKU-1001", action: "GROW" }],
      submitted_at: "2026-05-18T14:30:00Z",
      transaction_id: "TXN-12345-ABC",
      user_id: "manager@dollargeneral.com",
    }),
  ),
}));

describe("DG Cluster Assortment Advisor App Smoke Test", () => {
  it("renders the main dashboard layout and header", async () => {
    await act(async () => {
      render(<App />);
    });

    // Check if the main title is rendered
    expect(
      screen.getByText("DG Cluster Assortment Advisor"),
    ).toBeInTheDocument();

    // Check if the category planning sidebar header is rendered
    expect(screen.getByText("Category Planning")).toBeInTheDocument();
  });
});
