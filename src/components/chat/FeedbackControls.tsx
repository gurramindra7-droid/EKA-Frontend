import { Box, IconButton, Tooltip } from '@mui/material'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded'
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined'
import ThumbDownRoundedIcon from '@mui/icons-material/ThumbDownRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import type { FeedbackKind } from '../../types/chat'

/** Helpful / Not helpful feedback, monochrome. */
export default function FeedbackControls({
  value,
  onChange,
  copyText,
}: {
  value?: FeedbackKind
  onChange: (feedback: FeedbackKind) => void
  copyText?: string
}) {
  const btn = (selected: boolean) => ({
    width: 30,
    height: 30,
    borderRadius: '8px',
    color: selected ? 'eka.text' : 'eka.textMuted',
    bgcolor: selected ? 'eka.surfaceAlt' : 'transparent',
    '&:hover': { color: 'eka.text', bgcolor: 'eka.hover' },
  })
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 1.5, ml: -0.75 }}>
      <Tooltip title={value === 'helpful' ? 'Marked helpful' : 'Helpful'}>
        <IconButton size="small" aria-pressed={value === 'helpful'} aria-label="Helpful" onClick={() => onChange('helpful')} sx={btn(value === 'helpful')}>
          {value === 'helpful' ? <ThumbUpRoundedIcon sx={{ fontSize: 15 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
      <Tooltip title={value === 'not_helpful' ? 'Marked not helpful' : 'Not helpful'}>
        <IconButton size="small" aria-pressed={value === 'not_helpful'} aria-label="Not helpful" onClick={() => onChange('not_helpful')} sx={btn(value === 'not_helpful')}>
          {value === 'not_helpful' ? <ThumbDownRoundedIcon sx={{ fontSize: 15 }} /> : <ThumbDownOutlinedIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
      {copyText && (
        <Tooltip title="Copy answer">
          <IconButton size="small" aria-label="Copy answer" onClick={() => void navigator.clipboard?.writeText(copyText)} sx={btn(false)}>
            <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
