import { useSyncExternalStore } from 'react'

export interface Toast {
  id: number
  message: string
  /** Shown as a button; pressing it runs this. */
  undo?: () => Promise<void> | void
  /** True after Undo was pressed, while it shows "Done". */
  undone?: boolean
}

let current: Toast | null = null
let counter = 0
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function clearLater(ms: number) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    emit()
  }, ms)
}

/** A bar at the bottom of the screen for a few seconds, with an Undo button. */
export function showUndo(message: string, undo: () => Promise<void> | void, ms = 6000) {
  current = { id: ++counter, message, undo }
  emit()
  clearLater(ms)
}

export async function runUndo() {
  const t = current
  if (!t?.undo) return
  current = { ...t, undo: undefined, undone: true, message: 'Undone' }
  emit()
  clearLater(1500)
  try {
    await t.undo()
  } catch {
    current = { id: ++counter, message: 'Could not undo. Please try again.' }
    emit()
    clearLater(3000)
  }
}

export function dismissToast() {
  if (timer) clearTimeout(timer)
  current = null
  emit()
}

export function useToast() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}
