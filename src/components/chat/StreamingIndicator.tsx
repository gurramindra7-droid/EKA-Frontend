import { Box, Typography } from '@mui/material'
import type { ChatPhase } from '../../types/chat'

const STATUS_LABEL: Partial<Record<ChatPhase, string>> = {
  searching: 'Searching enterprise knowledge',
  retrieving: 'Retrieving sources',
  generating: 'Composing answer',
}

/** Loading state before the first streamed token. Calm, grayscale. */
export default function StreamingIndicator({ phase }: { phase: ChatPhase }) {
  const label = STATUS_LABEL[phase]
  if (!label) return null
  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, animation: 'ekaFadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', gap: 0.5 }} aria-hidden>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'eka.textSecondary', animation: `ekaPulse 1.2s ${i * 0.16}s ease-in-out infinite` }}
          />
        ))}
      </Box>
      <Typography sx={{ fontSize: '0.8125rem', color: 'eka.textSecondary' }}>{label}…</Typography>
    </Box>
  )
}
