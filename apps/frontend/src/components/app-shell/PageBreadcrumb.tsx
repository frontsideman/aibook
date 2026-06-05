"use client";

import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function getPageLabel(pathname: string): string | null {
  const navItem = navItems.find((item) => item.href === pathname);
  if (navItem) return navItem.label;

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return null;

  if (segments[0] === "books" && segments.length >= 2 && last !== "new") {
    return "Book";
  }

  return last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PageBreadcrumb() {
  const pathname = usePathname();
  const currentPage = getPageLabel(pathname);

  return (
    <BreadcrumbList className="gap-2 text-[13px]">
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink href="/" className="font-semibold">
          Dashboard
        </BreadcrumbLink>
      </BreadcrumbItem>
      {currentPage && pathname !== "/" && (
        <>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-extrabold">
              {currentPage}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  );
}
