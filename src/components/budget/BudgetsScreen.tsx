import { BudgetsView } from './BudgetsView'
import { PageHeader } from '../ui/PageHeader'

/** Full-screen budget setup for the Enter expenses flow (current month). */
export function BudgetsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="px-6 pt-3 pb-10 overflow-y-auto h-full">
      <PageHeader title="Budgets" onBack={onBack} />
      <BudgetsView month={new Date()} />
    </div>
  )
}
