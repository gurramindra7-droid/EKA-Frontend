import { useState, type ReactNode } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { useAuth } from '../../hooks/useAuth'
import { useLayout } from './AppLayout'
import { MONO_STACK } from '../../theme/theme'
import type { ConversationSummary } from '../../types/chat'
import SettingsDialog from '../common/SettingsDialog'
import ProfileDialog from '../common/ProfileDialog'

const WIDTH = 272
const RAIL = 68

/**
 * Conversations sidebar.
 *
 * Desktop : permanent panel, collapsible to an icon rail
 * Mobile  : temporary drawer, opened from the top bar
 */
export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: {
  conversations: ConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
}) {
  const { signOut } = useAuth()
  const { railMode, toggleRail, mobileOpen, setMobileOpen } = useLayout()
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const close = () => setMobileOpen(false)

  const content = (rail: boolean, inDrawer: boolean) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: rail ? RAIL : WIDTH,
        bgcolor: 'eka.surface',
        borderRight: '1px solid',
        borderColor: 'eka.border',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: rail ? 'center' : 'space-between',
          px: rail ? 1 : 2.5,
          height: 64,
          flexShrink: 0,
        }}
      >
        {!rail && (
          <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '0.28em', color: 'eka.text' }}>
            EKA
          </Typography>
        )}
        {inDrawer ? (
          <IconButton onClick={close} aria-label="Close navigation" size="small">
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
        ) : (
          <Tooltip title={rail ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton onClick={toggleRail} aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'} size="small">
              {rail ? <MenuRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* New chat */}
      <Box sx={{ px: rail ? 1.25 : 2, pb: 2.5 }}>
        {rail ? (
          <Tooltip title="New Chat" placement="right">
            <IconButton
              onClick={() => {
                onNewChat()
                close()
              }}
              aria-label="New Chat"
              sx={{
                width: 42,
                height: 42,
                mx: 'auto',
                display: 'flex',
                bgcolor: 'eka.inverse',
                color: 'eka.inverseText',
                borderRadius: 1.5,
                '&:hover': { bgcolor: 'eka.inverseHover', color: 'eka.inverseText' },
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onNewChat()
              close()
            }}
            startIcon={<AddRoundedIcon fontSize="small" />}
            sx={{ justifyContent: 'flex-start', px: 2, py: 1.15, fontWeight: 500 }}
          >
            New Chat
          </Button>
        )}
      </Box>

      {/* Recent */}
      {!rail && (
        <Typography
          sx={{ px: 2.75, pb: 1, fontFamily: MONO_STACK, fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.24em', color: 'eka.textMuted' }}
        >
          RECENT
        </Typography>
      )}
      <List dense disablePadding sx={{ flex: 1, overflowY: 'auto', px: rail ? 1.25 : 1.25, pb: 1 }}>
        {conversations.map((conv) => {
          const active = conv.id === activeId
          const item = (
            <ListItemButton
              key={conv.id}
              selected={active}
              onClick={() => {
                onSelect(conv.id)
                close()
              }}
              aria-label={rail ? conv.title : undefined}
              sx={{
                mb: 0.25,
                minHeight: 38,
                justifyContent: rail ? 'center' : 'flex-start',
                '&.Mui-selected': { bgcolor: 'eka.surfaceAlt' },
                '&.Mui-selected:hover': { bgcolor: 'eka.surfaceAlt' },
              }}
            >
              <ChatBubbleOutlineRoundedIcon
                sx={{ fontSize: 16, mr: rail ? 0 : 1.5, color: active ? 'eka.text' : 'eka.textMuted' }}
              />
              {!rail && (
                <ListItemText
                  primary={conv.title}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      sx: { fontSize: '0.8125rem', fontWeight: active ? 500 : 400, color: active ? 'eka.text' : 'eka.textSecondary' },
                    },
                  }}
                />
              )}
            </ListItemButton>
          )
          return rail ? (
            <Tooltip key={conv.id} title={conv.title} placement="right">
              {item}
            </Tooltip>
          ) : (
            item
          )
        })}
      </List>

      <Divider />

      {/* Bottom actions */}
      <List dense disablePadding sx={{ px: 1.25, py: 1.25 }}>
        <NavAction rail={rail} label="Settings" icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />} onClick={() => setSettingsOpen(true)} />
        <NavAction rail={rail} label="Help" icon={<HelpOutlineRoundedIcon sx={{ fontSize: 18 }} />} onClick={(e) => setHelpAnchor(e.currentTarget)} />
        <NavAction rail={rail} label="Profile" icon={<PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />} onClick={() => setProfileOpen(true)} />
        <NavAction rail={rail} label="Logout" icon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />} onClick={() => void signOut()} />
      </List>
    </Box>
  )

  return (
    <>
      {/* Desktop — permanent */}
      <Box component="aside" aria-label="Navigation" sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
        {content(railMode, false)}
      </Box>

      {/* Mobile — temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={close}
        ModalProps={{ keepMounted: true }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.5)' } } }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: WIDTH, border: 'none' } }}
      >
        {content(false, true)}
      </Drawer>

      <Menu
        anchorEl={helpAnchor}
        open={Boolean(helpAnchor)}
        onClose={() => setHelpAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={() => setHelpAnchor(null)}>Documentation</MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>Keyboard shortcuts</MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>Contact support</MenuItem>
      </Menu>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

function NavAction({
  rail,
  label,
  icon,
  onClick,
}: {
  rail: boolean
  label: string
  icon: ReactNode
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const button = (
    <ListItemButton
      onClick={onClick}
      aria-label={label}
      sx={{ minHeight: 36, justifyContent: rail ? 'center' : 'flex-start', color: 'eka.textSecondary', '&:hover': { color: 'eka.text' } }}
    >
      <Box sx={{ display: 'flex', mr: rail ? 0 : 1.5 }}>{icon}</Box>
      {!rail && <Typography sx={{ fontSize: '0.8125rem', color: 'inherit' }}>{label}</Typography>}
    </ListItemButton>
  )
  return rail ? (
    <Tooltip title={label} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  )
}
