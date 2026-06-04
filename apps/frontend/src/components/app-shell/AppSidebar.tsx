"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { navItems } from "./nav-items";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      {/* Brand */}
      <div className="mb-6 flex items-center gap-3">
        <div className="size-[44px] rounded-[11px] bg-primary" />
        <span className="font-display text-[28px] font-semibold text-foreground">
          aiBook
        </span>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl py-3 transition-colors",
                  isActive
                    ? "border border-sidebar-active-border text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-[22px]",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm leading-tight",
                    isActive ? "font-extrabold" : "font-medium"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Account */}
      <div className="mb-2 flex h-[68px] items-center gap-2.5 rounded-xl border border-border bg-secondary p-3">
        <div className="size-[34px] shrink-0 rounded-full bg-avatar" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold text-foreground">
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
