import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import { useThemeMode, type ThemeMode } from '../../hooks/useTheme'
import { replayIntro } from '../../services/intro'
import { MONO_STACK } from '../../theme/theme'

/** Workspace settings — appearance and intro playback. Monochrome only. */
export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useThemeMode()

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="eka-settings-title">
      <DialogTitle id="eka-settings-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600 }}>
        Settings
        <IconButton onClick={onClose} aria-label="Close settings" size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Section label="APPEARANCE">
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={mode}
            onChange={(_, v: ThemeMode | null) => v && setMode(v)}
            aria-label="Theme"
            sx={{
              '& .MuiToggleButton-root': {
                gap: 1,
                textTransform: 'none',
                color: 'eka.textSecondary',
                borderColor: 'eka.border',
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'eka.inverse', color: 'eka.inverseText' },
              },
            }}
          >
            <ToggleButton value="light"><LightModeOutlinedIcon sx={{ fontSize: 16 }} /> Light</ToggleButton>
            <ToggleButton value="dark"><DarkModeOutlinedIcon sx={{ fontSize: 16 }} /> Dark</ToggleButton>
          </ToggleButtonGroup>
        </Section>
        <Divider sx={{ my: 2.5 }} />
        <Section label="INTRODUCTION">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: 'eka.textSecondary' }}>Watch the EKA intro again.</Typography>
            <Button variant="outlined" size="small" onClick={replayIntro}>Replay intro</Button>
          </Box>
        </Section>
      </DialogContent>
    </Dialog>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ mb: 1.25, fontFamily: MONO_STACK, fontSize: '0.625rem', letterSpacing: '0.22em', color: 'eka.textMuted' }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}
