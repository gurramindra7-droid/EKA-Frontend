import { useState } from 'react'
import { Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { useAuth } from '../../hooks/useAuth'
import { initialsOf } from './initials'
import SettingsDialog from './SettingsDialog'
import ProfileDialog from './ProfileDialog'

/** Avatar + account menu for the top bar. */
export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <Tooltip title="Account">
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Open account menu" size="small" sx={{ p: 0.25 }}>
          <Avatar src={user?.photoURL} sx={{ width: 30, height: 30, fontSize: '0.6875rem' }}>
            {initialsOf(user?.displayName)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 2, pt: 1.25, pb: 1.25 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.displayName ?? 'Enterprise User'}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'eka.textSecondary' }}>{user?.email ?? ''}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); setProfileOpen(true) }}>
          <ListItemIcon><PersonOutlineRoundedIcon sx={{ fontSize: 18 }} /></ListItemIcon>Profile
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); setSettingsOpen(true) }}>
          <ListItemIcon><SettingsOutlinedIcon sx={{ fontSize: 18 }} /></ListItemIcon>Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); void signOut() }}>
          <ListItemIcon><LogoutRoundedIcon sx={{ fontSize: 18 }} /></ListItemIcon>Logout
        </MenuItem>
      </Menu>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
