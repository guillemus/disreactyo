import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { CodecRegistry } from "@/vendor/datastar-rocket.js"
import { define } from "@/lib/define"
import { Icon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToneBadge } from "./primitives"
import { MenuItems } from "./overlays"

type Column = {
  key: string
  label: string
  type?: "text" | "badge" | "money" | "date" | "person" | "mono"
  align?: "left" | "right"
  sortable?: boolean
  tones?: Record<string, string>
}

type Row = Record<string, any> & { id: string }

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

function Cell({ col, row }: { col: Column; row: Row }) {
  const v = row[col.key]
  switch (col.type) {
    case "badge":
      return <ToneBadge tone={col.tones?.[v] ?? "outline"}>{String(v)}</ToneBadge>
    case "money":
      return <span className="tabular-nums">{money.format(Number(v))}</span>
    case "date":
      return <span className="text-muted-foreground">{date.format(new Date(v))}</span>
    case "mono":
      return <span className="font-mono text-xs">{String(v)}</span>
    case "person":
      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">{v?.initials}</AvatarFallback>
          </Avatar>
          <div className="grid leading-tight">
            <span className="font-medium">{v?.name}</span>
            <span className="text-xs text-muted-foreground">{v?.email}</span>
          </div>
        </div>
      )
    default:
      return <>{String(v ?? "")}</>
  }
}

define("ui-data-table", {
  props: ({ string, json, bool, number }) => ({
    columns: json.default([]),
    rows: json.default([]),
    actions: json.default([]),
    sort: string,
    dir: string.default("desc"),
    selectable: bool,
    selected: json.default([]),
    loading: bool,
    skeletonRows: number.default(8),
    empty: string.default("No results."),
  }),
  events: [
    { name: "sort", kind: "custom-event" },
    { name: "action", kind: "custom-event" },
    { name: "rowclick", kind: "custom-event" },
    { name: "change", kind: "custom-event" },
  ],
  render: ({ props: p, emit, update }) => {
    const columns = p.columns as Column[]
    const rows = p.rows as Row[]
    const selected = new Set(p.selected as string[])
    const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
    const setSelected = (ids: string[]) => update("selected", ids, "change")
    const colSpan = columns.length + (p.selectable ? 1 : 0) + (p.actions.length ? 1 : 0)
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {p.selectable && (
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allSelected ? true : selected.size ? "indeterminate" : false}
                    onCheckedChange={(v) => setSelected(v ? rows.map((r) => r.id) : [])}
                  />
                </TableHead>
              )}
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(c.align === "right" && "text-right")}>
                  {c.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("-mx-3", c.align === "right" && "ml-auto flex")}
                      onClick={() =>
                        emit("sort", { key: c.key, dir: p.sort === c.key && p.dir === "asc" ? "desc" : "asc" })
                      }
                    >
                      {c.label}
                      {p.sort === c.key ? (
                        p.dir === "asc" ? <ArrowUp /> : <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-40" />
                      )}
                    </Button>
                  ) : (
                    c.label
                  )}
                </TableHead>
              ))}
              {p.actions.length > 0 && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody className={cn("transition-opacity", p.loading && rows.length > 0 && "opacity-50")}>
            {p.loading && rows.length === 0 ? (
              Array.from({ length: p.skeletonRows }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                  {p.empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selected.has(row.id) ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => emit("rowclick", { id: row.id })}
                >
                  {p.selectable && (
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(v) =>
                          setSelected(v ? [...selected, row.id] : [...selected].filter((id) => id !== row.id))
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.align === "right" && "text-right")}>
                      <Cell col={c} row={row} />
                    </TableCell>
                  ))}
                  {p.actions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <Icon name="ellipsis" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <MenuItems items={p.actions} onSelect={(action) => emit("action", { action, id: row.id })} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  },
})

function pageWindow(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const out: (number | "…")[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pages - 1, page + 1)
  if (start > 2) out.push("…")
  for (let i = start; i <= end; i++) out.push(i)
  if (end < pages - 1) out.push("…")
  out.push(pages)
  return out
}

define("ui-pagination", {
  props: ({ number, string }) => ({ page: number.default(1), pages: number.default(1), summary: string }),
  events: [{ name: "page", kind: "custom-event" }],
  render: ({ props: p, emit }) => {
    const go = (n: number) => (e: React.MouseEvent) => {
      e.preventDefault()
      if (n >= 1 && n <= p.pages && n !== p.page) emit("page", { value: n })
    }
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm whitespace-nowrap text-muted-foreground">{p.summary}</p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={go(p.page - 1)}
                className={cn(p.page <= 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pageWindow(p.page, p.pages).map((n, i) => (
              <PaginationItem key={i}>
                {n === "…" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink href="#" isActive={n === p.page} onClick={go(n)}>
                    {n}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={go(p.page + 1)}
                className={cn(p.page >= p.pages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  },
})

type Series = { key: string; label: string; color?: string }

function configFor(series: Series[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: s.color ?? `var(--chart-${(i % 5) + 1})` }]),
  )
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

const chartProps = ({ string, json, number, bool }: CodecRegistry) => ({
  points: json.default([]),
  series: json.default([]),
  x: string.default("label"),
  height: number.default(260),
  stacked: bool,
  legend: bool,
  prefix: string,
})

define("ui-area-chart", {
  props: chartProps,
  render: ({ props: p }) => {
    const series = p.series as Series[]
    return (
      <ChartContainer config={configFor(series)} className="aspect-auto w-full" style={{ height: p.height }}>
        <AreaChart data={p.points} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.6} />
                <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={p.x} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `${p.prefix}${compact.format(v)}`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          {series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type="natural"
              fill={`url(#fill-${s.key})`}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              stackId={p.stacked ? "a" : undefined}
              isAnimationActive={false}
            />
          ))}
          {p.legend && <ChartLegend content={<ChartLegendContent />} />}
        </AreaChart>
      </ChartContainer>
    )
  },
})

define("ui-bar-chart", {
  props: chartProps,
  render: ({ props: p }) => {
    const series = p.series as Series[]
    return (
      <ChartContainer config={configFor(series)} className="aspect-auto w-full" style={{ height: p.height }}>
        <BarChart data={p.points} margin={{ left: 4, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={p.x} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `${p.prefix}${compact.format(v)}`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={`var(--color-${s.key})`}
              radius={p.stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) : 4}
              stackId={p.stacked ? "a" : undefined}
            />
          ))}
          {p.legend && <ChartLegend content={<ChartLegendContent />} />}
        </BarChart>
      </ChartContainer>
    )
  },
})
