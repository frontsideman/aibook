"use client";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { AppSidebar } from "./AppSidebar";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useHeader } from "./HeaderContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { header } = useHeader();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        {header ? (
          header
        ) : (
          <header className="flex h-16 shrink-0 items-center bg-background gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <PageBreadcrumb />
          </header>
        )}
        <main className={cn("min-w-0 p-[28]", !header && "p-4 lg:p-6")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
