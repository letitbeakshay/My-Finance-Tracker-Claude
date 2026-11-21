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
import { UndoBar } from './components/ui/UndoBar'
import { Tour } from './components/tour/Tour'
import { StewardshipScreen } from './components/stewardship/StewardshipScreen'
import { BudgetsScreen } from './components/budget/BudgetsScreen'
import { SharedViewScreen } from './components/sharing/SharedViewScreen'
import { InviteAccept } from './components/sharing/InviteAccept'
import { takeInviteToken } from './lib/sharing'
import type { AddExpensePreset } from './components/add/AddExpenseScreen'
import { AllDataScreen } from './components/data/AllDataScreen'
import { ViewToggle, type View } from './components/layout/ViewToggle'
import { MobileNav, type MobileDestination } from './components/layout/MobileNav'
import { ensureSeeded, resetSeeding } from './db/seed'
import { categoryRepo } from './db/repository'
import { DEMO, useAuth } from './lib/accounts'
import { useSettings } from './hooks/useLiveData'
import { keepSessionFresh, readSession, writeSession } from './lib/session'

type Route = Tab | 'add' | 'settings' | 'stewardship' | 'budgets' | 'shared'

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
  const [entryMode] = useState<'expense' | 'income'>(() => (new URLSearchParams(location.search).get('action') === 'income' ? 'income' : 'expense'))
  const [launchKey, setLaunchKey] = useState(0)
  const [view, setView] = useState<View>(initialView)
  const [addPreset, setAddPreset] = useState<AddExpensePreset | null>(null)
  // Someone else's money, read-only (a couple partner or someone you are accountability partner for).
  const [shared, setShared] = useState<{ id: string; name: string } | null>(null)
  // An invite link opened now, or before signing in.
  const [invite, setInvite] = useState<string | null>(() => (DEMO ? null : takeInviteToken()))

  useEffect(() => {
    // The home-screen shortcuts open the app with ?action=...; tidy the address once it has been read.
    if (new URLSearchParams(location.search).has('action')) {
      const url = new URL(location.href)
      url.searchParams.delete('action')
      history.replaceState(null, '', url.pathname + url.search)
    }
  }, [])

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
              initialMode={entryMode}
              onGive={handleGive}
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
              onViewShared={(person) => {
                setShared(person)
                setRoute('shared')
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
        {route === 'shared' && shared && (
          <motion.div
            key="shared"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-x-0 bottom-0 top-[var(--topbar-h)] max-w-[560px] mx-auto bg-bg z-50"
          >
            <SharedViewScreen person={shared} onBack={() => setRoute('settings')} />
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

      {route !== 'add' && route !== 'settings' && route !== 'stewardship' && route !== 'budgets' && route !== 'shared' && (
        <div className="hidden md:block">
          <BottomNav active={tab} onChange={setRoute} onAdd={() => setRoute('add')} />
        </div>
      )}
      </>
      )}

      {invite && (
        <InviteAccept
          token={invite}
          onDone={(opened) => {
            setInvite(null)
            if (opened) {
              setView('enter')
              setShared(opened)
              setRoute('shared')
            }
          }}
        />
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
      <UndoBar />
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
  const [tour, setTour] = useState(false)
  if (tour) return <Tour onClose={() => setTour(false)} />
  if (DEMO || !settings || settings.onboardedAt || done) return null
  // A brand-new person gets the short tour right after the welcome steps.
  return <Onboarding name={name} onDone={() => { setDone(true); setTour(true) }} />
}

/** Decides what to show: the policy pages, sign-in, a new password, or the app itself. */
function App() {
  const legal = legalPageFromUrl()
  const [invited] = useState(() => !DEMO && !!takeInviteToken())
  const { loading, user, recovering, clearRecovery } = useAuth()
  const userId = user?.id

  // Someone new on a shared device must be set up from scratch, not see the last person's cached setup.
  useEffect(() => {
    if (!userId) resetSeeding()
  }, [userId])

  if (legal) return <LegalPage kind={legal} />
  if (loading) return <div className="fixed inset-0 bg-bg" aria-busy="true" />
  if (!user) return <AuthScreen invited={invited} />
  if (recovering) return <RecoveryScreen onDone={clearRecovery} />

  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined
  return <Authed key={user.id} userId={user.id} name={name} />
}

export default App
