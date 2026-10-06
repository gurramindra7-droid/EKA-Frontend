import { Box, Typography } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import type { Source } from '../../types/chat'

/**
 * Source / citation card: document title, then "System · Page N".
 * Entirely grayscale; trust comes from precision, not color.
 */
export default function SourceCard({ source, index }: { source: Source; index?: number }) {
  const meta = [source.sourceSystem, source.page !== undefined ? `Page ${source.page}` : source.section]
    .filter(Boolean)
    .join(' · ')

  const linkProps = source.url ? { component: 'a' as const, href: source.url, target: '_blank', rel: 'noreferrer' } : {}

  return (
    <Box
      {...linkProps}
      title={source.title}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        border: '1px solid',
        borderColor: 'eka.border',
        borderRadius: '10px',
        bgcolor: 'eka.surface',
        color: 'inherit',
        textDecoration: 'none',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        '&:hover': { borderColor: 'eka.borderStrong' },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
          border: '1px solid',
          borderColor: 'eka.border',
          bgcolor: 'eka.bg',
          color: 'eka.textSecondary',
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'eka.text',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {source.title}
        </Typography>
        {meta && (
          <Typography noWrap sx={{ mt: 0.25, fontSize: '0.75rem', color: 'eka.textSecondary' }}>
            {meta}
          </Typography>
        )}
      </Box>
      {typeof index === 'number' && (
        <Typography sx={{ fontSize: '0.6875rem', color: 'eka.textMuted', fontVariantNumeric: 'tabular-nums' }}>{index + 1}</Typography>
      )}
      {source.url && <OpenInNewRoundedIcon sx={{ fontSize: 14, color: 'eka.textMuted' }} />}
    </Box>
  )
}
