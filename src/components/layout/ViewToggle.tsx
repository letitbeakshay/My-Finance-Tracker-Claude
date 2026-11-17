import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '../ui/ThemeToggle'

export type View = 'enter' | 'data'

interface ViewToggleProps {
  value: View
  onChange: (view: View) => void
}

/** Sticky top bar with the Expense / Dashboard switch. Desktop only; phones use MobileNav. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="hidden md:block sticky top-0 z-[60] bg-bg/90 backdrop-blur-xl px-4 pb-2.5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
    >
      <div className="grid grid-cols-[1fr_380px_1fr] items-center">
        <div />
        <Tabs value={value} onValueChange={(v) => onChange(v as View)}>
          <TabsList className="w-full h-12">
            <TabsTrigger value="enter">Expense</TabsTrigger>
            <TabsTrigger value="data">Dashboard</TabsTrigger>
          </TabsList>
        </Tabs>
        <ThemeToggle className="justify-self-end" />
      </div>
    </div>
  )
}
