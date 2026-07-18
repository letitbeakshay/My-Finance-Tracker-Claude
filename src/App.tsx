import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { HomeScreen } from './components/home/HomeScreen'
import { InsightsScreen } from './components/insights/InsightsScreen'
import { AddExpenseScreen } from './components/add/AddExpenseScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'
import { PasscodeGate } from './components/auth/PasscodeGate'
import { ensureSeeded } from './db/seed'
import { isUnlocked } from './lib/auth'

type Route = Tab | 'add' | 'settings'

function App() {
  const [route, setRoute] = useState<Route>('add')
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(isUnlocked)

  useEffect(() => {
    ensureSeeded().then(() => setReady(true))
  }, [])

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />
  }

  if (!ready) return null

  const tab: Tab = route === 'insights' ? 'insights' : 'home'

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
              onAddExpense={() => setRoute('add')}
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
            className="flex-1 overflow-y-auto fixed inset-0 max-w-[560px] mx-auto bg-bg z-50"
          >
            <AddExpenseScreen onDone={() => setRoute('home')} onCancel={() => setRoute('home')} />
          </motion.div>
        )}
        {route === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="flex-1 overflow-y-auto fixed inset-0 max-w-[560px] mx-auto bg-bg z-50"
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
      </AnimatePresence>

      {route !== 'add' && route !== 'settings' && (
        <BottomNav active={tab} onChange={setRoute} onAdd={() => setRoute('add')} />
      )}
    </div>
  )
}

export default App
