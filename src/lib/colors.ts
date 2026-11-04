/** Bright fill colours are too pale to read as text on the light theme; this maps them to darker shades. */
const TEXT_SHADE: Record<string, string> = {
  '#5b9dff': '#1f5fd1',
  '#ff9f43': '#b45f06',
  '#24d968': '#0a8a3c',
  '#e3b341': '#8f6a00',
  '#ff5c5c': '#d93636',
}

export function textShade(color: string) {
  return TEXT_SHADE[color.toLowerCase()] ?? color
}
