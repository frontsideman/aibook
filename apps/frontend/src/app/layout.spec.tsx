import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans" }),
  Newsreader: () => ({ variable: "--font-display" }),
  IBM_Plex_Mono: () => ({ variable: "--font-mono" }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("@/components/ServiceWorkerCleanup", () => ({
  default: () => <div data-testid="service-worker-cleanup" />,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe("root layout", () => {
  it("does not render the mock API bootstrap in the app shell", async () => {
    const { default: RootLayout } = await import("./layout");

    render(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("service-worker-cleanup")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
