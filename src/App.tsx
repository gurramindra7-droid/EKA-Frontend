import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import { getTheme } from './theme/theme'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useThemeMode } from './hooks/useTheme'
import { markIntroSeen, shouldPlayIntro } from './services/intro'

// The 3D knowledge scene (Three.js / R3F) is only needed for the intro;
// lazy-loading keeps it out of the main application bundle.
const IntroPage = lazy(() => import('./pages/IntroPage'))

/**
 * EKA — Enterprise Knowledge Assistant. Engineered by CW AI Labs.
 *
 * Stages: cinematic intro → (login, when Firebase is configured and no
 * session exists) → chat workspace.
 *
 * The intro plays once per browser session. Append `?intro` to the URL,
 * or use Settings → "Replay intro", to watch it again.
 */

function ApplicationFlow() {
  const { user, loading } = useAuth()
  const [introDone, setIntroDone] = useState<boolean>(() => !shouldPlayIntro())

  const handleEnter = useCallback(() => {
    markIntroSeen()
    setIntroDone(true)
  }, [])

  if (!introDone) {
    return (
      <Suspense fallback={<Box sx={{ position: 'fixed', inset: 0, backgroundColor: '#000' }} aria-label="Loading EKA" />}>
        <IntroPage onEnter={handleEnter} />
      </Suspense>
    )
  }

  if (loading) return <Box sx={{ position: 'fixed', inset: 0, backgroundColor: 'background.default' }} />
  return user ? <ChatPage /> : <LoginPage />
}

export default function App() {
  const { mode } = useThemeMode()
  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ApplicationFlow />
      </AuthProvider>
    </ThemeProvider>
  )
}
