import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/components/app-shell/AppShell",
  () => ({
    AppShell: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="app-shell-mock">
        <nav>Dashboard</nav>
        <main>{children}</main>
      </div>
    ),
  }),
  { virtual: true },
);

describe("route group layouts", () => {
  it("renders app shell slot for internal pages", async () => {
    const { default: AppLayout } = await import("./(app)/layout");
    render(
      <AppLayout>
        <div>internal</div>
      </AppLayout>,
    );

    expect(screen.getByText("internal")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-mock")).toBeInTheDocument();
  });

  it("renders auth layout without sidebar", async () => {
    const { default: AuthLayout } = await import("./(auth)/layout");

    render(
      <AuthLayout>
        <div>auth</div>
      </AuthLayout>,
    );

    expect(screen.getByText("auth")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell-mock")).not.toBeInTheDocument();
  });
});
