export function hasSlot(host: HTMLElement, name: string) {
  for (const child of host.children) {
    if (child.getAttribute("slot") === name) return true
  }
  return false
}
