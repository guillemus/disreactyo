import { useSyncExternalStore } from "react"

const listeners = new Set<() => void>()
const isDark = () => document.documentElement.classList.contains("dark")
let dark = isDark()

new MutationObserver(() => {
  const next = isDark()
  if (next === dark) return
  dark = next
  listeners.forEach((fn) => fn())
}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

export function onThemeChange(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function currentTheme() {
  return dark ? "dark" : "light"
}

export function useTheme() {
  const theme = useSyncExternalStore(onThemeChange, currentTheme)
  return { theme }
}
