import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/35 z-40"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[560px] bg-surface rounded-t-sheet border-t border-x border-border z-50 max-h-[85dvh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-tertiary rounded-full mx-auto mt-3 mb-1 opacity-50" />
            <div className="px-6 pb-8 pt-3">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
