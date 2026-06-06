import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./page";

const originalFetch = global.fetch;

const mockFetch = (
  impl: (url: string, init?: RequestInit) => Promise<Response> | Response,
) => {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return Promise.resolve(impl(url, init));
  }) as unknown as typeof fetch;
};

describe("SettingsPage", () => {
  beforeEach(() => {
    mockFetch((url, init) => {
      if (url === "/api/settings/generation" && init?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      if (url === "/api/settings/generation") {
        return {
          ok: true,
          json: async () => ({
            llmModel: "openai:gpt-5.4-mini",
            reasoningEffort: "MEDIUM",
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("loads generation settings and saves changes", async () => {
    const patchSpy = vi.fn();

    mockFetch((url, init) => {
      if (url === "/api/settings/generation" && init?.method === "PATCH") {
        patchSpy(init.body);
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      if (url === "/api/settings/generation") {
        return {
          ok: true,
          json: async () => ({
            llmModel: "openai:gpt-5.4-mini",
            reasoningEffort: "MEDIUM",
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    });

    render(<SettingsPage />);

    expect(screen.getByText("Loading generation settings...")).toBeInTheDocument();
    expect(await screen.findByText("Generation Settings")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save settings" })).toBeInTheDocument();
    });

    expect(screen.getByText("openai:gpt-5.4-mini")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Reasoning effort"), {
      target: { value: "MEDIUM" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledTimes(1);
      expect(JSON.parse(String(patchSpy.mock.calls[0][0]))).toEqual({
        reasoningEffort: "MEDIUM",
      });
      expect(screen.getByText("Generation settings saved.")).toBeInTheDocument();
    });
  });

  it("shows an error when loading generation settings fails", async () => {
    mockFetch((url) => {
      if (url === "/api/settings/generation") {
        return {
          ok: false,
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    });

    render(<SettingsPage />);

    expect(await screen.findByText("Generation settings could not be loaded.")).toBeInTheDocument();
  });

  it("shows an error when saving generation settings fails", async () => {
    mockFetch((url, init) => {
      if (url === "/api/settings/generation" && init?.method === "PATCH") {
        return {
          ok: false,
          json: async () => ({}),
        } as Response;
      }

      if (url === "/api/settings/generation") {
        return {
          ok: true,
          json: async () => ({
            llmModel: "openai:gpt-5.4-mini",
            reasoningEffort: "MEDIUM",
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save settings" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Generation settings could not be saved.")).toBeInTheDocument();
  });
});
