import { createTheme, type Theme } from '@mui/material/styles'
import type { Shadows } from '@mui/material/styles'

/**
 * EKA design system — strictly monochrome, light + dark.
 *
 * Hierarchy is created with contrast, typography, spacing, borders, depth
 * and motion — never with color. Both modes use only black/white/grey.
 */

/** Light-mode greys (kept for direct styling where the palette is insufficient). */
export const greys = {
  black: '#000000',
  ink: '#111111',
  charcoal: '#1A1A1A',
  graphite: '#2A2A2A',
  slate: '#444444',
  grey: '#666666',
  silver: '#888888',
  mist: '#AAAAAA',
  line: '#CCCCCC',
  paper: '#E5E5E5',
  cloud: '#F5F5F5',
  white: '#FFFFFF',
} as const

/** Dark-mode palette per spec. */
export const darkSurfaces = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#1C1C1C',
  border: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
} as const

/**
 * Semantic EKA tokens, resolved per mode. Use in `sx` as e.g.
 * `color: 'eka.textMuted'`, `bgcolor: 'eka.surface'`, `borderColor: 'eka.border'`.
 */
export interface EkaTokens {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  borderStrong: string
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  inverse: string
  inverseText: string
  inverseHover: string
}

export const ekaTokens: Record<'light' | 'dark', EkaTokens> = {
  light: {
    bg: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceAlt: '#E5E5E5',
    border: '#E5E5E5',
    borderStrong: '#CCCCCC',
    text: '#111111',
    textSecondary: '#666666',
    textMuted: '#888888',
    hover: '#F5F5F5',
    inverse: '#111111',
    inverseText: '#FFFFFF',
    inverseHover: '#333333',
  },
  dark: {
    bg: '#0A0A0A',
    surface: '#141414',
    surfaceAlt: '#1C1C1C',
    border: '#2A2A2A',
    borderStrong: '#444444',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#888888',
    hover: '#1C1C1C',
    inverse: '#FFFFFF',
    inverseText: '#000000',
    inverseHover: '#CCCCCC',
  },
}

declare module '@mui/material/styles' {
  interface Palette {
    eka: EkaTokens
  }
  interface PaletteOptions {
    eka?: EkaTokens
  }
}

export const FONT_STACK =
  '"Inter Variable", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

export const MONO_STACK =
  '"JetBrains Mono", "SFMono-Regular", Consolas, "Courier New", monospace'

function buildShadows(dark: boolean): string[] {
  const mk = (a1: number, a2: number) =>
    dark
      ? `0 2px 10px rgba(0,0,0,${a1}), 0 6px 24px rgba(0,0,0,${a2})`
      : `0 1px 3px rgba(0,0,0,${a1}), 0 4px 14px rgba(0,0,0,${a2})`
  return [
    'none',
    mk(0.14, 0.08),
    mk(0.2, 0.12),
    mk(0.28, 0.18),
    mk(0.36, 0.24),
    mk(0.44, 0.3),
    ...Array.from({ length: 25 - 6 }, () => mk(0.44, 0.3)),
  ]
}

const lightShadows = buildShadows(false) as unknown as Shadows
const darkShadows = buildShadows(true) as unknown as Shadows

