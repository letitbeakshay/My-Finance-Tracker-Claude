import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { HomeScreen } from './components/home/HomeScreen'
import { InsightsScreen } from './components/insights/InsightsScreen'
import { AddExpenseScreen } from './components/add/AddExpenseScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'
import { AuthScreen, RecoveryScreen } from './components/auth/AuthScreen'
import { LegalPage, legalPageFromUrl } from './components/auth/LegalPage'
import { Onboarding } from './components/onboarding/Onboarding'
import { StewardshipScreen } from './components/stewardship/StewardshipScreen'
import { BudgetsScreen } from './components/budget/BudgetsScreen'
import type { AddExpensePreset } from './components/add/AddExpenseScreen'
import { AllDataScreen } from './components/data/AllDataScreen'
import { ViewToggle, type View } from './components/layout/ViewToggle'
import { MobileNav, type MobileDestination } from './components/layout/MobileNav'
import { ensureSeeded, resetSeeding } from './db/seed'
import { categoryRepo } from './db/repository'
import { DEMO, useAuth } from './lib/accounts'
import { useSettings } from './hooks/useLiveData'
import { keepSessionFresh, readSession, writeSession } from './lib/session'

type Route = Tab | 'add' | 'settings' | 'stewardship' | 'budgets'

/**
 * A fresh open starts on Expense, ready to type an amount. If you were on the Dashboard a moment ago
 * (and the phone just reloaded the app), you land back there. `?view=data` always opens the Dashboard.
 */
function initialView(): View {
  if (new URLSearchParams(location.search).get('view') === 'data') return 'data'
  return readSession()?.view === 'data' ? 'data' : 'enter'
}

/** Coming back after this long, from the Expense screens, starts a fresh expense. The Dashboard is left alone. */
const AWAY_MS = 20_000

/** Signed-in app: the screens below. Everything here can assume a person is signed in. */
function SignedInApp() {
  const [route, setRoute] = useState<Route>('add')
  const [launchKey, setLaunchKey] = useState(0)
  const [view, setView] = useState<View>(initialView)
  const [addPreset, setAddPreset] = useState<AddExpensePreset | null>(null)

  useEffect(() => {
    // Drives the wider desktop layout for the Dashboard (see index.css).
    document.documentElement.dataset.view = view
    writeSession({ view })
  }, [view])

  useEffect(() => {
    let hiddenAt = 0
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
        keepSessionFresh()
        return
      }
      if (!hiddenAt || Date.now() - hiddenAt < AWAY_MS) return
      hiddenAt = 0
      // Only the Expense home and Insights jump back to a fresh amount screen. The Dashboard, Settings,
      // Budgets, Stewardship and a half-typed expense stay exactly where you left them.
      if (view !== 'enter' || (route !== 'home' && route !== 'insights')) return
      setAddPreset(null)
      setView('enter')
      setRoute('add')
      setLaunchKey((k) => k + 1)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [view, route])

  /** Jump to the Add screen set up for giving, pre-filled with what is left to give. */
  async function handleGive(amount: number) {
    const categoryId = await categoryRepo.findIdByName('Tithe').catch(() => undefined)
    setAddPreset({
      type: 'giving',
      categoryId,
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

      {view === 'data' && <AllDataScreen />}

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
              onSignedOut={() => setRoute('home')}
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

/**
 * After sign-in: make sure the account is set up (starting categories on a brand-new one), then show the app,
 * with the welcome steps on top until a new person has finished them.
 */
function Authed({ userId, name }: { userId: string; name?: string }) {
  const [ready, setReady] = useState(DEMO)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (DEMO) return
    let live = true
    ensureSeeded()
      .catch((err) => {
        console.error('Could not set up the account', err)
        if (live) setFailed(true)
      })
      .finally(() => live && setReady(true))
    return () => {
      live = false
    }
  }, [userId])

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-3 text-secondary text-[15px]" aria-busy="true">
        <Loader2 size={26} className="animate-spin" />
        Setting up your account…
      </div>
    )
  }
  return (
    <>
      <SignedInApp key={userId} />
      <Welcome name={name} />
      {failed && (
        <p role="alert" className="fixed bottom-24 inset-x-4 z-[95] max-w-[520px] mx-auto rounded-2xl bg-card border border-border px-4 py-3 text-danger text-[14px] text-center">
          We could not finish setting up your account. Please check your connection and reload.
        </p>
      )}
    </>
  )
}

/** The welcome steps, shown once to a new person (settings have no onboarded date yet). */
function Welcome({ name }: { name?: string }) {
  const settings = useSettings()
  const [done, setDone] = useState(false)
  if (DEMO || !settings || settings.onboardedAt || done) return null
  return <Onboarding name={name} onDone={() => setDone(true)} />
}

/** Decides what to show: the policy pages, sign-in, a new password, or the app itself. */
function App() {
  const legal = legalPageFromUrl()
  const { loading, user, recovering, clearRecovery } = useAuth()
  const userId = user?.id

  // Someone new on a shared device must be set up from scratch, not see the last person's cached setup.
  useEffect(() => {
    if (!userId) resetSeeding()
  }, [userId])

  if (legal) return <LegalPage kind={legal} />
  if (loading) return <div className="fixed inset-0 bg-bg" aria-busy="true" />
  if (!user) return <AuthScreen />
  if (recovering) return <RecoveryScreen onDone={clearRecovery} />

  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined
  return <Authed key={user.id} userId={user.id} name={name} />
}

export default App
