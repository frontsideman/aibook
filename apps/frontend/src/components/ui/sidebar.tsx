"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}

function SidebarProvider({
  children,
  defaultOpen = true,
}: React.PropsWithChildren<{ defaultOpen?: boolean }>) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="group/sidebar-wrapper flex min-h-screen w-full bg-background">{children}</div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  const { open } = useSidebar()

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? "open" : "closed"}
      className={cn(
        "relative hidden border-r bg-card md:block",
        open ? "w-[244px]" : "w-0 overflow-hidden border-transparent",
        className
      )}
      {...props}
    >
      <div className="flex h-full flex-col px-5 py-5">{children}</div>
    </aside>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("border-b p-3", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-content" className={cn("flex-1 overflow-y-auto", className)} {...props} />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="sidebar-group" className={cn("mb-4", className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn("mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", className)}
      {...props}
    />
  )
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("space-y-1", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("", className)} {...props} />
}

function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  asChild?: boolean
  isActive?: boolean
}) {
  const Comp = asChild ? Slot.Root : Button

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : "false"}
      className={cn(
        "w-full justify-start",
        isActive ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "",
        className
      )}
      {...props}
    />
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useSidebar()

  return (
    <div
      data-slot="sidebar-rail"
      aria-hidden="true"
      className={cn("absolute top-0 right-0 h-full w-px bg-border", open ? "opacity-100" : "opacity-0", className)}
      {...props}
    />
  )
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { open, setOpen } = useSidebar()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={() => setOpen((value) => !value)}
      aria-label="Toggle sidebar"
      aria-expanded={open}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
    </Button>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("min-w-0 flex-1", className)} {...props} />
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
}