/** Build the EKA theme for a given color mode. */
export function getTheme(mode: 'light' | 'dark'): Theme {
  const dark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      eka: ekaTokens[mode],
      primary: { main: dark ? greys.white : greys.black, contrastText: dark ? greys.black : greys.white },
      secondary: { main: dark ? greys.mist : greys.slate },
      background: {
        default: dark ? darkSurfaces.background : greys.white,
        paper: dark ? darkSurfaces.surface : greys.white,
      },
      text: {
        primary: dark ? darkSurfaces.textPrimary : greys.ink,
        secondary: dark ? darkSurfaces.textSecondary : greys.grey,
        disabled: dark ? greys.slate : greys.mist,
      },
      divider: dark ? darkSurfaces.border : greys.paper,
      grey: {
        50: dark ? darkSurfaces.surfaceAlt : greys.cloud,
        100: dark ? '#222222' : greys.paper,
        200: dark ? darkSurfaces.border : greys.line,
        300: dark ? greys.slate : greys.mist,
        400: dark ? greys.silver : greys.silver,
        500: dark ? greys.mist : greys.grey,
        600: dark ? greys.silver : greys.slate,
        700: dark ? greys.mist : greys.graphite,
        800: dark ? greys.line : greys.charcoal,
        900: dark ? greys.white : greys.ink,
      },
    },
    typography: {
      fontFamily: FONT_STACK,
      h1: { fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05 },
      h2: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 },
      h3: { fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.01em' },
      h4: { fontSize: '1.125rem', fontWeight: 500 },
      h5: { fontSize: '0.9375rem', fontWeight: 500 },
      h6: { fontSize: '0.8125rem', fontWeight: 600 },
      subtitle1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.7 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
      caption: { fontSize: '0.6875rem', lineHeight: 1.5, letterSpacing: '0.02em' },
      overline: {
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
      },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 6 },
    shadows: dark ? darkShadows : lightShadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
          body: {
            backgroundColor: dark ? darkSurfaces.background : greys.white,
            color: dark ? darkSurfaces.textPrimary : greys.ink,
            transition: 'background-color 0.35s ease, color 0.35s ease',
          },
          '::selection': { background: dark ? greys.white : greys.ink, color: dark ? greys.black : greys.white },
          '*:focus-visible': {
            outline: `2px solid ${dark ? greys.white : greys.ink}`,
            outlineOffset: 2,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 4, paddingInline: 20, paddingBlock: 9 },
          contained: {
            backgroundColor: dark ? greys.white : greys.black,
            color: dark ? greys.black : greys.white,
            '&:hover': { backgroundColor: dark ? greys.line : greys.graphite },
          },
          outlined: {
            borderColor: dark ? darkSurfaces.border : greys.line,
            color: dark ? darkSurfaces.textPrimary : greys.ink,
            '&:hover': {
              borderColor: dark ? greys.mist : greys.ink,
              backgroundColor: dark ? 'rgba(255,255,255,0.04)' : greys.cloud,
            },
          },
          sizeLarge: { paddingInline: 32, paddingBlock: 14, fontSize: '0.9375rem' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: dark ? darkSurfaces.textSecondary : greys.grey,
            '&:hover': {
              color: dark ? darkSurfaces.textPrimary : greys.ink,
              backgroundColor: dark ? 'rgba(255,255,255,0.06)' : greys.cloud,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: dark ? darkSurfaces.border : greys.paper },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { border: `1px solid ${dark ? darkSurfaces.border : greys.paper}` },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? darkSurfaces.surface : greys.white,
            '& fieldset': { borderColor: dark ? darkSurfaces.border : greys.line },
            '&:hover fieldset': { borderColor: dark ? greys.slate : greys.silver },
            '&.Mui-focused fieldset': {
              borderColor: dark ? greys.white : greys.ink,
              borderWidth: 1,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${dark ? darkSurfaces.border : greys.paper}`,
            backgroundColor: dark ? darkSurfaces.surface : greys.white,
          },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: dark ? darkSurfaces.border : greys.paper } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: dark ? greys.white : greys.ink,
            color: dark ? greys.black : greys.white,
            fontSize: '0.6875rem',
            padding: '6px 10px',
            borderRadius: 4,
          },
          arrow: { color: dark ? greys.white : greys.ink },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${dark ? darkSurfaces.border : greys.paper}`,
            borderRadius: 6,
            backgroundColor: dark ? darkSurfaces.surfaceAlt : greys.white,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? darkSurfaces.surfaceAlt : greys.cloud,
            color: dark ? darkSurfaces.textPrimary : greys.ink,
            borderColor: dark ? darkSurfaces.border : greys.line,
            fontSize: '0.6875rem',
          },
          outlined: { backgroundColor: 'transparent' },
        },
      },
      MuiCircularProgress: {
        defaultProps: { size: 16, thickness: 5 },
        styleOverrides: { root: { color: dark ? greys.mist : greys.grey } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: dark ? darkSurfaces.surfaceAlt : greys.paper },
          bar: { backgroundColor: dark ? greys.mist : greys.slate },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            '&.Mui-selected': {
              backgroundColor: dark ? 'rgba(255,255,255,0.06)' : greys.cloud,
              '&:hover': { backgroundColor: dark ? 'rgba(255,255,255,0.09)' : greys.paper },
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? greys.white : greys.ink,
            color: dark ? greys.black : greys.white,
            fontSize: '0.75rem',
            fontWeight: 600,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            border: `1px solid ${dark ? darkSurfaces.border : greys.paper}`,
            backgroundColor: dark ? darkSurfaces.surface : greys.white,
          },
        },
      },
    },
  })
}

export const lightTheme = getTheme('light')
export const darkTheme = getTheme('dark')
