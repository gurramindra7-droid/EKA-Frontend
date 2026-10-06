import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'

/**
 * Layout context — owns sidebar presentation state.
 *
 * Desktop  : permanent expanded sidebar with collapse-to-rail
 * Mobile   : temporary drawer overlay, toggled from the top bar
 */
interface LayoutContextValue {
  railMode: boolean
  toggleRail: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within <AppLayout>')
  return ctx
}

export default function AppLayout({
  sidebar,
  topbar,
  children,
}: {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
}) {
  const [railMode, setRailMode] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleRail = useCallback(() => setRailMode((v) => !v), [])
  const setMobileOpenCb = useCallback((open: boolean) => setMobileOpen(open), [])

  const value = useMemo(
    () => ({ railMode, toggleRail, mobileOpen, setMobileOpen: setMobileOpenCb }),
    [railMode, toggleRail, mobileOpen, setMobileOpenCb],
  )

  return (
    <LayoutContext.Provider value={value}>
      <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'eka.bg', animation: 'ekaFadeIn 0.6s ease both' }}>
        {sidebar}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {topbar}
          <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </LayoutContext.Provider>
  )
}
