import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { buildEmbedCode, DEPLOYED_URL } from '../../lib/deployment'

export function EmbedCodeCard() {
  const [copied, setCopied] = useState(false)
  const code = buildEmbedCode()

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-1">Embed on Your Website</h3>
      <p className="text-secondary text-[13px] mb-3">
        Paste this on a dedicated page of your site to show the tracker full-screen.
      </p>
      <Card className="flex flex-col gap-4">
        <pre className="bg-bg border border-border rounded-2xl p-3.5 text-[12px] text-secondary overflow-x-auto whitespace-pre">
          <code>{code}</code>
        </pre>
        <Button onClick={handleCopy} variant={copied ? 'secondary' : 'primary'}>
          {copied ? 'Copied!' : 'Copy Embed Code'}
        </Button>
        <p className="text-tertiary text-[12px] truncate">{DEPLOYED_URL}</p>
      </Card>
    </div>
  )
}
