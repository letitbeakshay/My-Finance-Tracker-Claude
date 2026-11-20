// Faithful Portion landing page: the hero chart, scroll animations and the waiting-list form.
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-500.css'
import '@fontsource/instrument-sans/latin-600.css'
import '@fontsource/bricolage-grotesque/latin-600.css'
import '@fontsource/bricolage-grotesque/latin-700.css'
import './welcome.css'

document.documentElement.classList.add('js')

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

// ---------- Nav border once the page scrolls ----------
const nav = document.querySelector('.nav')
const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 8)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

// ---------- Hero chart: a smooth six-month line, drawn in on load ----------
function drawChart() {
  const chart = document.querySelector<HTMLElement>('.chart')
  if (!chart) return
  const values = [58, 44, 66, 50, 74, 60] // Jun to Nov, higher means more spent
  const W = 300
  const H = 104
  const pad = 10
  const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / (values.length - 1), H - (v / 90) * H] as const)

  // Catmull-Rom to Bezier, so the line is soft like the app's chart.
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  const last = pts[pts.length - 1]
  chart.querySelector('.line')?.setAttribute('d', d)
  chart.querySelector('.area')?.setAttribute('d', `${d} L${last[0]},${H + 16} L${pts[0][0]},${H + 16} Z`)
  const pt = chart.querySelector('.pt')
  pt?.setAttribute('cx', String(last[0]))
  pt?.setAttribute('cy', String(last[1]))
  const bubble = chart.querySelector<HTMLElement>('.bubble')
  if (bubble) {
    bubble.style.left = `${(last[0] / W) * 100}%`
    bubble.style.top = `${(last[1] / H) * 104 - 52}px`
    bubble.style.transform = 'translateX(-78%)'
  }
  requestAnimationFrame(() => chart.classList.add('drawn'))
}
drawChart()

// ---------- Reveal on scroll ----------
const reveals = document.querySelectorAll<HTMLElement>('.reveal')
reveals.forEach((el) => {
  // Stagger siblings that share a parent (cards in a grid, steps).
  const sibs = Array.from(el.parentElement?.children ?? []).filter((c) => c.classList.contains('reveal'))
  const i = sibs.indexOf(el)
  if (i > 0) el.style.setProperty('--d', `${Math.min(i, 5) * 0.07}s`)
})
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )
  reveals.forEach((el) => io.observe(el))
} else {
  reveals.forEach((el) => el.classList.add('in'))
}

// ---------- See it in action: step through the app screens ----------
function setupTour() {
  const root = document.querySelector<HTMLElement>('.tour')
  const steps = Array.from(document.querySelectorAll<HTMLButtonElement>('.tstep'))
  const screens = Array.from(document.querySelectorAll<HTMLElement>('.tscreen .scr'))
  if (!root || !steps.length || steps.length !== screens.length) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const STEP_MS = 7000
  root.style.setProperty('--tour-ms', `${STEP_MS}ms`)
  let current = 0
  let timer: number | undefined
  let visible = false
  let started = Date.now()
  let remaining = STEP_MS

  const show = (i: number) => {
    const prev = screens[current]
    current = (i + screens.length) % screens.length
    steps.forEach((s, k) => {
      s.classList.toggle('on', k === current)
      s.setAttribute('aria-selected', String(k === current))
    })
    // Phone-size caption mirrors the active step's words.
    const cap = root.querySelector<HTMLElement>('.tour-caption')
    if (cap) {
      cap.querySelector('b')!.textContent = steps[current].querySelector('.ttext b')?.textContent ?? ''
      cap.querySelector('span')!.textContent = steps[current].querySelector('.ttext > span')?.textContent ?? ''
    }
    // Restart the progress bars.
    for (const bar of [steps[current].querySelector<HTMLElement>('.tbar'), cap?.querySelector<HTMLElement>('.cbar')]) {
      if (!bar) continue
      const d = bar.style.display
      bar.style.display = 'none'
      void bar.offsetWidth
      bar.style.display = d
    }
    const next = screens[current]
    if (prev !== next) {
      prev.classList.remove('on')
      window.setTimeout(() => {
        if (prev !== screens[current]) prev.classList.remove('play')
      }, 500)
    }
    next.classList.remove('play')
    void next.offsetWidth
    next.classList.add('on', 'play')
    remaining = STEP_MS
    schedule()
  }

  const schedule = () => {
    window.clearTimeout(timer)
    if (!visible || reduced) return
    started = Date.now()
    timer = window.setTimeout(() => show(current + 1), remaining)
  }
  const pause = () => {
    if (timer === undefined) return
    window.clearTimeout(timer)
    timer = undefined
    remaining = Math.max(400, remaining - (Date.now() - started))
    root.classList.add('tour-paused')
  }
  const resume = () => {
    root.classList.remove('tour-paused')
    schedule()
  }

  steps.forEach((s, k) => s.addEventListener('click', () => show(k)))

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => {
        const wasVisible = visible
        visible = e.isIntersecting
        if (visible && !wasVisible) show(current)
        else if (!visible) pause()
      },
      { threshold: 0.35 },
    ).observe(root)
  } else {
    visible = true
    show(0)
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : visible && resume()))
}
setupTour()

