"use client"

import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

export function SearchForm() {
  return (
    <form role="search" className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" placeholder="Search..." className="pl-8" />
    </form>
  )
}
