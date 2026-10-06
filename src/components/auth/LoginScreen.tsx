import { Box, Button, CircularProgress, Divider, Typography } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import { isFirebaseConfigured } from '../../services/firebase'
import { greys, MONO_STACK } from '../../theme/theme'

/**
 * Premium enterprise login.
 *
 * Firebase-ready: uses the auth service abstraction; when Firebase env
 * vars are absent the same flow signs into a demo session so the product
 * can be evaluated without credentials.
 */
export default function LoginScreen() {
  const { signIn, loading, error } = useAuth()

  const showError = error

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: greys.black,
        color: greys.white,
        overflow: 'hidden',
      }}
    >
      {/* Ambient canvas: static constellation grid, monochrome */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.10) 0, transparent 1.5px), radial-gradient(circle at 74% 60%, rgba(255,255,255,0.07) 0, transparent 1.5px), radial-gradient(circle at 42% 80%, rgba(255,255,255,0.06) 0, transparent 1.5px)',
          backgroundSize: '640px 640px, 520px 520px, 780px 780px',
        }}
      />
      {/* Hairline frame */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', inset: 24, border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }}
      />

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: 420, width: '100%', animation: 'ekaRise 0.9s ease both' }}>
          <Typography
            sx={{
              fontFamily: MONO_STACK,
              fontSize: '0.6875rem',
              letterSpacing: '0.42em',
              color: greys.silver,
              mb: 5,
            }}
          >
            CW AI LABS
          </Typography>

          <Typography sx={{ fontWeight: 200, fontSize: { xs: '4rem', sm: '5.5rem' }, letterSpacing: '0.14em', pl: '0.14em', lineHeight: 1 }}>
            EKA
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '0.8125rem', letterSpacing: '0.3em', color: greys.mist }}>
            ENTERPRISE KNOWLEDGE ASSISTANT
          </Typography>

          <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.10)' }} />

          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={signIn}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} sx={{ color: greys.black }} />
              ) : (
                <GoogleMark />
              )
            }
            sx={{
              bgcolor: greys.white,
              color: greys.black,
              border: `1px solid ${greys.white}`,
              py: 1.6,
              fontWeight: 600,
              letterSpacing: '0.06em',
              '&:hover': { bgcolor: greys.line },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.85)', color: greys.ink },
            }}
          >
            {loading ? 'CONNECTING…' : 'Continue with Google'}
          </Button>

          {showError && (
            <Typography role="alert" sx={{ mt: 2.5, fontSize: '0.8125rem', color: greys.line }}>
              {showError}
            </Typography>
          )}

          <Typography sx={{ mt: 4, fontSize: '0.6875rem', letterSpacing: '0.22em', color: greys.grey }}>
            SECURE ENTERPRISE ACCESS
          </Typography>

          {!isFirebaseConfigured && (
            <Typography sx={{ mt: 1.5, fontSize: '0.625rem', letterSpacing: '0.14em', color: greys.slate }}>
              DEVELOPMENT MODE — DEMO SESSION (FIREBASE ENV VARS NOT SET)
            </Typography>
            )}
        </Box>
      </Box>

      <Typography
        sx={{
          position: 'relative',
          textAlign: 'center',
          pb: 4,
          fontSize: '0.625rem',
          letterSpacing: '0.26em',
          color: greys.slate,
        }}
      >
        ENGINEERED BY CW AI LABS
      </Typography>
    </Box>
  )
}

/** Monochrome inline Google "G" — no colored brand marks in EKA. */
function GoogleMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 18, height: 18, display: 'block', fill: 'currentColor' }}
      aria-hidden
    >
      <path d="M21.35 11.1h-9.17v2.96h5.34c-.23 1.4-1.64 4.1-5.34 4.1-3.22 0-5.85-2.66-5.85-5.95 0-3.28 2.63-5.95 5.85-5.95 1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.83 3.6 14.78 2.6 12.18 2.6 7.12 2.6 3 6.72 3 11.81s4.12 9.2 9.18 9.2c5.3 0 8.81-3.72 8.81-8.96 0-.6-.06-1.06-.15-1.47z" />
    </Box>
  )
}
