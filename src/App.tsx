import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { HomeScreen } from './components/home/HomeScreen'
import { InsightsScreen } from './components/insights/InsightsScreen'
import { AddExpenseScreen } from './components/add/AddExpenseScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'
import { PasscodeGate } from './components/auth/PasscodeGate'
import { StewardshipScreen } from './components/stewardship/StewardshipScreen'
import { BudgetsScreen } from './components/budget/BudgetsScreen'
import type { AddExpensePreset } from './components/add/AddExpenseScreen'
import { AllDataScreen } from './components/data/AllDataScreen'
import { ViewToggle, type View } from './components/layout/ViewToggle'
import { MobileNav, type MobileDestination } from './components/layout/MobileNav'
import { ensureSeeded } from './db/seed'
import { isUnlocked } from './lib/auth'

type Route = Tab | 'add' | 'settings' | 'stewardship' | 'budgets'

/** The app always opens on Expense. `?view=data` opens the Dashboard (handy for a bookmark). */
function initialView(): View {
  return new URLSearchParams(location.search).get('view') === 'data' ? 'data' : 'enter'
}

/** Coming back after this long away starts a fresh expense, ready to type. */
const AWAY_MS = 20_000

function App() {
  const [route, setRoute] = useState<Route>('add')
  const [launchKey, setLaunchKey] = useState(0)
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [view, setView] = useState<View>(initialView)
  const [addPreset, setAddPreset] = useState<AddExpensePreset | null>(null)

  useEffect(() => {
    // Drives the wider desktop layout for the Dashboard (see index.css).
    document.documentElement.dataset.view = view
  }, [view])

  useEffect(() => {
    // Seeding defaults must never hold the first screen back or break it if the network is slow.
    ensureSeeded().catch((err) => console.error('Could not seed defaults', err))
  }, [])

  useEffect(() => {
    let hiddenAt = 0
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (!hiddenAt || Date.now() - hiddenAt < AWAY_MS) return
      hiddenAt = 0
      // A half-typed expense is left alone; anywhere else, jump back to a fresh amount screen.
      if (view === 'enter' && route === 'add') return
      setAddPreset(null)
      setView('enter')
      setRoute('add')
      setLaunchKey((k) => k + 1)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [view, route])

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />
  }

  /** Jump to the Add screen set up for giving, pre-filled with what is left to give. */
  function handleGive(amount: number) {
    setAddPreset({
      type: 'giving',
      categoryId: 'tithe',
      amount: amount > 0 ? String(Math.round(amount)) : undefined,
    })
    setView('enter')
    setRoute('add')
  }

  const mobileActive: MobileDestination =
    view === 'data' ? 'dashboard' : route === 'insights' ? 'insights' : 'expense'

  const tab: Tab = route === 'insights' ? 'insights' : 'home'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ViewToggle value={view} onChange={setView} />
      {/* Phones have no top bar; keep content clear of the status bar. */}
      <div className="md:hidden shrink-0" style={{ height: 'var(--topbar-h)' }} />

      {view === 'data' && <AllDataScreen onGive={handleGive} />}

      {view === 'enter' && (
      <>
      <AnimatePresence mode="wait">
        {route === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 overflow-y-auto pb-32"
          >
            <HomeScreen
              onOpenSettings={() => setRoute('settings')}
              onOpenStewardship={() => setRoute('stewardship')}
              onOpenBudgets={() => setRoute('budgets')}
              onAddExpense={() => setRoute('add')}
              onGive={handleGive}
            />
          </motion.div>
        )}
        {route === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 overflow-y-auto pb-32"
          >
            <InsightsScreen onOpenSettings={() => setRoute('settings')} />
          </motion.div>
        )}
        {route === 'add' && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-x-0 bottom-0 top-[var(--topbar-h)] max-w-[560px] mx-auto bg-bg z-50"
          >
            <AddExpenseScreen
              key={launchKey}
              preset={addPreset ?? undefined}
              onDone={() => {
                setAddPreset(null)
                setRoute('home')
              }}
              onCancel={() => {
                setAddPreset(null)
                setRoute('home')
              }}
            />
          </motion.div>
        )}
        {route === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-x-0 bottom-0 top-[var(--topbar-h)] max-w-[560px] mx-auto bg-bg z-50"
          >
            <SettingsScreen
              onBack={() => setRoute('home')}
              onLock={() => {
                setRoute('home')
                setUnlocked(false)
              }}
            />
          </motion.div>
        )}
        {route === 'stewardship' && (
          <motion.div
            key="stewardship"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-x-0 bottom-0 top-[var(--topbar-h)] max-w-[560px] mx-auto bg-bg z-50"
          >
            <StewardshipScreen onBack={() => setRoute('home')} onGive={handleGive} />
          </motion.div>
        )}
        {route === 'budgets' && (
          <motion.div
            key="budgets"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-x-0 bottom-0 top-[var(--topbar-h)] max-w-[560px] mx-auto bg-bg z-50"
          >
            <BudgetsScreen onBack={() => setRoute('home')} />
          </motion.div>
        )}
      </AnimatePresence>

      {route !== 'add' && route !== 'settings' && route !== 'stewardship' && route !== 'budgets' && (
        <div className="hidden md:block">
          <BottomNav active={tab} onChange={setRoute} onAdd={() => setRoute('add')} />
        </div>
      )}
      </>
      )}

      {(view === 'data' || route === 'home' || route === 'insights') && (
        <MobileNav
          active={mobileActive}
          onExpense={() => {
            setView('enter')
            setRoute('home')
          }}
          onInsights={() => {
            setView('enter')
            setRoute('insights')
          }}
          onAdd={() => {
            setView('enter')
            setRoute('add')
          }}
          onDashboard={() => setView('data')}
          onSettings={() => {
            setView('enter')
            setRoute('settings')
          }}
        />
      )}
    </div>
  )
}

export default App
