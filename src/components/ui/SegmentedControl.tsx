import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Option<T extends string> {
  value: T
  label: string
  /** A status colour for the selected pill (for example need / want). */
  color?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

/** A pill switch built on the shadcn Tabs. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)} className="w-full">
      <TabsList className="w-full h-14">
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className="text-[15px]"
            style={value === opt.value && opt.color ? { background: opt.color, color: 'var(--color-on-type)' } : undefined}
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
