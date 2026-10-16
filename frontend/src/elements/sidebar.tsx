import { ChevronsUpDown } from "lucide-react"
import { define } from "@/lib/define"
import { Icon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MenuItems } from "./overlays"

type NavItem = { label: string; href: string; icon?: string; badge?: string }
type NavGroup = { label?: string; items: NavItem[] }
type User = { name: string; email: string; initials: string }

define("ui-sidebar", {
  props: ({ string, json }) => ({
    brand: string,
    tagline: string,
    active: string,
    groups: json.default([]),
    user: json.default(null),
    menu: json.default([]),
  }),
  events: [{ name: "select", kind: "custom-event" }],
  render: ({ props: p, emit }) => {
    const user = p.user as User | null
    return (
      <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Icon name="zap" className="size-4" />
          </div>
          <div className="grid leading-tight">
            <span className="text-sm font-semibold">{p.brand}</span>
            <span className="text-xs text-muted-foreground">{p.tagline}</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {(p.groups as NavGroup[]).map((g, gi) => (
            <div key={gi} className="mb-4">
              {g.label && <div className="px-2 pb-1.5 text-xs font-medium text-sidebar-foreground/60">{g.label}</div>}
              <ul className="grid gap-0.5">
                {g.items.map((item) => {
                  const active = item.href === p.active
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        data-active={active || undefined}
                        className={cn(
                          "flex h-8 items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-4",
                          active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon name={item.icon} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        {user && (
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent">
                  <Avatar className="rounded-lg">
                    <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="min-w-56">
                <MenuItems items={p.menu} onSelect={(value) => emit("select", { value })} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
    )
  },
})
