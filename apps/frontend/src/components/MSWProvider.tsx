"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const initMsw = async () => {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        const { worker } = await import("../mocks/browser");
        await worker.start({
          onUnhandledRequest: "bypass",
        });
        setMswReady(true);
      } else {
        setMswReady(true);
      }
    };

    if (!mswReady) {
      initMsw();
    }
  }, [mswReady]);

  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
}
