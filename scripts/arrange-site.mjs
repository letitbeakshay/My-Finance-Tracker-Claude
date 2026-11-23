#!/usr/bin/env node
// Lays out the built site for faithfulportion.site after `vite build` (built with VITE_BASE_PATH=/app/):
//
//   /            the landing page with the waiting list
//   /app/        the app
//   /welcome/    old landing-page address, sends people to /
//   /sw.js       retires the app's old offline worker that was briefly installed at the root
//
// Run from the project root: node scripts/arrange-site.mjs

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
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
//    It is a waiting-list page, so it must not offer to install the app or point to it: drop the app's
//    manifest and offline-worker tags that the build adds to every page.
const landing = readFileSync(join(app, 'welcome', 'index.html'), 'utf8')
  .replace(/<link rel="manifest"[^>]*>/g, '')
  .replace(/<script[^>]*registerSW\.js[^>]*><\/script>/g, '')
  .replace(/<script[^>]*id="vite-plugin-pwa:register-sw"[^>]*><\/script>/g, '')
  // Its tab icons come from the top of the site, not from /app/.
  .replace(/"\/app\/(favicon\.ico|favicon-32\.png|apple-touch-icon\.png)"/g, '"/$1"')
writeFileSync(join(dist, 'index.html'), landing)

// The link-preview image sits at the top level too (https://faithfulportion.site/og-image.png).
// (Copied, not moved: the app's offline worker expects every file it was built with.)
if (existsSync(join(app, 'og-image.png'))) cpSync(join(app, 'og-image.png'), join(dist, 'og-image.png'))

// Browsers ask for the tab icon at the top of the site too (/favicon.ico and friends).
for (const f of ['favicon.ico', 'favicon-32.png', 'favicon.svg', 'apple-touch-icon.png']) {
  if (existsSync(join(app, f))) cpSync(join(app, f), join(dist, f))
}

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
