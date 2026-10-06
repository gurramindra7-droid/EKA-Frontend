import { Box, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ChatInput from './ChatInput'
import { MONO_STACK } from '../../theme/theme'

const EXAMPLES = [
  'How do I connect to the company VPN?',
  'Where can I find the leave policy?',
  'What is the employee onboarding process?',
  'How do I request database access?',
]

/** Landing surface of a new chat. */
export default function EmptyState({ onSend }: { onSend: (query: string) => void }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', bgcolor: 'eka.bg' }}>
      <Box sx={{ m: 'auto', width: '100%', maxWidth: 720, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 }, textAlign: 'center' }}>
        <Typography
          component="h1"
          sx={{ m: 0, fontWeight: 300, fontSize: { xs: '3.5rem', sm: '4.75rem' }, letterSpacing: '0.24em', pl: '0.24em', lineHeight: 1, color: 'eka.text', animation: 'ekaRise 0.7s ease both' }}
        >
          EKA
        </Typography>
        <Typography sx={{ mt: 1.5, fontFamily: MONO_STACK, fontSize: '0.6875rem', letterSpacing: '0.26em', color: 'eka.textMuted', animation: 'ekaRise 0.7s 0.06s ease both' }}>
          ENTERPRISE KNOWLEDGE ASSISTANT
        </Typography>
        <Typography sx={{ mt: 4, fontSize: { xs: '1.125rem', sm: '1.375rem' }, fontWeight: 400, color: 'eka.text', animation: 'ekaRise 0.7s 0.12s ease both' }}>
          Your enterprise knowledge, in one place.
        </Typography>

        <Box sx={{ mt: 4, animation: 'ekaRise 0.7s 0.18s ease both' }}>
          <ChatInput onSend={onSend} busy={false} />
        </Box>

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
            textAlign: 'left',
            animation: 'ekaRise 0.7s 0.24s ease both',
          }}
        >
          {EXAMPLES.map((example) => (
            <Box
              key={example}
              component="button"
              type="button"
              onClick={() => onSend(example)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                px: 2,
                py: 1.5,
                border: '1px solid',
                borderColor: 'eka.border',
                borderRadius: '10px',
                bgcolor: 'eka.bg',
                color: 'eka.textSecondary',
                font: 'inherit',
                fontSize: '0.8125rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease',
                '& svg': { color: 'eka.textMuted', transition: 'transform 0.2s ease' },
                '&:hover': { borderColor: 'eka.borderStrong', color: 'eka.text', bgcolor: 'eka.surface' },
                '&:hover svg': { color: 'eka.text', transform: 'translateX(2px)' },
              }}
            >
              {example}
              <ArrowForwardRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
