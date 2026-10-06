import { Box, Typography } from '@mui/material'
import SourceCard from './SourceCard'
import { MONO_STACK } from '../../theme/theme'
import type { Source } from '../../types/chat'

/** "SOURCES" block beneath an assistant answer. */
export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography sx={{ mb: 1.25, fontFamily: MONO_STACK, fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.24em', color: 'eka.textMuted' }}>
        SOURCES
      </Typography>
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(250px, 1fr))' } }}>
        {sources.map((source, i) => (
          <SourceCard key={source.id} source={source} index={i} />
        ))}
      </Box>
    </Box>
  )
}
