import type { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Read aloud by screen readers; hidden from view because each sheet draws its own heading. */
  label?: string
}

/** The shadcn Drawer as a bottom sheet: drag it down, press Escape or tap outside to close. */
export function BottomSheet({ open, onClose, children, label = 'Details' }: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerTitle className="sr-only">{label}</DrawerTitle>
        <div className="overflow-y-auto overscroll-contain px-6 pb-8 pt-2">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
