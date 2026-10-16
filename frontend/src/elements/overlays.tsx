import { useCallback, useEffect } from "react"
import { toast } from "sonner"
import sonnerCss from "sonner/dist/styles.css"
import { define } from "@/lib/define"
import { Icon } from "@/lib/icons"
import { hasSlot } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

const insideEvents = new WeakSet<Event>()
const markInside = (e: Event) => insideEvents.add(e)

function useComposedInside<T extends HTMLElement>() {
  const ref = useCallback((node: T | null) => {
    if (!node) return
    for (const type of ["pointerdown", "focusin"]) node.addEventListener(type, markInside, true)
    return () => {
      for (const type of ["pointerdown", "focusin"]) node.removeEventListener(type, markInside, true)
    }
  }, [])
  const onInteractOutside = (e: { detail: { originalEvent: Event }; preventDefault: () => void }) => {
    if (insideEvents.has(e.detail.originalEvent)) e.preventDefault()
  }
  return { ref, onInteractOutside }
}

function DialogElement({ p, host, update }: any) {
  const inside = useComposedInside<HTMLDivElement>()
  return (
    <Dialog open={p.open} onOpenChange={(v) => update("open", v, "openchange")}>
      <DialogContent {...inside} className={dialogSizes[p.size]}>
        <DialogHeader>
          <DialogTitle>{p.heading}</DialogTitle>
          {p.description && <DialogDescription>{p.description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4">
          <slot />
        </div>
        {hasSlot(host, "footer") && (
          <DialogFooter>
            <slot name="footer" />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SheetElement({ p, host, update }: any) {
  const inside = useComposedInside<HTMLDivElement>()
  return (
    <Sheet open={p.open} onOpenChange={(v) => update("open", v, "openchange")}>
      <SheetContent {...inside} side={p.side} className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{p.heading}</SheetTitle>
          {p.description && <SheetDescription>{p.description}</SheetDescription>}
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 overflow-y-auto px-4">
          <slot />
        </div>
        {hasSlot(host, "footer") && (
          <SheetFooter>
            <slot name="footer" />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PopoverElement({ p, update }: any) {
  const inside = useComposedInside<HTMLDivElement>()
  return (
    <Popover open={p.open} onOpenChange={(v) => update("open", v, "openchange")}>
      <PopoverTrigger asChild>
        <Button variant={p.variant} size={p.size}>
          <Icon name={p.icon} />
          {p.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent {...inside} align={p.align} className="w-80">
        <slot />
      </PopoverContent>
    </Popover>
  )
}

const dialogSizes: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
}

define("ui-dialog", {
  display: "contents",
  props: ({ string, bool, oneOf }) => ({
    open: bool,
    heading: string,
    description: string,
    size: oneOf("sm", "md", "lg").default("md"),
  }),
  slots: [{ name: "" }, { name: "footer" }],
  events: [{ name: "openchange", kind: "custom-event" }],
  render: ({ props: p, host, update }) => <DialogElement p={p} host={host} update={update} />,
})

define("ui-sheet", {
  display: "contents",
  props: ({ string, bool, oneOf }) => ({
    open: bool,
    heading: string,
    description: string,
    side: oneOf("right", "left", "top", "bottom").default("right"),
  }),
  events: [{ name: "openchange", kind: "custom-event" }],
  render: ({ props: p, host, update }) => <SheetElement p={p} host={host} update={update} />,
})

type MenuItem = {
  value?: string
  label?: string
  icon?: string
  shortcut?: string
  destructive?: boolean
  separator?: boolean
  heading?: string
}

export function MenuItems({ items, onSelect }: { items: MenuItem[]; onSelect: (value: string) => void }) {
  return (
    <>
      {items.map((item, i) =>
        item.separator ? (
          <DropdownMenuSeparator key={i} />
        ) : item.heading ? (
          <DropdownMenuLabel key={i}>{item.heading}</DropdownMenuLabel>
        ) : (
          <DropdownMenuItem
            key={i}
            variant={item.destructive ? "destructive" : "default"}
            onSelect={() => onSelect(item.value ?? "")}
          >
            <Icon name={item.icon} />
            {item.label}
            {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
          </DropdownMenuItem>
        ),
      )}
    </>
  )
}

define("ui-dropdown-menu", {
  display: "inline-flex",
  props: ({ string, json, oneOf }) => ({
    label: string,
    icon: string,
    variant: oneOf("default", "outline", "secondary", "ghost").default("outline"),
    size: oneOf("default", "sm", "icon", "icon-sm").default("default"),
    avatar: string,
    fallback: string,
    align: oneOf("start", "center", "end").default("end"),
    items: json.default([]),
  }),
  events: [{ name: "select", kind: "custom-event" }],
  render: ({ props: p, emit }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {p.fallback ? (
          <button className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Avatar>
              {p.avatar && <AvatarImage src={p.avatar} />}
              <AvatarFallback>{p.fallback}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <Button variant={p.variant} size={p.size}>
            <Icon name={p.icon} />
            {p.label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={p.align} className="min-w-48">
        <MenuItems items={p.items as MenuItem[]} onSelect={(value) => emit("select", { value })} />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
})

define("ui-popover", {
  display: "inline-flex",
  props: ({ string, bool, oneOf }) => ({
    label: string,
    icon: string,
    variant: oneOf("default", "outline", "secondary", "ghost").default("outline"),
    size: oneOf("default", "sm", "icon").default("default"),
    open: bool,
    align: oneOf("start", "center", "end").default("center"),
  }),
  render: ({ props: p, host, update }) => <PopoverElement p={p} host={host} update={update} />,
})

type TabDef = { value: string; label: string; icon?: string; count?: number }

define("ui-tabs", {
  props: ({ string, json, oneOf }) => ({
    value: string,
    tabs: json.default([]),
    variant: oneOf("default", "line").default("default"),
  }),
  events: [{ name: "change", kind: "custom-event" }],
  render: ({ props: p, host, update }) => {
    const tabs = p.tabs as TabDef[]
    return (
      <Tabs value={p.value || tabs[0]?.value} onValueChange={(v) => update("value", v)}>
        <TabsList variant={p.variant}>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <Icon name={t.icon} />
              {t.label}
              {t.count != null && (
                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums">{t.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs
          .filter((t) => hasSlot(host, t.value))
          .map((t) => (
            <TabsContent key={t.value} value={t.value} className={cn("mt-2")}>
              <slot name={t.value} />
            </TabsContent>
          ))}
      </Tabs>
    )
  },
})

type ToastSpec = {
  id: string
  type?: "success" | "error" | "info" | "warning" | "message"
  title: string
  description?: string
}

function fire(t: ToastSpec) {
  const fn = t.type && t.type !== "message" ? toast[t.type] : toast
  fn(t.title, { id: t.id, description: t.description })
}

function ToasterBridge({ spec }: { spec: ToastSpec | null }) {
  useEffect(() => {
    if (spec?.id) fire(spec)
  }, [spec?.id])
  useEffect(() => {
    const onToast = (e: Event) => fire({ ...(e as CustomEvent<ToastSpec>).detail, id: crypto.randomUUID() })
    document.addEventListener("ui:toast", onToast)
    return () => document.removeEventListener("ui:toast", onToast)
  }, [])
  return <Toaster position="bottom-right" richColors={false} />
}

define("ui-toaster", {
  display: "contents",
  styles: [sonnerCss],
  props: ({ json }) => ({ toast: json.default(null) }),
  render: ({ props: p }) => <ToasterBridge spec={p.toast as ToastSpec | null} />,
})
