import { Avatar, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useAuth } from '../../hooks/useAuth'
import { initialsOf } from './initials'
import { MONO_STACK } from '../../theme/theme'

/** Read-only profile summary for the signed-in user. */
export default function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const rows: [string, string][] = [
    ['Name', user?.displayName ?? '—'],
    ['Email', user?.email || '—'],
    ['Sign-in', user?.provider === 'google' ? 'Google (Firebase)' : 'Demo session'],
  ]
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="eka-profile-title">
      <DialogTitle id="eka-profile-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600 }}>
        Profile
        <IconButton onClick={onClose} aria-label="Close profile" size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={user?.photoURL} sx={{ width: 48, height: 48, fontSize: '0.9rem' }}>{initialsOf(user?.displayName)}</Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{user?.displayName ?? 'Enterprise User'}</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'eka.textSecondary' }}>{user?.email}</Typography>
          </Box>
        </Box>
        {rows.map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderTop: '1px solid', borderColor: 'eka.border' }}>
            <Typography sx={{ fontFamily: MONO_STACK, fontSize: '0.6875rem', letterSpacing: '0.16em', color: 'eka.textMuted' }}>{k.toUpperCase()}</Typography>
            <Typography sx={{ fontSize: '0.8125rem' }}>{v}</Typography>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  )
}
