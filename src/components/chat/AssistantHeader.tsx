import { Box, Typography } from '@mui/material'

/** "EKA" identity row shown above every assistant response. */
export default function AssistantHeader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          bgcolor: 'eka.inverse',
          color: 'eka.inverseText',
          fontSize: '0.5rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        EKA
      </Box>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.12em', color: 'eka.text' }}>EKA</Typography>
    </Box>
  )
}
