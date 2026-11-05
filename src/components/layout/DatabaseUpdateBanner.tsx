import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { SETUP_SQL, checkSchema, sqlEditorUrl } from '../../lib/schemaStatus'

const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

/**
 * Shown only while the database is missing something the app needs. One tap copies the SQL; paste it
 * in Supabase and press Run. It checks again whenever you come back, and disappears by itself.
 */
export function DatabaseUpdateBanner() {
  const [missing, setMissing] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  const check = useCallback(async () => {
    if (DEMO) return
    setChecking(true)
    try {
      setMissing(await checkSchema())
    } catch {
      // Offline or the check failed: say nothing rather than show a wrong warning.
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    check()
    const onVisible = () => !document.hidden && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [check])

  if (missing.length === 0) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(SETUP_SQL)
      setCopied(true)
    } catch {
      // Clipboard blocked: the SQL is also in the repo (supabase/schema.sql).
      setCopied(false)
    }
  }

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-2 mb-1 rounded-2xl border border-accent bg-accent-soft px-4 py-3.5" role="status">
      <p className="text-white text-[14px] font-semibold">The database needs a quick update</p>
      <p className="text-secondary text-[13px] leading-relaxed mt-1">
        Missing: {missing.join(' · ')}. Copy the SQL, paste it in Supabase and press <span className="font-semibold">Run</span>.
        It only adds things and keeps all your data. This notice goes away by itself.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={copy}
          className="h-10 px-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center gap-2"
        >
          {copied ? <Check size={16} strokeWidth={2.6} /> : <Copy size={16} />}
          {copied ? 'Copied. Now paste it' : 'Copy the SQL'}
        </button>
        <a
          href={sqlEditorUrl()}
          target="_blank"
          rel="noreferrer"
          className="h-10 px-4 rounded-xl bg-card border border-border text-white text-[14px] font-semibold flex items-center gap-2"
        >
          <ExternalLink size={16} /> Open Supabase
        </a>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="h-10 px-3 text-accent-ink text-[14px] font-semibold disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check again'}
        </button>
      </div>
    </div>
  )
}
