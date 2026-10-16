export type Person = { name: string; email: string; initials: string }

export type Order = {
  id: string
  customer: Person
  status: string
  channel: string
  items: number
  amount: number
  date: string
  notes?: string
}

export type Settings = {
  name: string
  email: string
  bio: string
  timezone: string
  emailAlerts: boolean
  pushAlerts: boolean
  weekly: boolean
  marketing: boolean
  density: string
  refresh: number
}

export type OrderQuery = {
  q: string
  status: string
  channel: string
  sort: string
  dir: string
  page: number
}

export type OrderPage = {
  rows: Order[]
  total: number
  page: number
  pages: number
  counts: Record<string, number>
}

export type KPIs = {
  revenue: number
  revenueDelta: number
  subscriptions: number
  subsDelta: number
  orders: number
  ordersDelta: number
  active: number
  activeDelta: number
}

export type Point = Record<string, string | number>

const firstNames = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Mateo", "Sofia", "Lucas", "Mia", "Leo", "Isla", "Hugo", "Chloe", "Arlo", "Nora", "Elias", "Maya", "Felix", "Zoe", "Iris"]
const lastNames = ["Martin", "Garcia", "Chen", "Patel", "Kim", "Silva", "Novak", "Rossi", "Müller", "Dubois", "Sato", "Lopez", "Nguyen", "Smith", "Costa"]
const statuses = ["paid", "paid", "paid", "pending", "processing", "refunded", "failed"]
const channels = ["Online store", "Marketplace", "Retail", "Wholesale"]

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => [...part][0]!.toUpperCase())
    .join("")
}

export function defaultSettings(): Settings {
  return {
    name: "Guillem",
    email: "guillem@acme.dev",
    bio: "Building dashboards with Datastar and shadcn.",
    timezone: "europe-madrid",
    emailAlerts: true,
    pushAlerts: false,
    weekly: true,
    marketing: false,
    density: "comfortable",
    refresh: 2,
  }
}

const compare = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0)

export class Store {
  private orders: Order[] = []
  private seq = 0
  private settings = defaultSettings()
  private rng = seeded(42)

  constructor() {
    const now = Date.now()
    for (let i = 0; i < 87; i++) {
      this.orders.push(this.randomOrder(now - i * 7 * HOUR - Math.floor(this.rng() * 300) * 60_000))
    }
  }

  private int(n: number) {
    return Math.floor(this.rng() * n)
  }

  private pick<T>(list: T[]) {
    return list[this.int(list.length)]!
  }

  private randomPerson(): Person {
    const first = this.pick(firstNames)
    const last = this.pick(lastNames)
    const name = `${first} ${last}`
    return { name, email: `${first}.${last}`.toLowerCase() + "@example.com", initials: initials(name) }
  }

  private nextID() {
    this.seq++
    return `ORD-${String(1000 + this.seq).padStart(4, "0")}`
  }

  private randomOrder(at: number): Order {
    return {
      id: this.nextID(),
      customer: this.randomPerson(),
      status: this.pick(statuses),
      channel: this.pick(channels),
      items: 1 + this.int(6),
      amount: Math.round((20 + this.rng() * 980) * 100) / 100,
      date: new Date(at).toISOString(),
    }
  }

  query(q: Partial<OrderQuery>, pageSize = 10): OrderPage {
    const needle = (q.q ?? "").trim().toLowerCase()
    const counts: Record<string, number> = {}
    const rows: Order[] = []
    for (const o of this.orders) {
      if (needle && !`${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(needle)) continue
      if (q.channel && q.channel !== "all" && o.channel !== q.channel) continue
      counts.all = (counts.all ?? 0) + 1
      counts[o.status] = (counts[o.status] ?? 0) + 1
      if (q.status && q.status !== "all" && o.status !== q.status) continue
      rows.push(o)
    }
    const key = (o: Order): string | number => {
      switch (q.sort) {
        case "customer":
          return o.customer.name
        case "amount":
          return o.amount
        case "status":
          return o.status
        case "id":
          return o.id
        default:
          return o.date
      }
    }
    const sign = q.dir === "asc" ? 1 : -1
    rows.sort((a, b) => sign * compare(key(a), key(b)))
    const pages = Math.max(1, Math.ceil(rows.length / pageSize))
    const page = Math.min(Math.max(1, Number(q.page) || 1), pages)
    const start = (page - 1) * pageSize
    return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pages, counts }
  }

  get(id: string) {
    return this.orders.find((o) => o.id === id)
  }

  update(id: string, fn: (o: Order) => void) {
    const o = this.get(id)
    if (o) fn(o)
    return o
  }

  delete(id: string) {
    const n = this.orders.length
    this.orders = this.orders.filter((o) => o.id !== id)
    return this.orders.length !== n
  }

  create(name: string, email: string, status: string, channel: string, amount: number, notes: string) {
    const o: Order = {
      id: this.nextID(),
      customer: { name, email, initials: initials(name) },
      status,
      channel,
      items: 1,
      amount,
      date: new Date().toISOString(),
      ...(notes ? { notes } : {}),
    }
    this.orders.unshift(o)
    return o
  }

  simulateSale() {
    const o = this.randomOrder(Date.now())
    o.status = "paid"
    this.orders.unshift(o)
    return o
  }

  recent(n: number) {
    return [...this.orders].sort((a, b) => compare(b.date, a.date)).slice(0, n)
  }

  getSettings(): Settings {
    return { ...this.settings }
  }

  saveSettings(v: Settings) {
    this.settings = { ...v }
  }

  kpis(): KPIs {
    const revenue = this.orders.reduce((sum, o) => (o.status === "paid" ? sum + o.amount : sum), 0)
    const jitter = (base: number, spread: number) => base + (this.rng() - 0.5) * spread
    return {
      revenue: revenue + 38_000,
      revenueDelta: jitter(12.4, 1.5),
      subscriptions: 2_350 + this.orders.length,
      subsDelta: jitter(18.1, 2),
      orders: this.orders.length,
      ordersDelta: jitter(-4.2, 1.2),
      active: 420 + this.int(160),
      activeDelta: jitter(6.0, 4),
    }
  }

  revenue(range: string): Point[] {
    const days = ({ "7d": 7, "30d": 30, "90d": 90 } as Record<string, number>)[range] ?? 30
    const r = seeded(days * 99)
    const now = Date.now()
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    const out: Point[] = []
    for (let i = days - 1; i >= 0; i--) {
      const gross = Math.round(2600 + Math.sin(i / 4) * 600 + r() * 1400)
      out.push({ label: fmt.format(now - i * DAY), revenue: gross, refunds: Math.round(gross * (0.04 + r() * 0.06)) })
    }
    return out
  }

  channels(): Point[] {
    const r = seeded(33)
    const int = (n: number) => Math.floor(r() * n)
    return ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((label) => ({
      label,
      online: 1800 + int(1600),
      retail: 900 + int(900),
      market: 500 + int(700),
    }))
  }
}
