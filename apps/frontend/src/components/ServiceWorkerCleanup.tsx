"use client";

import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      )
      .catch(() => {
        // Ignore cleanup failures; the app should still render normally.
      });

    if ("caches" in window) {
      void caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((name) => name.toLowerCase().includes("msw"))
              .map((name) => caches.delete(name)),
          ),
        )
        .catch(() => {
          // Ignore cleanup failures; the app should still render normally.
        });
    }
  }, []);

  return null;
}