// ---------- Waiting list ----------
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const NOTE = 'No spam. One email when your spot is ready.'

async function joinWaitlist(email: string, source: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('The waiting list is not connected yet. Please try again later.')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ p_email: email, p_name: null, p_source: source }),
  })
  if (!res.ok) {
    let msg = 'Something went wrong. Please try again.'
    try {
      const body = await res.json()
      if (typeof body?.message === 'string' && body.message.length < 140) msg = body.message
    } catch {
      /* keep the plain message */
    }
    throw new Error(msg)
  }
}

function markAllJoined(email: string) {
  try {
    localStorage.setItem('fp_waitlist', email)
  } catch {
    /* private mode: fine */
  }
  document.querySelectorAll<HTMLFormElement>('form.join').forEach((form) => {
    const done = document.createElement('div')
    done.className = 'joined'
    done.setAttribute('role', 'status')
    done.innerHTML = `<span class="ic-round"><i class="ic ic-check"></i></span><div><b>You're on the list!</b><span class="msg"></span></div>`
    done.querySelector('.msg')!.textContent = `We'll email ${email} when your spot is ready.`
    form.replaceWith(done)
  })
}

const params = new URLSearchParams(location.search)
const campaign = params.get('utm_source') || params.get('ref') || ''

document.querySelectorAll<HTMLFormElement>('form.join').forEach((form) => {
  const input = form.querySelector<HTMLInputElement>('input[name="email"]')!
  const note = form.querySelector<HTMLElement>('.form-note')!
  const button = form.querySelector<HTMLButtonElement>('button')!

  input.addEventListener('input', () => {
    note.classList.remove('error')
    note.textContent = NOTE
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (form.classList.contains('loading')) return
    const honeypot = form.querySelector<HTMLInputElement>('input[name="company"]')
    const email = input.value.trim()
    if (honeypot?.value) {
      markAllJoined(email || 'you') // a bot filled the hidden field; pretend it worked
      return
    }
    if (!EMAIL_RE.test(email)) {
      note.classList.add('error')
      note.textContent = 'Please enter a valid email address.'
      input.focus()
      return
    }
    form.classList.add('loading')
    button.disabled = true
    try {
      const source = [form.dataset.source, campaign].filter(Boolean).join(':')
      await joinWaitlist(email, source)
      markAllJoined(email)
    } catch (err) {
      note.classList.add('error')
      note.textContent = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    } finally {
      form.classList.remove('loading')
      button.disabled = false
    }
  })
})

// Someone who already joined sees the thank-you straight away.
try {
  const saved = localStorage.getItem('fp_waitlist')
  if (saved) markAllJoined(saved)
} catch {
  /* ignore */
}
