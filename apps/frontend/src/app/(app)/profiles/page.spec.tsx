import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilesPage from "./page";

const mockProfiles = [
  {
    id: "p1",
    name: "Noah",
    age: 7,
    gender: "male",
    interests: ["maps"],
  },
];

const originalFetch = global.fetch;

const mockFetch = (impl: (url: string, init?: RequestInit) => Promise<Response> | Response) => {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return Promise.resolve(impl(url, init));
  }) as unknown as typeof fetch;
};

describe("ProfilesPage — form validation", () => {
  beforeEach(() => {
    mockFetch((url) => {
      if (url === "/api/child-profiles" || url.startsWith("/api/child-profiles?")) {
        return {
          ok: true,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  const openForm = () => {
    fireEvent.click(screen.getByRole("button", { name: "Add Profile" }));
  };

  const fillForm = (overrides: Record<string, string> = {}) => {
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: overrides.name ?? "Sam" },
    });
    fireEvent.change(screen.getByPlaceholderText("Age"), {
      target: { value: overrides.age ?? "6" },
    });
    fireEvent.change(screen.getByTestId("interests-input"), {
      target: { value: overrides.interests ?? "  , , " },
    });
  };

  it("blocks submit and shows an error when interests are empty", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    openForm();
    fillForm({ interests: "" });

    const postSpy = vi.fn();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (init?.method === "POST" && url === "/api/child-profiles") {
          postSpy(url);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByTestId("interests-error")).toHaveTextContent(
      "Add at least one interest.",
    );
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("blocks submit when interests contain only whitespace and commas", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    openForm();
    fillForm({ interests: "  ,  ,  " });

    const postSpy = vi.fn();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (init?.method === "POST" && url === "/api/child-profiles") {
          postSpy(url);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByTestId("interests-error")).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("submits when at least one interest is provided", async () => {
    const postSpy = vi.fn();
    mockFetch((url, init) => {
      if (init?.method === "POST" && url === "/api/child-profiles") {
        postSpy(url);
        return {
          ok: true,
          json: async () => ({ id: "new" }),
        } as Response;
      }
      if (url === "/api/child-profiles") {
        return { ok: true, json: async () => mockProfiles } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    openForm();
    fillForm({ interests: "dinosaurs" });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("clears the error when the user types in the interests field", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    openForm();
    fillForm({ interests: "" });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByTestId("interests-error")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("interests-input"), {
      target: { value: "dinosaurs" },
    });

    expect(screen.queryByTestId("interests-error")).not.toBeInTheDocument();
  });
});

describe("ProfilesPage — side panel", () => {
  beforeEach(() => {
    mockFetch((url) => {
      if (url === "/api/child-profiles" || url.startsWith("/api/child-profiles?")) {
        return {
          ok: true,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("opens panel in create mode when Add Profile is clicked", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Profile" }));

    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes panel when Cancel is clicked", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Profile" }));
    expect(screen.getByText("Edit profile")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Edit profile")).not.toBeInTheDocument();
  });

  it("opens panel in edit mode with pre-filled data when Edit is clicked", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Noah" }));

    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Noah")).toBeInTheDocument();
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    expect(screen.getByText("Delete Noah's profile?")).toBeInTheDocument();
  });

  it("does not show delete section in create mode", async () => {
    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Noah")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Profile" }));

    expect(screen.queryByText(/Delete.*profile\?/)).not.toBeInTheDocument();
  });
});

describe("ProfilesPage — layout copy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("renders the Pencil-aligned page heading copy", async () => {
    mockFetch((url) => {
      if (url === "/api/child-profiles" || url.startsWith("/api/child-profiles?")) {
        return {
          ok: true,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("PERSONALIZATION")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Manage reusable child details for personalized book generation."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profiles-grid")).toBeInTheDocument();
  });

  it("renders the Pencil-aligned empty state copy", async () => {
    mockFetch((url) => {
      if (url === "/api/child-profiles" || url.startsWith("/api/child-profiles?")) {
        return {
          ok: true,
          json: async () => [],
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<ProfilesPage />);

    expect(await screen.findByText("No profiles yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create a child profile to reuse details across book generation."),
    ).toBeInTheDocument();
  });
});
