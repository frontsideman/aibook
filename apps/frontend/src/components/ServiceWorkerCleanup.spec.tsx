import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ServiceWorkerCleanup from "./ServiceWorkerCleanup";

describe("ServiceWorkerCleanup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("unregisters existing service workers and clears msw caches", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const cacheDelete = vi.fn().mockResolvedValue(true);
    const cacheKeys = vi.fn().mockResolvedValue(["msw-runtime", "app-cache"]);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations },
    });

    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        keys: cacheKeys,
        delete: cacheDelete,
      },
    });

    render(<ServiceWorkerCleanup />);

    await waitFor(() => {
      expect(getRegistrations).toHaveBeenCalledTimes(1);
      expect(unregister).toHaveBeenCalledTimes(1);
      expect(cacheKeys).toHaveBeenCalledTimes(1);
      expect(cacheDelete).toHaveBeenCalledWith("msw-runtime");
      expect(cacheDelete).not.toHaveBeenCalledWith("app-cache");
    });
  });
});
