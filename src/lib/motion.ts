import type { Transition, Variants } from 'framer-motion'

/**
 * Motion tokens from transitions.dev, for framer-motion. Opens are a touch slower than closes, travel stays
 * small, and MotionConfig reducedMotion="user" (in main.tsx) turns movement off for people who ask for less.
 */
export const EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1] as const
export const DURATION = { stagger: 0.04, micro: 0.08, quick: 0.15, fast: 0.25, medium: 0.35, slow: 0.4 } as const

const open = (duration: number): Transition => ({ duration, ease: EASE_SMOOTH_OUT })

/** Swapping content in place (Dashboard sections, tabs): a soft 8px slide with a light blur, 250ms in, 150ms out. */
export const pageSwap: Variants = {
  initial: { opacity: 0, y: 8, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: open(DURATION.fast) },
  exit: { opacity: 0, y: -4, filter: 'blur(3px)', transition: open(DURATION.quick) },
}

/** A full-screen page arriving over the app (Settings, Budgets, Add): 400ms in, 350ms out. */
export const panelReveal: Variants = {
  initial: { opacity: 0, y: 32, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: open(DURATION.slow) },
  exit: { opacity: 0, y: 32, filter: 'blur(2px)', transition: open(DURATION.medium) },
}

/** Tabs that swap at the same level (Home and Insights): symmetric 250ms. */
export const tabSwap: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: open(DURATION.fast) },
  exit: { opacity: 0, y: -8, transition: open(DURATION.quick) },
}
