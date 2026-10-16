import { Hono, type Context } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web"
import type { Html } from "./html"
import { defaultSettings, initials, Store, type Order, type OrderQuery, type Settings } from "./store"
import * as v from "./views"

type SSE = ServerSentEventGenerator

type OrderForm = { customer: string; email: string; amount: string; status: string; channel: string; notes: string }
type OrderErrors = { customer: string; email: string; amount: string }
type OrdersSignals = OrderQuery & { newOrder: boolean; sheetOpen: boolean; form: OrderForm; errors: OrderErrors }

const emptyForm = (): OrderForm => ({ customer: "", email: "", amount: "", status: "paid", channel: "Online store", notes: "" })
const noErrors = (): OrderErrors => ({ customer: "", email: "", amount: "" })

const fulfillment: Record<string, number> = { paid: 100, refunded: 100, processing: 60, pending: 20, failed: 0 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const userMenu: v.MenuItem[] = [
  { heading: "My account" },
  { value: "profile", label: "Profile", icon: "user", shortcut: "⇧⌘P" },
  { value: "billing", label: "Billing", icon: "credit-card" },
  { value: "settings", label: "Settings", icon: "settings", shortcut: "⌘," },
  { separator: true },
  { value: "logout", label: "Log out", icon: "logout", destructive: true },
]

const stream = (fn: (sse: SSE) => Promise<void> | void, onAbort?: () => void) =>
  ServerSentEventGenerator.stream(fn, { onAbort })

const patch = (sse: SSE, fragment: Html) => sse.patchElements(fragment.value.trim())

const patchSignals = (sse: SSE, signals: Record<string, unknown>) => sse.patchSignals(JSON.stringify(signals))

function toast(sse: SSE, type: string, title: string, description = "") {
  const detail = JSON.stringify({ type, title, ...(description ? { description } : {}) })
  sse.executeScript(
    `document.dispatchEvent(new CustomEvent("ui:toast",{bubbles:true,cancelable:true,composed:true,detail:${detail}}))`,
  )
}

async function readSignals<T>(req: Request): Promise<Partial<T>> {
  const result = await ServerSentEventGenerator.readSignals(req)
  return result.success ? (result.signals as Partial<T>) : {}
}

export function createApp(store: Store) {
  const app = new Hono()

  function render(c: Context, title: string, crumb: string, content: Html) {
    const settings = store.getSettings()
    const pending = store.query({ status: "pending" }).counts.pending ?? 0
    const page = v.layout(
      {
        title,
        path: new URL(c.req.url).pathname,
        dark: getCookie(c, "theme") === "dark",
        nav: [
          {
            label: "Platform",
            items: [
              { label: "Dashboard", href: "/", icon: "dashboard" },
              { label: "Orders", href: "/orders", icon: "cart", badge: String(pending) },
            ],
          },
          { label: "Workspace", items: [{ label: "Settings", href: "/settings", icon: "settings" }] },
        ],
        crumbs: [{ label: "Acme", href: "/" }, { label: crumb }],
        user: { name: settings.name, email: settings.email, initials: initials(settings.name) },
        userMenu,
      },
      content,
    )
    return c.html(page.value)
  }

  function ordersData(q: Partial<OrderQuery>): v.OrdersData {
    const page = store.query(q)
    const query: OrderQuery = {
      q: q.q ?? "",
      status: q.status || "all",
      channel: q.channel || "all",
      sort: q.sort || "date",
      dir: q.dir || "desc",
      page: page.page,
    }
    return { page, query, tabs: v.statusTabs(page.counts) }
  }

  function patchOrders(sse: SSE, sig: Partial<OrdersSignals>) {
    const data = ordersData(sig)
    patch(sse, v.ordersTable(data))
    patch(sse, v.ordersPagination(data))
    patch(sse, v.ordersTabs(data))
    if (data.query.page !== sig.page) patchSignals(sse, { page: data.query.page })
  }

  function patchOrder(sse: SSE, o: Order) {
    const d = { ...o, fulfillment: fulfillment[o.status] ?? 0 }
    patch(sse, v.orderDetail(d))
    patch(sse, v.orderActionsFragment(d))
  }

  function showOrder(sse: SSE, o: Order) {
    patchOrder(sse, o)
    patchSignals(sse, { sheetOpen: true })
  }

  app.get("/", (c) =>
    render(
      c,
      "Dashboard",
      "Dashboard",
      v.overviewPage({
        kpis: store.kpis(),
        range: "30d",
        revenue: store.revenue("30d"),
        recent: store.recent(6),
        channels: store.channels(),
        goals: [
          { label: "Revenue target", value: 72, hint: "$186k / $260k" },
          { label: "New customers", value: 54, hint: "1,080 / 2,000" },
          { label: "NPS", value: 88, hint: "+44 / +50" },
          { label: "Churn reduction", value: 31, hint: "1.2% / 4%" },
        ],
      }),
    ),
  )

  app.get("/orders", (c) => {
    const q: OrderQuery = { q: c.req.query("q") ?? "", status: "all", channel: "all", sort: "date", dir: "desc", page: 1 }
    const data = ordersData(q)
    data.signals = { ...q, newOrder: false, sheetOpen: false, form: emptyForm(), errors: noErrors() }
    return render(c, "Orders", "Orders", v.ordersPage(data))
  })

  app.get("/settings", (c) =>
    render(
      c,
      "Settings",
      "Settings",
      v.settingsPage({
        signals: { settings: store.getSettings(), tab: "profile", confirmReset: false },
        timezones: [
          { value: "europe-madrid", label: "Europe/Madrid (CET)" },
          { value: "europe-london", label: "Europe/London (GMT)" },
          { value: "america-new-york", label: "America/New York (EST)" },
          { value: "america-los-angeles", label: "America/Los Angeles (PST)" },
          { value: "asia-tokyo", label: "Asia/Tokyo (JST)" },
        ],
        densities: [
          { value: "compact", label: "Compact", description: "Fit more rows on screen." },
          { value: "comfortable", label: "Comfortable", description: "The default balance." },
          { value: "spacious", label: "Spacious", description: "Extra breathing room." },
        ],
        tabs: [
          { value: "profile", label: "Profile", icon: "user" },
          { value: "notifications", label: "Notifications", icon: "bell" },
          { value: "appearance", label: "Appearance", icon: "sparkles" },
        ],
      }),
    ),
  )

  app.get("/api/overview/live", (c) => {
    let closed = false
    c.req.raw.signal.addEventListener("abort", () => (closed = true))
    return stream(
      async (sse) => {
        for (let tick = 1; !closed; tick++) {
          await sleep(Math.max(1, store.getSettings().refresh) * 1000)
          if (closed) return
          if (tick % 4 === 0) {
            const o = store.simulateSale()
            patch(sse, v.recentSales(store.recent(6)))
            toast(sse, "success", `New sale ${o.id}`, `${o.customer.name} paid $${v.fixed(o.amount)} via ${o.channel}`)
          }
          patch(sse, v.kpisFragment(store.kpis()))
        }
      },
      () => {
        closed = true
      },
    )
  })

  app.get("/api/overview/revenue", async (c) => {
    const sig = await readSignals<{ range: string }>(c.req.raw)
    return stream((sse) => {
      patch(sse, v.revenueChart(store.revenue(sig.range ?? "30d")))
    })
  })

  app.post("/api/export", (c) =>
    stream(async (sse) => {
      toast(sse, "info", "Export started", "Preparing your CSV…")
      await sleep(1500)
      toast(sse, "success", "Export ready", "orders-2026-10.csv (87 rows) has been emailed to you.")
    }),
  )

  app.post("/api/notifications", (c) =>
    stream((sse) => {
      toast(sse, "message", "You're all caught up", "No new notifications.")
    }),
  )

  app.get("/api/orders", async (c) => {
    const sig = await readSignals<OrdersSignals>(c.req.raw)
    return stream((sse) => patchOrders(sse, sig))
  })

  app.post("/api/orders", async (c) => {
    const sig = await readSignals<OrdersSignals>(c.req.raw)
    return stream(async (sse) => {
      await sleep(400)
      const f = { ...emptyForm(), ...sig.form }
      const errors = noErrors()
      if (!f.customer.trim()) errors.customer = "Customer name is required."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = "Enter a valid email address."
      const amount = Number(String(f.amount).trim())
      if (!String(f.amount).trim() || !Number.isFinite(amount) || amount <= 0) errors.amount = "Amount must be a positive number."
      if (errors.customer || errors.email || errors.amount) {
        patchSignals(sse, { errors })
        toast(sse, "error", "Couldn't create order", "Fix the highlighted fields and try again.")
        return
      }
      const o = store.create(f.customer.trim(), f.email.trim(), f.status, f.channel, amount, f.notes)
      const reset = { status: "all", sort: "date", dir: "desc", page: 1 }
      patchSignals(sse, { newOrder: false, form: emptyForm(), errors: noErrors(), ...reset })
      patchOrders(sse, { ...sig, ...reset })
      toast(sse, "success", `Order ${o.id} created`, `${o.customer.name} · $${v.fixed(o.amount)}`)
    })
  })

  app.get("/api/orders/:id", (c) => {
    const o = store.get(c.req.param("id"))
    if (!o) return c.notFound()
    return stream((sse) => showOrder(sse, o))
  })

  app.post("/api/orders/:id/:action", async (c) => {
    const sig = await readSignals<OrdersSignals>(c.req.raw)
    const { id, action } = c.req.param()
    return stream((sse) => {
      switch (action) {
        case "view": {
          const o = store.get(id)
          if (o) showOrder(sse, o)
          return
        }
        case "paid":
        case "refund": {
          const status = action === "paid" ? "paid" : "refunded"
          const o = store.update(id, (o) => {
            o.status = status
          })
          if (!o) return toast(sse, "error", "Order not found", id)
          if (sig.sheetOpen) patchOrder(sse, o)
          toast(sse, "success", `${id} marked as ${status}`)
          break
        }
        case "delete":
          if (!store.delete(id)) return toast(sse, "error", "Order not found", id)
          patchSignals(sse, { sheetOpen: false })
          toast(sse, "warning", `Order ${id} deleted`, "This cannot be undone.")
          break
        default:
          return toast(sse, "error", "Unknown action", action)
      }
      patchOrders(sse, sig)
    })
  })

  app.post("/api/settings", async (c) => {
    const sig = await readSignals<{ settings: Settings; confirmReset: boolean }>(c.req.raw)
    return stream((sse) => {
      if (sig.confirmReset) {
        const fresh = defaultSettings()
        store.saveSettings(fresh)
        patchSignals(sse, { settings: fresh, confirmReset: false })
        return toast(sse, "warning", "Settings reset", "Everything is back to defaults.")
      }
      const settings = { ...store.getSettings(), ...sig.settings }
      if (!settings.name.trim()) return toast(sse, "error", "Name can't be empty")
      store.saveSettings(settings)
      toast(sse, "success", "Settings saved", `Live dashboard refreshes every ${settings.refresh}s.`)
    })
  })

  app.post("/api/theme", async (c) => {
    const sig = await readSignals<{ dark: boolean }>(c.req.raw)
    setCookie(c, "theme", sig.dark ? "dark" : "light", { path: "/", maxAge: 365 * 24 * 3600, sameSite: "Lax" })
    return c.body(null, 204)
  })

  app.post("/api/menu/:item", (c) => {
    const item = c.req.param("item")
    return stream((sse) => {
      switch (item) {
        case "profile":
        case "settings":
          sse.executeScript(`setTimeout(() => window.location.href = "/settings")`)
          break
        case "billing":
          toast(sse, "info", "Billing", "You're on the Pro plan · renews Nov 16.")
          break
        case "logout":
          toast(sse, "warning", "Logged out", "Just kidding — this is a demo.")
          break
      }
    })
  })

  return app
}
