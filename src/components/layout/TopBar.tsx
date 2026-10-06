import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { useLayout } from './AppLayout'
import ThemeToggle from '../common/ThemeToggle'
import UserMenu from '../common/UserMenu'
import { MONO_STACK } from '../../theme/theme'

/** Top application bar — identity, gateway status, theme toggle, account. */
export default function TopBar() {
  const { setMobileOpen } = useLayout()

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1.5, sm: 3 },
        height: 64,
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'eka.border',
        bgcolor: 'eka.bg',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Box sx={{ display: { md: 'none' } }}>
        <IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <MenuRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '0.28em', color: 'eka.text' }}>EKA</Typography>
        <Typography
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontSize: '0.75rem',
            color: 'eka.textSecondary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Enterprise Knowledge Assistant
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Connected to the enterprise knowledge gateway">
        <Box role="status" aria-label="Gateway status: connected" sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 1 }}>
          <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'eka.text' }} />
          <Typography sx={{ fontSize: '0.625rem', letterSpacing: '0.2em', color: 'eka.textMuted', fontFamily: MONO_STACK }}>
            CONNECTED
          </Typography>
        </Box>
      </Tooltip>

      <ThemeToggle />
      <UserMenu />
    </Box>
  )
}
