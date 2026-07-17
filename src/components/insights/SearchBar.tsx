interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onOpenFilters: () => void
  activeFilterCount: number
}

export function SearchBar({ value, onChange, onOpenFilters, activeFilterCount }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex-1 h-12 bg-surface border border-border rounded-2xl flex items-center px-4 gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="11" cy="11" r="7" stroke="#616161" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="#616161" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search category, amount, notes..."
          className="flex-1 bg-transparent text-white text-[14px] placeholder:text-tertiary"
        />
      </div>
      <button
        type="button"
        onClick={onOpenFilters}
        className="relative w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0"
        aria-label="Filters"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M7 12h10M10 18h4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-black text-[10px] font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  )
}
