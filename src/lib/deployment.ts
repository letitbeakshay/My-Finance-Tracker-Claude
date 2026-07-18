export const DEPLOYED_URL = 'https://letitbeakshay.github.io/My-Finance-Tracker-Claude/'

export function buildEmbedCode(url = DEPLOYED_URL) {
  return `<iframe
  src="${url}"
  title="Finance Tracker"
  loading="lazy"
  allow="clipboard-write"
  style="position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;border:0;margin:0;padding:0;z-index:2147483647;"
></iframe>`
}
