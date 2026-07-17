import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssortmentAdvisorDashboard from "./AssortmentAdvisorDashboard";
import * as api from "../services/api";

// Mock the API service
vi.mock("../services/api", () => ({
  getKPIs: vi.fn(),
  getSKUs: vi.fn(),
  submitAssortment: vi.fn(),
}));

describe("AssortmentAdvisorDashboard Smoke and Interaction Tests", () => {
  const mockKPIs = {
    sales_per_linear_ft: 342.5,
    private_brand_percentage: 24.5,
    in_stock_rate: 96.8,
    shelf_capacity_percentage: 88.2,
    sales_growth_percentage: 4.2,
    remaining_linear_ft: 8.2,
  };

  const mockSKUs = [
    {
      id: "1",
      sku_name: "Clover Valley Potato Chips 10oz",
      category: "Snacks",
      weekly_sales: 1240.0,
      yoy_growth: 12.4,
      profit_margin: 38.5,
      inventory_level: 420,
      is_private_brand: true,
      status: "GROW",
    },
    {
      id: "2",
      sku_name: "Lays Classic Potato Chips 8oz",
      category: "Snacks",
      weekly_sales: 2150.0,
      yoy_growth: 1.5,
      profit_margin: 22.0,
      inventory_level: 180,
      is_private_brand: false,
      status: "MAINTAIN",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getKPIs.mockResolvedValue(mockKPIs);
    api.getSKUs.mockResolvedValue(mockSKUs);
    api.submitAssortment.mockResolvedValue({
      id: "audit-123",
      user_id: "Category Manager",
      scenario_name: "Balanced",
      guardrails_passed: true,
      changes: [
        {
          action: "ADD",
          sku_name: "Clover Valley Spicy Nacho Chips 10oz",
          details: "+Proj. Sales $450/wk",
        },
      ],
      projected_sales_lift: 3.8,
      projected_brand_mix: 24.5,
      submitted_at: "2026-07-16T17:30:00Z",
    });
  });

  it("renders the dashboard with KPIs and SKU table", async () => {
    render(<AssortmentAdvisorDashboard />);

    // Verify header title
    expect(
      screen.getByText("DG Cluster Assortment Advisor"),
    ).toBeInTheDocument();

    // Wait for API calls to resolve and render
    await waitFor(() => {
      expect(screen.getByText("$342.50")).toBeInTheDocument();
    });

    expect(screen.getByText("24.5%")).toBeInTheDocument();
    expect(screen.getByText("96.8%")).toBeInTheDocument();
    expect(screen.getByText("88.2%")).toBeInTheDocument();

    // Verify SKU table content
    expect(
      screen.getByText("Clover Valley Potato Chips 10oz"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lays Classic Potato Chips 8oz"),
    ).toBeInTheDocument();
  });

  it("allows switching scenarios and updates the review panel", async () => {
    render(<AssortmentAdvisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Scenario Review: Balanced")).toBeInTheDocument();
    });

    // Click Conservative scenario
    const conservativeBtn = screen.getByRole("button", {
      name: /Conservative/i,
    });
    fireEvent.click(conservativeBtn);

    expect(
      screen.getByText("Scenario Review: Conservative"),
    ).toBeInTheDocument();
    expect(screen.getByText("KEEP")).toBeInTheDocument();
  });

  it("submits assortment changes and displays confirmation modal", async () => {
    render(<AssortmentAdvisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Submit Assortment Changes")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", {
      name: /Submit Assortment Changes/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Assortment Submitted Successfully"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Scenario:/i)).toBeInTheDocument();

    // Dismiss modal
    const dismissBtn = screen.getByRole("button", { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText("Assortment Submitted Successfully"),
    ).not.toBeInTheDocument();
  });
});
