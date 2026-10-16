import { useId, type ReactNode } from "react"
import { define } from "@/lib/define"
import { Icon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Option = { value: string; label: string; description?: string; icon?: string }

function Field({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string
  label?: string
  description?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      {label && (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        description && <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

define("ui-input", {
  props: ({ string, bool }) => ({
    value: string,
    type: string.default("text"),
    placeholder: string,
    label: string,
    description: string,
    error: string,
    icon: string,
    name: string,
    disabled: bool,
  }),
  events: [{ name: "input" }, { name: "change", kind: "custom-event" }],
  render: ({ props: p, host, update }) => <InputField p={p} host={host} update={update} />,
})

function InputField({ p, host, update }: any) {
  const id = useId()
  return (
    <Field id={id} label={p.label} description={p.description} error={p.error}>
      <div className="relative">
        {p.icon && (
          <Icon name={p.icon} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={p.type}
          name={p.name || undefined}
          value={p.value ?? ""}
          placeholder={p.placeholder}
          disabled={p.disabled}
          aria-invalid={!!p.error || undefined}
          className={cn(p.icon && "pl-8")}
          onChange={(e) => {
            host.value = e.target.value
          }}
          onBlur={() => update("value", host.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") host.dispatchEvent(new CustomEvent("submit", { bubbles: true, composed: true }))
          }}
        />
      </div>
    </Field>
  )
}

define("ui-textarea", {
  props: ({ string, number, bool }) => ({
    value: string,
    placeholder: string,
    label: string,
    description: string,
    error: string,
    rows: number.default(3),
    disabled: bool,
  }),
  render: ({ props: p, host, update }) => <TextareaField p={p} host={host} update={update} />,
})

function TextareaField({ p, host, update }: any) {
  const id = useId()
  return (
    <Field id={id} label={p.label} description={p.description} error={p.error}>
      <Textarea
        id={id}
        rows={p.rows}
        value={p.value ?? ""}
        placeholder={p.placeholder}
        disabled={p.disabled}
        aria-invalid={!!p.error || undefined}
        onChange={(e) => {
          host.value = e.target.value
        }}
        onBlur={() => update("value", host.value)}
      />
    </Field>
  )
}

define("ui-select", {
  props: ({ string, json, bool, oneOf }) => ({
    value: string,
    options: json.default([]),
    placeholder: string.default("Select…"),
    label: string,
    description: string,
    error: string,
    size: oneOf("default", "sm").default("default"),
    disabled: bool,
    full: bool,
  }),
  events: [{ name: "change", kind: "custom-event" }],
  render: ({ props: p, update }) => <SelectField p={p} update={update} />,
})

function SelectField({ p, update }: any) {
  const id = useId()
  return (
    <Field id={id} label={p.label} description={p.description} error={p.error}>
      <Select value={p.value || undefined} onValueChange={(v) => update("value", v)} disabled={p.disabled}>
        <SelectTrigger id={id} size={p.size} className={cn(p.full && "w-full")} aria-invalid={!!p.error || undefined}>
          <SelectValue placeholder={p.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {(p.options as Option[]).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <Icon name={o.icon} />
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

define("ui-switch", {
  props: ({ string, bool }) => ({ value: bool, label: string, description: string, disabled: bool }),
  render: ({ props: p, update }) => <SwitchField p={p} update={update} />,
})

function SwitchField({ p, update }: any) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>{p.label}</Label>
        {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
      </div>
      <Switch id={id} checked={!!p.value} disabled={p.disabled} onCheckedChange={(v) => update("value", v)} />
    </div>
  )
}

define("ui-checkbox", {
  props: ({ string, bool }) => ({ value: bool, label: string, description: string, disabled: bool }),
  render: ({ props: p, update }) => <CheckboxField p={p} update={update} />,
})

function CheckboxField({ p, update }: any) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={!!p.value} disabled={p.disabled} onCheckedChange={(v) => update("value", v === true)} />
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{p.label}</Label>
        {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
      </div>
    </div>
  )
}

define("ui-slider", {
  props: ({ string, number, bool }) => ({
    value: number,
    min: number.default(0),
    max: number.default(100),
    step: number.default(1),
    label: string,
    suffix: string,
    disabled: bool,
  }),
  render: ({ props: p, host, update }) => (
    <div className="grid gap-3">
      {p.label && (
        <div className="flex items-center justify-between text-sm">
          <Label>{p.label}</Label>
          <span className="text-muted-foreground tabular-nums">
            {p.value}
            {p.suffix}
          </span>
        </div>
      )}
      <Slider
        value={[Number(p.value) || 0]}
        min={p.min}
        max={p.max}
        step={p.step}
        disabled={p.disabled}
        onValueChange={([v]) => update("value", v, "input")}
        onValueCommit={([v]) => update("value", v)}
      />
    </div>
  ),
})

define("ui-radio-group", {
  props: ({ string, json }) => ({ value: string, options: json.default([]), label: string }),
  render: ({ props: p, update }) => <RadioField p={p} update={update} />,
})

function RadioField({ p, update }: any) {
  const id = useId()
  return (
    <div className="grid gap-3">
      {p.label && <Label>{p.label}</Label>}
      <RadioGroup value={p.value} onValueChange={(v) => update("value", v)}>
        {(p.options as Option[]).map((o) => (
          <div key={o.value} className="flex items-start gap-3">
            <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
            <div className="grid gap-1">
              <Label htmlFor={`${id}-${o.value}`}>{o.label}</Label>
              {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

define("ui-toggle-group", {
  display: "inline-flex",
  props: ({ string, json, oneOf }) => ({
    value: string,
    options: json.default([]),
    variant: oneOf("default", "outline").default("outline"),
    size: oneOf("default", "sm", "lg").default("sm"),
  }),
  render: ({ props: p, update }) => (
    <ToggleGroup
      type="single"
      variant={p.variant}
      size={p.size}
      value={p.value}
      onValueChange={(v) => v && update("value", v)}
    >
      {(p.options as Option[]).map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="px-3">
          <Icon name={o.icon} />
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
})
