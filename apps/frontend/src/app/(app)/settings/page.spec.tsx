import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./page";

const originalFetch = global.fetch;

describe("SettingsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("renders the Pencil-inspired static settings layout", () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<SettingsPage />);

    expect(screen.getByText("ACCOUNT")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(
      screen.getByText("Manage subscription, billing, and account preferences."),
    ).toBeInTheDocument();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not render generation settings content from the old page", () => {
    render(<SettingsPage />);

    expect(
      screen.queryByRole("heading", { name: "Generation Settings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reasoning effort")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders visible controls as disabled UI", () => {
    render(<SettingsPage />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }

    for (const switchControl of screen.getAllByRole("switch")) {
      expect(switchControl).toBeDisabled();
    }

    expect(
      screen.getByRole("textbox", { name: "Confirm account deletion" }),
    ).toBeDisabled();
  });
});
