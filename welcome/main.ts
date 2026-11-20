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

// ---------- Waiting list (with a 6-digit email code) ----------
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const NOTE = 'No spam. One email when your spot is ready.'
const CODE_NOTE = "Can't find it? Check your spam or promotions folder."
const RESEND_SECONDS = 45

async function rpc(fn: string, args: Record<string, unknown>): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('The waiting list is not connected yet. Please try again later.')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(args),
  })
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg = (body as { message?: unknown } | null)?.message
    throw new Error(typeof msg === 'string' && msg.length < 160 ? msg : 'Something went wrong. Please try again.')
  }
  return typeof body === 'string' ? body : ''
}

const joinWaitlist = (email: string, source: string) => rpc('join_waitlist', { p_email: email, p_name: null, p_source: source })
const verifyCode = (email: string, code: string) => rpc('verify_waitlist', { p_email: email, p_code: code })

const VERIFY_MESSAGES: Record<string, string> = {
  wrong: "That code isn't right. Please check it and try again.",
  expired: 'That code has expired. Tap "Resend code" for a new one.',
  locked: 'Too many tries. Tap "Resend code" for a new one.',
  missing: 'Please tap "Resend code" for a new one.',
}

function markAllJoined(email: string) {
  try {
    localStorage.setItem('fp_waitlist', email)
  } catch {
    /* private mode: fine */
  }
  document.querySelectorAll('.otp').forEach((el) => el.remove())
  document.querySelectorAll<HTMLFormElement>('form.join').forEach((form) => {
    const done = document.createElement('div')
    done.className = 'joined'
    done.setAttribute('role', 'status')
    done.innerHTML = `<span class="ic-round"><i class="ic ic-check"></i></span><div><b>You're on the list!</b><span class="msg"></span></div>`
    done.querySelector('.msg')!.textContent = `We'll email ${email} when your spot is ready.`
    form.replaceWith(done)
  })
}

let otpCount = 0

/** Swap the email form for the code step: enter the 6-digit code, resend it, or change the address. */
function showCodeStep(form: HTMLFormElement, email: string, source: string) {
  const id = `otp-${++otpCount}`
  const step = document.createElement('div')
  step.className = 'otp'
  step.innerHTML = `
    <p class="otp-title">Check your email</p>
    <p class="otp-sub">We sent a 6-digit code to <b class="otp-email"></b>. Enter it below to confirm.</p>
    <form class="otp-form" novalidate>
      <label class="sr" for="${id}">6-digit code</label>
      <div class="field">
        <input id="${id}" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="6-digit code" />
        <button class="btn btn-dark" type="submit"><span class="btn-label">Confirm</span><span class="spinner" aria-hidden="true"></span></button>
      </div>
      <p class="form-note" role="status" aria-live="polite"></p>
    </form>
    <p class="otp-links">
      <button type="button" class="linkbtn" data-resend>Resend code</button>
      <span aria-hidden="true">·</span>
      <button type="button" class="linkbtn" data-change>Use a different email</button>
    </p>`
  step.querySelector('.otp-email')!.textContent = email
  const codeForm = step.querySelector<HTMLFormElement>('form')!
  const codeInput = step.querySelector<HTMLInputElement>('input')!
  const note = step.querySelector<HTMLElement>('.form-note')!
  const confirmBtn = codeForm.querySelector<HTMLButtonElement>('button')!
  const resendBtn = step.querySelector<HTMLButtonElement>('[data-resend]')!
  const changeBtn = step.querySelector<HTMLButtonElement>('[data-change]')!
  note.textContent = CODE_NOTE

  form.hidden = true
  form.after(step)
  codeInput.focus()

  let timer: number | undefined
  const startCooldown = () => {
    let left = RESEND_SECONDS
    resendBtn.disabled = true
    const tick = () => {
      resendBtn.textContent = left > 0 ? `Resend code in ${left}s` : 'Resend code'
      if (left <= 0) {
        resendBtn.disabled = false
        window.clearInterval(timer)
      }
      left--
    }
    window.clearInterval(timer)
    tick()
    timer = window.setInterval(tick, 1000)
  }
  startCooldown()

  const setNote = (text: string, error = false) => {
    note.textContent = text
    note.classList.toggle('error', error)
  }

  codeInput.addEventListener('input', () => {
    const digits = codeInput.value.replace(/\D/g, '').slice(0, 6)
    codeInput.value = digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits
    if (note.classList.contains('error')) setNote(CODE_NOTE)
    if (codeInput.value.replace(/\D/g, '').length === 6) codeForm.requestSubmit()
  })

  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (codeForm.classList.contains('loading')) return
    const code = codeInput.value.replace(/\D/g, '')
    if (code.length !== 6) {
      setNote('Please enter the 6-digit code from the email.', true)
      codeInput.focus()
      return
    }
    codeForm.classList.add('loading')
    confirmBtn.disabled = true
    try {
      const result = await verifyCode(email, code)
      if (result === 'verified') {
        window.clearInterval(timer)
        markAllJoined(email)
        return
      }
      setNote(VERIFY_MESSAGES[result] ?? 'Something went wrong. Please try again.', true)
      codeInput.select()
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Something went wrong. Please try again.', true)
    } finally {
      codeForm.classList.remove('loading')
      confirmBtn.disabled = false
    }
  })

  resendBtn.addEventListener('click', async () => {
    resendBtn.disabled = true
    try {
      const result = await joinWaitlist(email, source)
      if (result === 'verified' || result === 'joined') {
        window.clearInterval(timer)
        markAllJoined(email)
        return
      }
      setNote('A new code is on its way.')
      codeInput.value = ''
      codeInput.focus()
      startCooldown()
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Something went wrong. Please try again.', true)
      resendBtn.disabled = false
    }
  })

  changeBtn.addEventListener('click', () => {
    window.clearInterval(timer)
    step.remove()
    form.hidden = false
    form.querySelector<HTMLInputElement>('input[name="email"]')?.focus()
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
      const result = await joinWaitlist(email, source)
      if (result === 'sent') showCodeStep(form, email, source)
      else markAllJoined(email) // 'joined' (no email check yet) or 'verified' (already confirmed)
    } catch (err) {
      note.classList.add('error')
      note.textContent = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    } finally {
      form.classList.remove('loading')
      button.disabled = false
    }
  })
})

// Someone who already joined and confirmed sees the thank-you straight away.
try {
  const saved = localStorage.getItem('fp_waitlist')
  if (saved) markAllJoined(saved)
} catch {
  /* ignore */
}
