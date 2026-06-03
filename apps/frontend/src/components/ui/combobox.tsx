"use client"

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type ComboboxContextValue<TItem> = {
  items: TItem[]
  query: string
  setQuery: (value: string) => void
  open: boolean
  setOpen: (value: boolean) => void
  onSelect: (value: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue<unknown> | null>(null)

function useComboboxContext<TItem>() {
  const context = React.useContext(ComboboxContext) as ComboboxContextValue<TItem> | null
  if (!context) {
    throw new Error("Combobox components must be used within Combobox")
  }
  return context
}

type ComboboxProps<TItem extends string> = React.PropsWithChildren<{
  items: TItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}>

function Combobox<TItem extends string>({
  items,
  value,
  onValueChange,
  className,
  children,
}: ComboboxProps<TItem>) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [])

  const context = React.useMemo<ComboboxContextValue<TItem>>(
    () => ({
      items,
      query: value,
      setQuery: onValueChange,
      open,
      setOpen,
      onSelect: (selectedValue: string) => {
        onValueChange(selectedValue)
        setOpen(false)
      },
    }),
    [items, onValueChange, open, value]
  )

  return (
    <ComboboxContext.Provider value={context}>
      <div ref={rootRef} className={cn("relative space-y-2", className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  )
}

function ComboboxInput({
  className,
  onFocus,
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { query, setQuery, setOpen } = useComboboxContext<string>()

  return (
    <Input
      {...props}
      className={className}
      value={query}
      onFocus={(event) => {
        setOpen(true)
        onFocus?.(event)
      }}
      onChange={(event) => {
        setQuery(event.target.value)
        setOpen(true)
        onChange?.(event)
      }}
    />
  )
}

function ComboboxTrigger({
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen } = useComboboxContext<string>()
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      type="button"
      onClick={(event) => {
        setOpen(!open)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

function ComboboxContent({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useComboboxContext<string>()

  if (!open) return null

  return (
    <div
      className={cn(
        "absolute z-20 mt-1 w-full rounded-lg border border-border bg-background p-1 shadow-md",
        className
      )}
      {...props}
    />
  )
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<"p">) {
  const { items } = useComboboxContext<string>()

  if (items.length > 0) return null

  return <p className={cn("px-3 py-2 text-sm text-muted-foreground", className)} {...props} />
}

type ComboboxListProps<TItem extends string> = Omit<React.ComponentProps<"div">, "children"> & {
  children: (item: TItem) => React.ReactNode
}

function ComboboxList<TItem extends string>({
  className,
  children,
  ...props
}: ComboboxListProps<TItem>) {
  const { items } = useComboboxContext<TItem>()

  if (items.length === 0) return null

  return (
    <div className={cn("max-h-56 overflow-auto", className)} {...props}>
      {items.map((item) => children(item))}
    </div>
  )
}

type ComboboxItemProps = Omit<React.ComponentProps<"button">, "value"> & {
  value: string
}

function ComboboxItem({ value, className, onClick, ...props }: ComboboxItemProps) {
  const { onSelect } = useComboboxContext<string>()

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={(event) => {
        onSelect(value)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger }
