#!/usr/bin/env node
// Lays out the built site for faithfulportion.site after `vite build` (built with VITE_BASE_PATH=/app/):
//
//   /            the landing page with the waiting list
//   /app/        the app
//   /welcome/    old landing-page address, sends people to /
//   /sw.js       retires the app's old offline worker that was briefly installed at the root
//
// Run from the project root: node scripts/arrange-site.mjs

import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const app = join(dist, 'app')

if (!existsSync(join(dist, 'index.html')) || !existsSync(join(dist, 'welcome', 'index.html'))) {
  console.error('Run vite build first (dist/index.html and dist/welcome/index.html are missing).')
  process.exit(1)
}
if (existsSync(app)) rmSync(app, { recursive: true })

// 1. Everything the build made goes under /app/ (its links already point there).
const entries = readdirSync(dist)
mkdirSync(app)
for (const name of entries) renameSync(join(dist, name), join(app, name))

// 2. The landing page is the front door. Its files are referenced as /app/assets/…, so a copy works here.
cpSync(join(app, 'welcome', 'index.html'), join(dist, 'index.html'))

// 3. GitHub Pages needs the custom-domain file at the top.
if (existsSync(join(app, 'CNAME'))) renameSync(join(app, 'CNAME'), join(dist, 'CNAME'))

// 4. Old /welcome/ links land on the front page.
mkdirSync(join(dist, 'welcome'))
writeFileSync(
  join(dist, 'welcome', 'index.html'),
  '<!doctype html><meta charset="utf-8"><title>Faithful Portion</title>' +
    '<meta http-equiv="refresh" content="0; url=/"><link rel="canonical" href="/">' +
    '<script>location.replace("/" + location.search + location.hash)</script>',
)

// 5. For a short while the app's offline worker lived at /sw.js and claimed the whole site. This
//    replacement removes itself and reloads open pages, so those visitors see the landing page.
writeFileSync(
  join(dist, 'sw.js'),
  `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key)
    await self.registration.unregister()
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url)
  })())
})
`,
)

console.log('Site arranged: landing page at /, app at /app/.')
