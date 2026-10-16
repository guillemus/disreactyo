import { html, json, type Html } from "./html"
import type { KPIs, Order, OrderPage, OrderQuery, Person, Point } from "./store"

export type NavItem = { label: string; href: string; icon?: string; badge?: string }
export type NavGroup = { label?: string; items: NavItem[] }
export type Crumb = { label: string; href?: string }
export type MenuItem = {
  value?: string
  label?: string
  icon?: string
  shortcut?: string
  destructive?: boolean
  separator?: boolean
  heading?: string
}
export type Option = { value: string; label: string; description?: string; icon?: string }
export type Column = {
  key: string
  label: string
  type?: string
  align?: string
  sortable?: boolean
  tones?: Record<string, string>
}
export type Tab = { value: string; label: string; icon?: string; count?: number }

export type Layout = {
  title: string
  path: string
  dark: boolean
  nav: NavGroup[]
  crumbs: Crumb[]
  user: Person
  userMenu: MenuItem[]
}

const group = (n: number | string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
export const money = (v: number) => "$" + group(Math.round(v))
export const pct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%"
export const trend = (v: number) => (v < 0 ? "down" : "up")
export const num = (v: number) => group(v)
export const title = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s)
export const fixed = (v: number) => v.toFixed(2)

export function ago(iso: string) {
  const d = Date.now() - Date.parse(iso)
  if (d < 60_000) return "just now"
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
export const date = (iso: string) => `${dateFmt.format(new Date(iso))} · ${timeFmt.format(new Date(iso))}`

export const statusTones: Record<string, string> = {
  paid: "success",
  pending: "warning",
  processing: "info",
  refunded: "secondary",
  failed: "destructive",
}

export const orderColumns: Column[] = [
  { key: "id", label: "Order", type: "mono", sortable: true },
  { key: "customer", label: "Customer", type: "person", sortable: true },
  { key: "status", label: "Status", type: "badge", sortable: true, tones: statusTones },
  { key: "channel", label: "Channel" },
  { key: "date", label: "Date", type: "date", sortable: true },
  { key: "amount", label: "Amount", type: "money", align: "right", sortable: true },
]

export const orderActions: MenuItem[] = [
  { value: "view", label: "View details", icon: "eye" },
  { value: "paid", label: "Mark as paid", icon: "check" },
  { value: "refund", label: "Refund", icon: "undo" },
  { separator: true },
  { value: "delete", label: "Delete", icon: "trash", destructive: true },
]

export const statusOptions: Option[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
]

export const channelOptions: Option[] = [
  { value: "Online store", label: "Online store", icon: "cart" },
  { value: "Marketplace", label: "Marketplace", icon: "box" },
  { value: "Retail", label: "Retail", icon: "home" },
  { value: "Wholesale", label: "Wholesale", icon: "package" },
]

export const channelFilter: Option[] = [{ value: "all", label: "All channels" }, ...channelOptions]

export const statusTabs = (counts: Record<string, number>): Tab[] =>
  [
    ["all", "All"],
    ["paid", "Paid"],
    ["pending", "Pending"],
    ["processing", "Processing"],
    ["refunded", "Refunded"],
    ["failed", "Failed"],
  ].map(([value, label]) => ({ value: value!, label: label!, count: counts[value!] ?? 0 }))

export function layout(l: Layout, content: Html) {
  return html`<!doctype html>
<html lang="en" class="${l.dark ? "dark" : ""}" data-signals:dark="${String(l.dark)}" data-class:dark="$dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${l.title} · Acme</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono&display=swap" />
    <style>html:not(.ready) body{visibility:hidden;animation:reveal 0s 3s forwards}@keyframes reveal{to{visibility:visible}}</style>
    <link rel="stylesheet" href="/static/app.css" />
    <script type="module" src="/static/app.js" blocking="render"></script>
  </head>
  <body class="min-h-svh bg-background font-sans antialiased">
    <div class="flex min-h-svh">
      <ui-sidebar
        class="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border md:block"
        brand="Acme Inc."
        tagline="Datastar × shadcn"
        active="${l.path}"
        groups="${json(l.nav)}"
        user="${json(l.user)}"
        menu="${json(l.userMenu)}"
        data-on:select="@post('/api/menu/' + evt.detail.value)"
      ></ui-sidebar>
      <div class="flex min-w-0 flex-1 flex-col bg-muted/40">
        <header data-signals:search="''" class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <ui-breadcrumb items="${json(l.crumbs)}"></ui-breadcrumb>
          <div class="ml-auto flex items-center gap-1">
            <ui-input
              class="mr-2 hidden w-64 lg:block"
              icon="search"
              placeholder="Search orders… ⏎"
              data-bind="search"
              data-on:submit="window.location.href = '/orders?q=' + encodeURIComponent($search)"
            ></ui-input>
            <ui-tooltip content="Toggle theme">
              <ui-button
                variant="ghost"
                size="icon"
                data-attr:icon="$dark ? 'sun' : 'moon'"
                data-on:click="$dark = !$dark; @post('/api/theme')"
              ></ui-button>
            </ui-tooltip>
            <ui-tooltip content="Notifications" side="bottom">
              <ui-button variant="ghost" size="icon" icon="bell" data-on:click="@post('/api/notifications')"></ui-button>
            </ui-tooltip>
          </div>
        </header>
        <main class="flex-1 p-4 md:p-6">${content}</main>
      </div>
    </div>
    <ui-toaster></ui-toaster>
  </body>
</html>`
}

export type Goal = { label: string; value: number; hint: string }

export type OverviewData = {
  kpis: KPIs
  range: string
  revenue: Point[]
  recent: Order[]
  channels: Point[]
  goals: Goal[]
}

export const kpisFragment = (k: KPIs) => html`
<ui-stat id="kpi-revenue" icon="dollar" label="Total revenue" value="${money(k.revenue)}" delta="${pct(k.revenueDelta)}" trend="${trend(k.revenueDelta)}" hint="Trending up this month"></ui-stat>
<ui-stat id="kpi-subs" icon="users" label="Subscriptions" value="+${num(k.subscriptions)}" delta="${pct(k.subsDelta)}" trend="${trend(k.subsDelta)}" hint="Strong user retention"></ui-stat>
<ui-stat id="kpi-orders" icon="cart" label="Orders" value="${num(k.orders)}" delta="${pct(k.ordersDelta)}" trend="${trend(k.ordersDelta)}" hint="Acquisition needs attention"></ui-stat>
<ui-stat id="kpi-active" icon="activity" label="Active now" value="${k.active}" delta="${pct(k.activeDelta)}" trend="${trend(k.activeDelta)}" hint="Users in the last 5 minutes"></ui-stat>`

export const revenueChart = (points: Point[]) => html`
<ui-area-chart
  id="revenue-chart"
  height="280"
  prefix="$"
  legend
  points="${json(points)}"
  series='[{"key":"revenue","label":"Revenue","color":"var(--chart-1)"},{"key":"refunds","label":"Refunds","color":"var(--chart-2)"}]'
></ui-area-chart>`

export const recentSales = (orders: Order[]) => html`
<ul id="recent-sales" class="grid gap-5">
  ${orders.map(
    (o) => html`
  <li id="sale-${o.id}" class="flex items-center gap-4">
    <ui-avatar fallback="${o.customer.initials}"></ui-avatar>
    <div class="grid min-w-0 flex-1 leading-tight">
      <span class="truncate text-sm font-medium">${o.customer.name}</span>
      <span class="truncate text-xs text-muted-foreground">${o.customer.email} · ${ago(o.date)}</span>
    </div>
    <span class="text-sm font-medium tabular-nums">+$${fixed(o.amount)}</span>
  </li>`,
  )}
</ul>`

export const overviewPage = (d: OverviewData) => html`
<div class="mx-auto grid max-w-7xl gap-6" data-signals:range="'${d.range}'" data-init="@get('/api/overview/live')">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-sm text-muted-foreground">Every widget is a shadcn React component inside a Rocket web component. Datastar streams the data.</p>
    </div>
    <div class="flex items-center gap-2">
      <ui-tooltip content="KPIs are pushed over a long-lived SSE stream">
        <ui-badge variant="success" icon="activity">Live</ui-badge>
      </ui-tooltip>
      <ui-button variant="outline" icon="download" data-indicator="exporting" data-attr:loading="$exporting" data-on:click="@post('/api/export')">Export</ui-button>
      <ui-button icon="plus" href="/orders">New order</ui-button>
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${kpisFragment(d.kpis)}</div>

  <div class="grid gap-4 lg:grid-cols-7">
    <ui-card class="lg:col-span-4" heading="Revenue" description="Gross revenue vs. refunds">
      <ui-toggle-group
        slot="action"
        value="${d.range}"
        options='[{"value":"7d","label":"7 days"},{"value":"30d","label":"30 days"},{"value":"90d","label":"90 days"}]'
        data-on:change="$range = evt.detail.value; @get('/api/overview/revenue')"
      ></ui-toggle-group>
      ${revenueChart(d.revenue)}
    </ui-card>
    <ui-card class="lg:col-span-3" heading="Recent sales" description="A new sale lands every few seconds.">
      ${recentSales(d.recent)}
    </ui-card>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <ui-card heading="Sales by channel" description="Last 6 months">
      <ui-bar-chart
        height="240"
        stacked
        legend
        points="${json(d.channels)}"
        series='[{"key":"online","label":"Online"},{"key":"retail","label":"Retail"},{"key":"market","label":"Marketplace"}]'
      ></ui-bar-chart>
    </ui-card>
    <ui-card heading="Quarterly goals" description="Q4 2026">
      <div class="grid gap-5">
        ${d.goals.map((g) => html`<ui-progress label="${g.label}" value="${g.value}" hint="${g.hint}"></ui-progress>`)}
      </div>
      <ui-button slot="footer" variant="outline" size="sm" icon="chart" full>View report</ui-button>
    </ui-card>
    <ui-card heading="System status" description="All systems operational">
      <ui-badge slot="action" variant="success" icon="circle-check">Healthy</ui-badge>
      <div class="grid gap-3">
        <ui-alert heading="Deploy finished" icon="circle-check">v2.14.0 rolled out to all regions 12 minutes ago.</ui-alert>
        <ui-alert heading="Elevated latency" icon="warning" variant="destructive">p99 for eu-west-1 checkout is 820ms.</ui-alert>
        <ui-separator></ui-separator>
        <div class="flex flex-wrap gap-2">
          <ui-badge variant="success">API</ui-badge>
          <ui-badge variant="success">Payments</ui-badge>
          <ui-badge variant="warning">Search</ui-badge>
          <ui-badge variant="secondary">Webhooks</ui-badge>
          <ui-badge variant="outline">CDN</ui-badge>
        </div>
      </div>
    </ui-card>
  </div>
</div>`

export type OrdersData = {
  signals?: Record<string, unknown>
  page: OrderPage
  query: OrderQuery
  tabs: Tab[]
}

export const ordersTabs = (d: OrdersData) => html`
<ui-tabs
  id="orders-tabs"
  value="${d.query.status}"
  tabs="${json(d.tabs)}"
  data-on:change="$status = evt.detail.value; $page = 1; @get('/api/orders')"
></ui-tabs>`

export const ordersTable = (d: OrdersData) => html`
<ui-data-table
  id="orders-table"
  columns="${json(orderColumns)}"
  rows="${json(d.page.rows)}"
  actions="${json(orderActions)}"
  sort="${d.query.sort}"
  dir="${d.query.dir}"
  empty="No orders match your filters."
  data-on:sort="$sort = evt.detail.key; $dir = evt.detail.dir; @get('/api/orders')"
  data-on:rowclick="@get('/api/orders/' + evt.detail.id)"
  data-on:action="@post('/api/orders/' + evt.detail.id + '/' + evt.detail.action)"
></ui-data-table>`

export const ordersPagination = (d: OrdersData) => html`
<ui-pagination
  id="orders-pagination"
  page="${d.page.page}"
  pages="${d.page.pages}"
  summary="Showing ${d.page.rows.length} of ${d.page.total} orders"
  data-on:page="$page = evt.detail.value; @get('/api/orders')"
></ui-pagination>`

export const ordersPage = (d: OrdersData) => html`
<div class="mx-auto grid max-w-7xl gap-6" data-signals="${json(d.signals)}">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>
      <p class="text-sm text-muted-foreground">Search, filter, sort and paginate — all on the server, patched over SSE.</p>
    </div>
    <div class="flex items-center gap-2">
      <ui-dropdown-menu
        label="Export"
        icon="download"
        items='[{"heading":"Format"},{"value":"csv","label":"CSV","icon":"download"},{"value":"xlsx","label":"Excel","icon":"download"},{"separator":true},{"value":"email","label":"Email me a copy","icon":"mail"}]'
        data-on:select="@post('/api/export')"
      ></ui-dropdown-menu>
      <ui-button icon="plus" data-on:click="$errors = {customer: '', email: '', amount: ''}; $newOrder = true">New order</ui-button>
    </div>
  </div>

  <ui-card>
    <div class="grid gap-4">
      <div class="flex flex-wrap items-center gap-3">
        ${ordersTabs(d)}
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <ui-select
            size="sm"
            options="${json(channelFilter)}"
            data-bind="channel"
            data-on:change="$page = 1; @get('/api/orders')"
          ></ui-select>
          <ui-input
            class="w-64"
            icon="search"
            placeholder="Filter by customer or ID…"
            data-bind="q"
            data-on:input__debounce.250ms="$page = 1; @get('/api/orders')"
          ></ui-input>
        </div>
      </div>
      ${ordersTable(d)}
      ${ordersPagination(d)}
    </div>
  </ui-card>

  <ui-dialog
    heading="Create order"
    description="Validated on the server. Errors come back as signals."
    data-attr:open="$newOrder"
    data-on:openchange="$newOrder = evt.detail.value"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <ui-input label="Customer name" placeholder="Jane Cooper" data-bind="form.customer" data-attr:error="$errors.customer"></ui-input>
      <ui-input label="Email" type="email" placeholder="jane@example.com" data-bind="form.email" data-attr:error="$errors.email"></ui-input>
      <ui-input label="Amount (USD)" type="number" placeholder="249.00" icon="dollar" data-bind="form.amount" data-attr:error="$errors.amount"></ui-input>
      <ui-select label="Status" full options="${json(statusOptions)}" data-bind="form.status"></ui-select>
      <ui-select class="sm:col-span-2" label="Channel" full options="${json(channelOptions)}" data-bind="form.channel"></ui-select>
      <ui-textarea class="sm:col-span-2" label="Notes" placeholder="Optional internal notes" data-bind="form.notes"></ui-textarea>
    </div>
    <ui-button slot="footer" variant="outline" data-on:click="$newOrder = false">Cancel</ui-button>
    <ui-button slot="footer" icon="check" data-indicator="saving" data-attr:loading="$saving" data-on:click="@post('/api/orders')">Create order</ui-button>
  </ui-dialog>

  <ui-sheet
    heading="Order details"
    description="Loaded on demand from the server."
    data-attr:open="$sheetOpen"
    data-on:openchange="$sheetOpen = evt.detail.value"
  >
    <div id="order-detail"></div>
    <div id="order-actions" slot="footer"></div>
  </ui-sheet>
</div>`

export type OrderDetail = Order & { fulfillment: number }

export const orderDetail = (o: OrderDetail) => html`
<div id="order-detail" class="grid gap-6">
  <div class="flex items-center gap-4">
    <ui-avatar size="lg" fallback="${o.customer.initials}"></ui-avatar>
    <div class="grid flex-1 leading-tight">
      <span class="font-medium">${o.customer.name}</span>
      <span class="text-sm text-muted-foreground">${o.customer.email}</span>
    </div>
    <ui-badge variant="${statusTones[o.status]}">${title(o.status)}</ui-badge>
  </div>
  <ui-separator></ui-separator>
  <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
    <dt class="text-muted-foreground">Order</dt><dd class="text-right font-mono">${o.id}</dd>
    <dt class="text-muted-foreground">Placed</dt><dd class="text-right">${date(o.date)}</dd>
    <dt class="text-muted-foreground">Channel</dt><dd class="text-right">${o.channel}</dd>
    <dt class="text-muted-foreground">Items</dt><dd class="text-right">${o.items}</dd>
    <dt class="text-muted-foreground">Total</dt><dd class="text-right text-base font-semibold">$${fixed(o.amount)}</dd>
  </dl>
  <ui-progress label="Fulfillment" value="${o.fulfillment}"></ui-progress>
  ${o.notes && html`<ui-alert heading="Notes" icon="info">${o.notes}</ui-alert>`}
  ${o.status === "failed" && html`<ui-alert heading="Payment failed" icon="circle-alert" variant="destructive">The card was declined. Ask the customer to retry.</ui-alert>`}
</div>`

export const orderActionsFragment = (o: OrderDetail) => html`
<div id="order-actions" slot="footer" class="grid gap-2">
  ${o.status !== "paid" && html`<ui-button icon="check" full data-on:click="@post('/api/orders/${o.id}/paid')">Mark as paid</ui-button>`}
  ${o.status === "paid" && html`<ui-button variant="outline" icon="undo" full data-on:click="@post('/api/orders/${o.id}/refund')">Refund</ui-button>`}
  <ui-button variant="destructive" icon="trash" full data-on:click="@post('/api/orders/${o.id}/delete')">Delete order</ui-button>
</div>`

export type SettingsData = {
  signals: Record<string, unknown>
  timezones: Option[]
  densities: Option[]
  tabs: Tab[]
}

export const settingsPage = (d: SettingsData) => html`
<div class="mx-auto grid max-w-4xl gap-6" data-signals="${json(d.signals)}">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
    <p class="text-sm text-muted-foreground">Every control is two-way bound to a Datastar signal with <code>data-bind</code>.</p>
  </div>

  <ui-tabs tabs="${json(d.tabs)}" data-bind="tab">
    <div slot="profile">
      <ui-card heading="Profile" description="This is how others will see you.">
        <div class="grid gap-5 sm:grid-cols-2">
          <ui-input label="Display name" data-bind="settings.name"></ui-input>
          <ui-input label="Email" type="email" icon="mail" data-bind="settings.email" description="Used for receipts and alerts."></ui-input>
          <ui-select class="sm:col-span-2" label="Timezone" full options="${json(d.timezones)}" data-bind="settings.timezone"></ui-select>
          <ui-textarea class="sm:col-span-2" label="Bio" rows="4" data-bind="settings.bio"></ui-textarea>
        </div>
        <ui-button slot="footer" data-indicator="saving" data-attr:loading="$saving" data-on:click="@post('/api/settings')">Save profile</ui-button>
        <ui-button slot="footer" variant="ghost" data-on:click="window.location.reload()">Discard</ui-button>
      </ui-card>
    </div>

    <div slot="notifications">
      <ui-card heading="Notifications" description="Choose what we ping you about.">
        <div class="grid gap-6">
          <ui-switch label="Email alerts" description="Failed payments, refunds and disputes." data-bind="settings.emailAlerts"></ui-switch>
          <ui-separator></ui-separator>
          <ui-switch label="Push notifications" description="Real-time alerts on your devices." data-bind="settings.pushAlerts"></ui-switch>
          <ui-separator></ui-separator>
          <ui-checkbox label="Weekly digest" description="A Monday summary of last week's numbers." data-bind="settings.weekly"></ui-checkbox>
          <ui-checkbox label="Product updates" description="Occasional news about new features." data-bind="settings.marketing"></ui-checkbox>
        </div>
        <ui-button slot="footer" data-indicator="saving" data-attr:loading="$saving" data-on:click="@post('/api/settings')">Save preferences</ui-button>
      </ui-card>
    </div>

    <div slot="appearance">
      <ui-card heading="Appearance" description="Tune the dashboard to your taste.">
        <div class="grid gap-8">
          <ui-switch label="Dark mode" description="Synced to a cookie so the server renders the right theme." data-bind="dark" data-on:change="@post('/api/theme')"></ui-switch>
          <ui-radio-group label="Density" options="${json(d.densities)}" data-bind="settings.density"></ui-radio-group>
          <ui-slider label="Live refresh interval" min="1" max="10" suffix="s" data-bind="settings.refresh"></ui-slider>
        </div>
        <ui-button slot="footer" data-indicator="saving" data-attr:loading="$saving" data-on:click="@post('/api/settings')">Save appearance</ui-button>
      </ui-card>
    </div>
  </ui-tabs>

  <ui-card heading="Danger zone" description="Irreversible actions.">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <p class="text-sm text-muted-foreground">Reset every preference back to its default value.</p>
      <ui-button variant="destructive" icon="undo" data-on:click="$confirmReset = true">Reset settings</ui-button>
    </div>
  </ui-card>

  <ui-dialog
    size="sm"
    heading="Reset all settings?"
    description="Your profile, notifications and appearance will be restored to defaults."
    data-attr:open="$confirmReset"
    data-on:openchange="$confirmReset = evt.detail.value"
  >
    <ui-button slot="footer" variant="outline" data-on:click="$confirmReset = false">Cancel</ui-button>
    <ui-button slot="footer" variant="destructive" data-on:click="@post('/api/settings')">Yes, reset</ui-button>
  </ui-dialog>
</div>`
