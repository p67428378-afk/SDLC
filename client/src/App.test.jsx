import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "./App";

describe("App Smoke Test", () => {
  it("renders login page when unauthenticated", () => {
    render(<App />);
    expect(screen.getByText("ApexBank")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to your secure banking portal"),
    ).toBeInTheDocument();
  });
});
