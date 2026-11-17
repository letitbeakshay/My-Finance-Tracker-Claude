import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type EntryMode = 'expense' | 'income'

/** Switch the entry screen between adding an expense and adding income. */
export function EntryModeToggle({ value, onChange }: { value: EntryMode; onChange: (mode: EntryMode) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as EntryMode)}>
      <TabsList aria-label="What are you adding?" className="w-full h-12">
        <TabsTrigger value="expense">
          <ArrowUpRight size={16} /> Expense
        </TabsTrigger>
        <TabsTrigger value="income">
          <ArrowDownLeft size={16} /> Income
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
