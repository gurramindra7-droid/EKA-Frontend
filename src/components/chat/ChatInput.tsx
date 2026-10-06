import { useState, type KeyboardEvent } from 'react'
import { Box, IconButton, InputBase, Tooltip } from '@mui/material'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'

/**
 * Chat composer. Enter sends; Shift+Enter inserts a newline.
 * While a response streams, the send control becomes Stop.
 */
export default function ChatInput({
  onSend,
  onStop,
  busy,
  autoFocus = true,
}: {
  onSend: (message: string) => void
  onStop?: () => void
  busy: boolean
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || busy) return
    onSend(trimmed)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const active = busy || canSend

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        pl: 2,
        pr: 1,
        py: 1,
        border: '1px solid',
        borderColor: 'eka.borderStrong',
        borderRadius: '14px',
        bgcolor: 'eka.bg',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:focus-within': { borderColor: 'eka.text', boxShadow: 2 },
      }}
    >
      <InputBase
        multiline
        maxRows={6}
        fullWidth
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask EKA anything..."
        inputProps={{ 'aria-label': 'Ask EKA anything' }}
        sx={{
          py: 0.75,
          fontSize: '0.9375rem',
          color: 'eka.text',
          '& textarea::placeholder': { color: 'eka.textMuted', opacity: 1 },
        }}
      />
      <Tooltip title={busy ? 'Stop generating' : 'Send'}>
        <span>
          <IconButton
            onClick={busy ? onStop : submit}
            disabled={!busy && !canSend}
            aria-label={busy ? 'Stop generating' : 'Send message'}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: active ? 'eka.inverse' : 'eka.surfaceAlt',
              color: active ? 'eka.inverseText' : 'eka.textMuted',
              '&:hover': { bgcolor: active ? 'eka.inverseHover' : 'eka.surfaceAlt', color: active ? 'eka.inverseText' : 'eka.textMuted' },
              '&.Mui-disabled': { bgcolor: 'eka.surfaceAlt', color: 'eka.textMuted' },
            }}
          >
            {busy ? <StopRoundedIcon sx={{ fontSize: 18 }} /> : <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )
}
