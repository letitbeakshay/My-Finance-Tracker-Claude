import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { APP_NAME, SUPPORT_EMAIL } from '../../lib/config'

export type LegalKind = 'privacy' | 'terms'

const UPDATED = '16 November 2026'

function H({ children }: { children: ReactNode }) {
  return <h2 className="text-white text-[18px] font-bold mt-8 mb-2">{children}</h2>
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-secondary text-[15px] leading-relaxed mb-3">{children}</p>
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 mb-3 flex flex-col gap-1.5">
      {items.map((t) => (
        <li key={t} className="text-secondary text-[15px] leading-relaxed">
          {t}
        </li>
      ))}
    </ul>
  )
}

const Contact = () =>
  SUPPORT_EMAIL ? (
    <>
      <H>Contact</H>
      <P>
        Questions, or a request about your data? Write to{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-ink underline">
          {SUPPORT_EMAIL}
        </a>
        .
      </P>
    </>
  ) : null

function Privacy() {
  return (
    <>
      <h1 className="text-white text-[28px] font-bold">Privacy Policy</h1>
      <p className="text-tertiary text-[13px] mt-1 mb-6">Last updated {UPDATED}</p>
      <P>
        {APP_NAME} helps you record what you earn and spend. This page says what we keep, why, and how you stay in control. We keep it short and plain on purpose.
      </P>

      <H>What we collect</H>
      <UL
        items={[
          'Your email address and password. The password is stored only in scrambled (hashed) form; nobody, including us, can read it.',
          'Your name, if you choose to give it.',
          'What you enter in the app: expenses, income, categories, bank and card names (never full card numbers), loans, budgets, savings plans and reflections.',
          'Files you pick, such as a bank statement PDF, are read on your own device to fill in transactions. The file itself is never uploaded.',
        ]}
      />

      <H>How we use it</H>
      <P>Only to run the app for you: to sign you in, show your records, and work out totals, budgets and progress. We do not sell your data, we do not show ads, and we do not share it with advertisers.</P>

      <H>Who can see your data</H>
      <P>
        Your records are tied to your account, and the database only lets you read and change your own. Other people who use the app cannot see yours. The person who runs {APP_NAME} could technically access the database for maintenance or to fix a problem, and will not look at your records otherwise.
      </P>

      <H>Where it is kept</H>
      <P>Your data is stored with Supabase (database and sign-in), and the app is served from GitHub Pages. They process data on our behalf to provide the service. Your sign-in is kept in your browser so you stay signed in.</P>

      <H>Keeping and deleting your data</H>
      <UL
        items={[
          'Export everything any time from Settings (CSV or JSON).',
          'Delete your account from Settings. This permanently removes your account and all your records, including the private recovery copies we keep to protect against accidental deletion.',
          'Deleted records may stay in encrypted backups for a short while before they expire.',
        ]}
      />

      <H>Children</H>
      <P>{APP_NAME} is not meant for children under 13. If you believe a child has signed up, tell us and we will delete the account.</P>

      <H>Changes</H>
      <P>If this policy changes in a way that matters, we will say so in the app. The date above shows the latest version.</P>
      <Contact />
    </>
  )
}

function Terms() {
  return (
    <>
      <h1 className="text-white text-[28px] font-bold">Terms of Use</h1>
      <p className="text-tertiary text-[13px] mt-1 mb-6">Last updated {UPDATED}</p>
      <P>By creating an account or using {APP_NAME} you agree to these terms.</P>

      <H>What the app is</H>
      <P>{APP_NAME} is a personal tool for tracking money. It is not financial, tax, legal or investment advice. Numbers such as loan schedules, interest and savings progress are calculated from what you enter, so please check them against your bank and lender statements.</P>

      <H>Your account</H>
      <UL
        items={[
          'You must be at least 13 years old, and give a real email address you can reach.',
          'Keep your password private. You are responsible for what happens under your account.',
          'Please do not try to break the app, reach other people’s data, or overload it.',
        ]}
      />

      <H>Your data</H>
      <P>Your records belong to you. You give us permission to store and process them only to run the app for you, as described in the Privacy Policy. Export or delete them any time from Settings.</P>

      <H>Plans and payments</H>
      <P>The app is free to start. Some features may become paid in future. If that happens we will tell you clearly before you are charged, and nothing is charged without your action.</P>

      <H>No guarantees</H>
      <P>We work hard to keep the app available and your data safe, and we keep protective copies, but the app is provided “as is”, without promises of uninterrupted service or error-free results. To the extent the law allows, we are not responsible for losses that come from using the app or relying on its numbers. Keep your own exports of anything important.</P>

      <H>Ending your use</H>
      <P>You can stop at any time and delete your account in Settings. We may suspend accounts that break these terms or harm the service.</P>

      <H>Changes</H>
      <P>We may update these terms. If a change matters, we will say so in the app. Continuing to use the app after that means you accept it.</P>

      <H>Governing law</H>
      <P>These terms are governed by the laws of India.</P>
      <Contact />
    </>
  )
}

/** The Privacy Policy and Terms of Use, readable without signing in (`?page=privacy` and `?page=terms`). */
export function LegalPage({ kind }: { kind: LegalKind }) {
  return (
    <div className="fixed inset-0 bg-bg z-[100] overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <a href={import.meta.env.BASE_URL} className="inline-flex items-center gap-1 text-secondary text-[15px] font-medium h-11 -ml-2 pl-1 pr-3 mb-4">
          <ChevronLeft size={20} /> Back to {APP_NAME}
        </a>
        {kind === 'privacy' ? <Privacy /> : <Terms />}
        <div className="flex gap-5 mt-10 pt-6 border-t border-border text-[14px]">
          <a href={`${import.meta.env.BASE_URL}?page=privacy`} className="text-accent-ink underline">
            Privacy Policy
          </a>
          <a href={`${import.meta.env.BASE_URL}?page=terms`} className="text-accent-ink underline">
            Terms of Use
          </a>
        </div>
      </div>
    </div>
  )
}

/** Which legal page the address asks for, if any. */
export function legalPageFromUrl(): LegalKind | null {
  const page = new URLSearchParams(location.search).get('page')
  return page === 'privacy' || page === 'terms' ? page : null
}
