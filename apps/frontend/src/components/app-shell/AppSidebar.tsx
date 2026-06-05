"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";

import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { navItems } from "./nav-items";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-8 items-center rounded-[10px] border border-border bg-card px-2.5">
        <span className="text-[13px] font-semibold text-foreground">Theme</span>
        <div className="ml-auto flex h-full items-center gap-0.5 rounded-[10px] bg-surface p-0.5 ring-1 ring-border">
          <div className="flex h-full items-center justify-center rounded-[7px] bg-primary px-3">
            <span className="text-[11px] font-bold text-white">Light</span>
          </div>
          <div className="flex h-full items-center justify-center rounded-[7px] px-3">
            <span className="text-[11px] font-bold text-muted-foreground">Dark</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-card px-2.5">
      <span className="text-[13px] font-semibold text-foreground">Theme</span>
      <div className="flex h-8 items-center gap-0.5 rounded-[10px] bg-surface p-0.5 ring-1 ring-border">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "flex h-full items-center justify-center rounded-[7px] px-3 transition-colors",
            theme === "light"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="text-[11px] font-bold">Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex h-full items-center justify-center rounded-[7px] px-3 transition-colors",
            theme === "dark"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="text-[11px] font-bold">Dark</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      {/* Brand */}
      <div className="mb-[18px] flex items-center gap-2.5">
        <div className="size-9 rounded-[9px] bg-primary" />
        <span className="font-display text-[27px] font-semibold text-foreground">
          aiBook
        </span>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isCreateBook = item.href === "/books/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-row items-center gap-2.5 rounded-[10px] px-3 h-11 transition-colors border-transparent border-[1px]",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:border-ab-border",
                )}
              >
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0",
                    isActive || isCreateBook
                      ? "text-ab-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-sm leading-tight",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Theme Toggle */}
      <div className="mb-2">
        <ThemeToggle />
      </div>

      {/* Account */}
      <div className="mb-2 flex h-[68px] items-center gap-2.5 rounded-xl border border-border bg-secondary p-3">
        <div className="size-[34px] shrink-0 rounded-full bg-avatar" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-extrabold text-foreground">
            Sarah K.
          </span>
          <span className="text-xs leading-none text-muted-foreground">
            Family plan
          </span>
        </div>
      </div>

      {/* Logout */}
      <Link
        href="/logout"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="size-[18px]" />
        Log out
      </Link>

      <SidebarRail />
    </Sidebar>
  );
}
