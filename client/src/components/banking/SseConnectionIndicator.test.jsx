import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import SseConnectionIndicator from "./SseConnectionIndicator";

describe("SseConnectionIndicator", () => {
  it("renders connected status correctly", () => {
    render(<SseConnectionIndicator status="connected" />);
    expect(screen.getByText("Live Connection")).toBeInTheDocument();
  });

  it("renders connecting status correctly", () => {
    render(<SseConnectionIndicator status="connecting" />);
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("renders disconnected status correctly", () => {
    render(<SseConnectionIndicator status="disconnected" />);
    expect(screen.getByText("Offline (Polling)")).toBeInTheDocument();
  });
});
