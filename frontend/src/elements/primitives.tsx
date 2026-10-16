import { define } from "@/lib/define"
import { Icon } from "@/lib/icons"
import { hasSlot } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

const badgeTones: Record<string, string> = {
  success: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  info: "border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400",
}

export function ToneBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const variant = (["default", "secondary", "destructive", "outline"].includes(tone) ? tone : "outline") as
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
  return (
    <Badge variant={variant} className={badgeTones[tone]}>
      {children}
    </Badge>
  )
}

define("ui-button", {
  display: "inline-flex",
  props: ({ string, bool, oneOf }) => ({
    variant: oneOf("default", "destructive", "outline", "secondary", "ghost", "link").default("default"),
    size: oneOf("default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg").default("default"),
    icon: string,
    iconRight: string,
    href: string,
    disabled: bool,
    loading: bool,
    full: bool,
  }),
  render: ({ props: p }) => {
    const content = (
      <>
        {p.loading ? <Icon name="refresh" className="animate-spin" /> : <Icon name={p.icon} />}
        <slot />
        <Icon name={p.iconRight} />
      </>
    )
    const cls = cn(p.full && "w-full")
    if (p.href) {
      return (
        <Button asChild variant={p.variant} size={p.size} className={cls}>
          <a href={p.href}>{content}</a>
        </Button>
      )
    }
    return (
      <Button variant={p.variant} size={p.size} disabled={p.disabled || p.loading} className={cls}>
        {content}
      </Button>
    )
  },
})

define("ui-badge", {
  display: "inline-flex",
  props: ({ string }) => ({ variant: string.default("default"), icon: string }),
  render: ({ props: p }) => (
    <ToneBadge tone={p.variant}>
      <Icon name={p.icon} />
      <slot />
    </ToneBadge>
  ),
})

define("ui-card", {
  props: ({ string, bool }) => ({ heading: string, description: string, flush: bool }),
  slots: [{ name: "action" }, { name: "footer" }, { name: "" }],
  render: ({ props: p, host }) => (
    <Card className="h-full">
      {(p.heading || p.description || hasSlot(host, "action")) && (
        <CardHeader>
          {p.heading && <CardTitle>{p.heading}</CardTitle>}
          {p.description && <CardDescription>{p.description}</CardDescription>}
          {hasSlot(host, "action") && (
            <CardAction>
              <slot name="action" />
            </CardAction>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("flex-1", p.flush && "px-0")}>
        <slot />
      </CardContent>
      {hasSlot(host, "footer") && (
        <CardFooter className="gap-2">
          <slot name="footer" />
        </CardFooter>
      )}
    </Card>
  ),
})

function AnimatedNumber({ value }: { value: string }) {
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 600)
    return () => clearTimeout(t)
  }, [value])
  return (
    <span className={cn("transition-colors duration-500", flash && "text-emerald-600 dark:text-emerald-400")}>
      {value}
    </span>
  )
}

define("ui-stat", {
  props: ({ string, oneOf }) => ({
    label: string,
    value: string,
    delta: string,
    trend: oneOf("up", "down", "flat").default("up"),
    hint: string,
    icon: string,
  }),
  render: ({ props: p }) => (
    <Card className="h-full gap-3">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon name={p.icon} className="size-4" />
          {p.label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          <AnimatedNumber value={p.value} />
        </CardTitle>
        {p.delta && (
          <CardAction>
            <ToneBadge tone={p.trend === "down" ? "destructive" : p.trend === "up" ? "success" : "secondary"}>
              <Icon name={p.trend === "down" ? "trending-down" : "trending-up"} />
              {p.delta}
            </ToneBadge>
          </CardAction>
        )}
      </CardHeader>
      {p.hint && <CardFooter className="text-sm text-muted-foreground">{p.hint}</CardFooter>}
    </Card>
  ),
})

define("ui-avatar", {
  display: "inline-flex",
  props: ({ string, oneOf }) => ({
    src: string,
    fallback: string,
    size: oneOf("sm", "default", "lg").default("default"),
  }),
  render: ({ props: p }) => (
    <Avatar size={p.size}>
      {p.src && <AvatarImage src={p.src} alt={p.fallback} />}
      <AvatarFallback>{p.fallback}</AvatarFallback>
    </Avatar>
  ),
})

define("ui-progress", {
  props: ({ string, number }) => ({ value: number.clamp(0, 100), label: string, hint: string }),
  render: ({ props: p }) => (
    <div className="grid gap-2">
      {(p.label || p.hint) && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{p.label}</span>
          <span className="text-muted-foreground tabular-nums">{p.hint || `${Math.round(p.value)}%`}</span>
        </div>
      )}
      <Progress value={p.value} />
    </div>
  ),
})

define("ui-separator", {
  props: ({ oneOf }) => ({ orientation: oneOf("horizontal", "vertical").default("horizontal") }),
  render: ({ props: p }) => <Separator orientation={p.orientation} />,
})

define("ui-skeleton", {
  props: ({ string }) => ({ width: string.default("100%"), height: string.default("1rem"), radius: string }),
  render: ({ props: p }) => (
    <Skeleton style={{ width: p.width, height: p.height, borderRadius: p.radius || undefined }} />
  ),
})

define("ui-alert", {
  props: ({ string, oneOf }) => ({
    variant: oneOf("default", "destructive").default("default"),
    heading: string,
    icon: string.default("info"),
  }),
  render: ({ props: p }) => (
    <Alert variant={p.variant}>
      <Icon name={p.icon} />
      {p.heading && <AlertTitle>{p.heading}</AlertTitle>}
      <AlertDescription>
        <slot />
      </AlertDescription>
    </Alert>
  ),
})

define("ui-scroll-area", {
  props: ({ string }) => ({ height: string.default("16rem") }),
  render: ({ props: p }) => (
    <ScrollArea style={{ height: p.height }}>
      <slot />
    </ScrollArea>
  ),
})

type Crumb = { label: string; href?: string }

define("ui-breadcrumb", {
  props: ({ json }) => ({ items: json.default([]) }),
  render: ({ props: p }) => {
    const items = p.items as Crumb[]
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, i) => (
            <span key={i} className="contents">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === items.length - 1 || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  },
})

define("ui-tooltip", {
  display: "inline-flex",
  props: ({ string, oneOf }) => ({
    content: string,
    side: oneOf("top", "right", "bottom", "left").default("top"),
  }),
  render: ({ props: p, host }) => <HostTooltip host={host} content={p.content} side={p.side} />,
})

function HostTooltip({
  host,
  content,
  side,
}: {
  host: HTMLElement
  content: string
  side: "top" | "right" | "bottom" | "left"
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const show = () => setOpen(true)
    const hide = () => setOpen(false)
    host.addEventListener("pointerenter", show)
    host.addEventListener("pointerleave", hide)
    host.addEventListener("focusin", show)
    host.addEventListener("focusout", hide)
    host.addEventListener("pointerdown", hide)
    return () => {
      host.removeEventListener("pointerenter", show)
      host.removeEventListener("pointerleave", hide)
      host.removeEventListener("focusin", show)
      host.removeEventListener("focusout", hide)
      host.removeEventListener("pointerdown", hide)
    }
  }, [host])
  return (
    <Tooltip open={open && !!content}>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <slot />
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  )
}
