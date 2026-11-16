import { AnimatePresence, motion } from 'framer-motion'
import { Check, Undo2 } from 'lucide-react'
import { runUndo, useToast } from '../../lib/toast'

/** The "Saved · Undo" bar. Mounted once, above everything else. */
export function UndoBar() {
  const toast = useToast()
  return (
    <div
      className="fixed inset-x-0 z-[80] flex justify-center px-4 pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+96px)] md:bottom-8"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-center gap-3 bg-primary text-on-primary rounded-2xl pl-4 pr-2 h-[52px] shadow-lg max-w-[460px] w-full"
          >
            {toast.undone && <Check size={18} strokeWidth={3} />}
            <span className="flex-1 min-w-0 truncate text-[15px] font-semibold">{toast.message}</span>
            {toast.undo && (
              <button type="button" onClick={runUndo} className="h-10 px-3.5 rounded-xl text-[14px] font-bold flex items-center gap-1.5 bg-on-primary/15">
                <Undo2 size={16} /> Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
