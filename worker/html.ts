export class Html {
  constructor(readonly value: string) {}
  toString() {
    return this.value
  }
}

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

export const escape = (s: string) => s.replace(/[&<>"']/g, (c) => entities[c]!)

export const raw = (s: string) => new Html(s)

function render(v: unknown): string {
  if (v == null || v === false) return ""
  if (v instanceof Html) return v.value
  if (Array.isArray(v)) return v.map(render).join("")
  return escape(String(v))
}

export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  let out = strings[0]!
  values.forEach((v, i) => {
    out += render(v) + strings[i + 1]
  })
  return new Html(out)
}

export const json = (v: unknown) => JSON.stringify(v)
