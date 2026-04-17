/**
 * Koho Theme Tokens
 *
 * Centralised colour values for dark and light mode slide rendering.
 * Every slide layout uses these tokens instead of hardcoded hex values
 * so a single theme swap changes the entire visual system.
 *
 * Usage:
 *   const theme = (data as any)?.__theme__ || 'dark'
 *   const t = getTheme(theme)
 *   <div style={{ background: t.bg, color: t.ink }}>...</div>
 */

export interface KohoTheme {
  mode: 'dark' | 'light'

  // Surfaces
  bg: string           // Slide background
  bgCard: string       // Card/nested surface
  bgChrome: string     // Browser mockup chrome header bar
  bgPage: string       // Page behind the slide (viewport)

  // Text
  ink: string          // Primary text
  inkDim: string       // Secondary/muted text
  inkFaint: string     // Tertiary/metadata text

  // Rules & grid
  rule: string         // Subtle divider
  rule2: string        // Medium divider
  ruleStrong: string   // Strong divider (dashed separators)
  grid: string         // Background grid lines

  // Signal (brand green)
  signal: string       // Primary accent
  signalGlow: string   // Text shadow / glow
  signalTint: string   // Background tint
  signalEdge: string   // Border tint

  // Semantic
  negative: string
  warning: string
  info: string

  // Border / slide frame
  slideBorder: string
  slideShadow: string

  // Asset paths
  contourDir: string   // Directory for contour SVGs (e.g. '/koho/contours' or '/koho/contours/light')
  logoSrc: string      // Full logo wordmark

  // CSS variable injections for showcase components (V3 sequential palette)
  cssVars: Record<string, string>
}

export const darkTheme: KohoTheme = {
  mode: 'dark',

  bg: '#0A0E14',
  bgCard: '#0F141C',
  bgChrome: '#1A2332',
  bgPage: '#000',

  ink: '#E6EDF3',
  inkDim: '#7D8590',
  inkFaint: '#484F58',

  rule: 'rgba(255,255,255,0.09)',
  rule2: 'rgba(255,255,255,0.12)',
  ruleStrong: 'rgba(255,255,255,0.14)',
  grid: 'rgba(255,255,255,0.07)',

  signal: '#00E58A',
  signalGlow: 'rgba(0,229,138,0.4)',
  signalTint: 'rgba(0,229,138,0.06)',
  signalEdge: 'rgba(0,229,138,0.3)',

  negative: '#FF4D4D',
  warning: '#FFD000',
  info: '#18D4F5',

  slideBorder: 'rgba(255,255,255,0.12)',
  slideShadow: '0 40px 120px rgba(0,0,0,.8), 0 0 0 1px rgba(0,229,138,.04)',

  contourDir: '/koho/contours',
  logoSrc: '/koho/logos/koho-dark.svg',

  cssVars: {
    // V3 Cool Electric dark mode — HSL for tailwind hsl(var(--...)) pattern
    '--chart-1': '152 100% 45%',
    '--chart-2': '163 100% 48%',
    '--chart-3': '189 90% 52%',
    '--chart-4': '218 100% 67%',
    '--chart-5': '211 59% 57%',
    '--chart-6': '186 72% 61%',
    '--chart-7': '174 61% 40%',
    '--chart-8': '230 44% 63%',
    '--chart-9': '187 64% 71%',
    '--chart-10': '187 100% 28%',
    '--status-healthy': '152 100% 45%',
    '--status-positive': '152 100% 45%',
    '--delta-positive': '152 100% 45%',
    '--status-negative': '0 100% 65%',
    '--delta-negative': '0 100% 65%',
    '--status-warning': '48 100% 50%',
    '--status-info': '189 90% 52%',
    '--background': '210 33% 6%',
    '--foreground': '210 33% 93%',
    '--card': '213 30% 8%',
    '--card-foreground': '210 33% 93%',
    '--muted': '213 24% 12%',
    '--muted-foreground': '215 10% 52%',
    '--border': '0 0% 20%',
    '--primary': '152 100% 45%',
    '--primary-foreground': '210 33% 6%',
  },
}

export const lightTheme: KohoTheme = {
  mode: 'light',

  bg: '#F4F6F9',
  bgCard: '#EAEEF3',
  bgChrome: '#FFFFFF',
  bgPage: '#DEE3EA',

  ink: '#1A2332',
  inkDim: '#6B7280',
  inkFaint: '#9CA3AF',

  rule: 'rgba(26,35,50,0.08)',
  rule2: 'rgba(26,35,50,0.14)',
  ruleStrong: 'rgba(26,35,50,0.18)',
  grid: 'rgba(26,35,50,0.05)',

  signal: '#00C278',
  signalGlow: 'rgba(0,194,120,0.18)',
  signalTint: 'rgba(0,194,120,0.06)',
  signalEdge: 'rgba(0,194,120,0.3)',

  negative: '#F03E3E',
  warning: '#F5A800',
  info: '#00BCD4',

  slideBorder: 'rgba(26,35,50,0.14)',
  slideShadow: '0 40px 120px rgba(26,35,50,0.18), 0 0 0 1px rgba(0,194,120,0.06)',

  contourDir: '/koho/contours/light',
  logoSrc: '/koho/logos/koho-light.svg',

  cssVars: {
    // V3 Cool Electric light mode — HSL for tailwind hsl(var(--...)) pattern
    '--chart-1': '153 100% 38%',
    '--chart-2': '165 100% 42%',
    '--chart-3': '187 100% 42%',
    '--chart-4': '207 90% 54%',
    '--chart-5': '210 100% 36%',
    '--chart-6': '186 72% 50%',
    '--chart-7': '174 100% 27%',
    '--chart-8': '230 44% 58%',
    '--chart-9': '187 68% 59%',
    '--chart-10': '187 100% 20%',
    '--status-healthy': '153 100% 38%',
    '--status-positive': '153 100% 38%',
    '--delta-positive': '153 100% 38%',
    '--status-negative': '0 87% 59%',
    '--delta-negative': '0 87% 59%',
    '--status-warning': '40 100% 49%',
    '--status-info': '187 100% 42%',
    '--background': '216 23% 97%',
    '--foreground': '215 33% 15%',
    '--card': '0 0% 100%',
    '--card-foreground': '215 33% 15%',
    '--muted': '216 23% 93%',
    '--muted-foreground': '215 10% 46%',
    '--border': '215 20% 88%',
    '--primary': '153 100% 38%',
    '--primary-foreground': '0 0% 100%',
  },
}

export type ThemeMode = 'dark' | 'light'

export function getTheme(mode?: ThemeMode): KohoTheme {
  return mode === 'light' ? lightTheme : darkTheme
}
