import { IconButton, Tooltip } from '@mui/material'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useThemeMode } from '../../hooks/useTheme'

/**
 * Light/dark toggle for the top bar and menus. Monochrome icons only.
 */
export default function ThemeToggle() {
  const { mode, toggle } = useThemeMode()
  const next = mode === 'light' ? 'dark' : 'light'

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton
        onClick={toggle}
        aria-label={`Switch to ${next} mode`}
        size="small"
      >
        {mode === 'light' ? (
          <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
        ) : (
          <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  )
}
