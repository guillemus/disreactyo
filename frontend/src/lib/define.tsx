import type { ReactNode } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import {
  rocket,
  type CodecRegistry,
  type InferProps,
  type PropDefs,
  type RocketHostWithProps,
  type RocketManifestEvent,
  type RocketManifestSlot,
} from "@/vendor/datastar-rocket.js"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PortalContainerContext } from "@/lib/portal"
import { currentTheme, onThemeChange } from "@/lib/theme"
import css from "../../../public/static/app.css"

const sheet = new CSSStyleSheet()
sheet.replaceSync(css)

const hostSheets = new Map<string, CSSStyleSheet>()
function hostSheet(display: string) {
  let s = hostSheets.get(display)
  if (!s) {
    s = new CSSStyleSheet()
    s.replaceSync(`:host{display:${display}}:host([hidden]){display:none}`)
    hostSheets.set(display, s)
  }
  return s
}

const extraSheets = new Map<string, CSSStyleSheet>()
function extraSheet(text: string) {
  let s = extraSheets.get(text)
  if (!s) {
    s = new CSSStyleSheet()
    s.replaceSync(text)
    extraSheets.set(text, s)
  }
  return s
}

const themed = new Set<HTMLElement>()
onThemeChange(() => {
  const dark = currentTheme() === "dark"
  themed.forEach((el) => el.classList.toggle("dark", dark))
})

const focusGuarded = new WeakSet<HTMLElement>()
function stopInnerFocusEvents(host: HTMLElement) {
  if (focusGuarded.has(host)) return
  focusGuarded.add(host)
  const stop = (e: Event) => {
    if (e.composedPath()[0] !== host) e.stopPropagation()
  }
  host.addEventListener("focusin", stop)
  host.addEventListener("focusout", stop)
}

const tags = new Set<string>()
let booting = true

function nestedInHost(host: HTMLElement) {
  for (let el = host.parentElement; el; el = el.parentElement) {
    if (tags.has(el.localName)) return true
  }
  return false
}

type Mounted = { root: Root; container: HTMLElement; portal: HTMLElement; timer?: number }
const mounted = new WeakMap<HTMLElement, Mounted>()

export type Emit = (type: string, detail?: unknown) => void

export type ElementContext<P extends Record<string, any>> = {
  props: P
  host: RocketHostWithProps<P>
  emit: Emit
  update: <K extends keyof P & string>(name: K, value: P[K], event?: string) => void
}

type DefineOptions<Defs extends PropDefs> = {
  props?: (codecs: CodecRegistry) => Defs
  display?: string
  styles?: string[]
  slots?: RocketManifestSlot[]
  events?: RocketManifestEvent[]
  render: (ctx: ElementContext<InferProps<Defs>>) => ReactNode
}

export function define<Defs extends PropDefs>(tag: string, options: DefineOptions<Defs>) {
  const { display = "block", styles = [], render } = options
  tags.add(tag)
  rocket(tag, {
    mode: "open",
    props: options.props,
    renderOnPropChange: false,
    manifest: { slots: options.slots, events: options.events },
    setup({ host, props, observeProps, emit, cleanup, apply }) {
      const shadow = host.shadowRoot!
      let m = mounted.get(host)
      if (m) {
        clearTimeout(m.timer)
      } else {
        shadow.adoptedStyleSheets = [sheet, hostSheet(display), ...styles.map(extraSheet)]
        const container = document.createElement("div")
        container.className = "ui-root contents"
        const portal = document.createElement("div")
        portal.className = "ui-portal contents"
        shadow.replaceChildren(container, portal)
        m = { root: createRoot(container), container, portal }
        mounted.set(host, m)
        stopInnerFocusEvents(host)
        if (booting) {
          setTimeout(() => (booting = false))
          if (!nestedInHost(host)) {
            queueMicrotask(() => {
              for (const child of host.children) apply(child as HTMLElement, false)
            })
          }
        }
      }
      const { root, container, portal } = m
      const dark = currentTheme() === "dark"
      for (const el of [container, portal]) {
        el.classList.toggle("dark", dark)
        themed.add(el)
      }

      const emitEvent: Emit = (type, detail) =>
        detail === undefined ? emit(type) : emit(type, detail)
      const update: ElementContext<InferProps<Defs>>["update"] = (name, value, event = "change") => {
        ;(host as any)[name] = value
        emitEvent(event, { value })
      }

      const draw = () =>
        root.render(
          <PortalContainerContext.Provider value={portal}>
            <TooltipProvider delayDuration={150}>
              {render({ props: { ...props }, host, emit: emitEvent, update })}
            </TooltipProvider>
          </PortalContainerContext.Provider>,
        )
      const paint = () => (booting ? flushSync(draw) : draw())
      paint()
      observeProps(paint)
      const children = new MutationObserver(paint)
      children.observe(host, { childList: true })

      cleanup(() => {
        children.disconnect()
        const current = m!
        current.timer = window.setTimeout(() => {
          themed.delete(current.container)
          themed.delete(current.portal)
          current.root.unmount()
          mounted.delete(host)
          shadow.replaceChildren()
        }, 0)
      })
    },
  })
}
