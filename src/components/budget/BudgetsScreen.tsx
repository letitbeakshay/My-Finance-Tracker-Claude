import { BudgetsView } from './BudgetsView'

/** Full-screen budget setup for the Enter expenses flow (current month). */
export function BudgetsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="px-6 pt-3 pb-10 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold">Budgets</h1>
      </div>
      <BudgetsView month={new Date()} />
    </div>
  )
}
