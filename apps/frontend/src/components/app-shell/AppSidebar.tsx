"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { navItems } from "./nav-items";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      {/* Brand */}
      <div className="mb-[18px] flex h-12 items-center gap-2.5">
        <div className="size-[36px] rounded-[9px] bg-primary" />
        <span className="font-display text-[27px] font-semibold text-foreground">
          aiBook
        </span>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-11 rounded-[10px] px-3 gap-2.5 text-sm",
                    isActive
                      ? "bg-sidebar-active border border-sidebar-active-border text-foreground font-extrabold [&_svg]:text-primary"
                      : "text-muted-foreground font-semibold hover:bg-sidebar-active/50"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
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
