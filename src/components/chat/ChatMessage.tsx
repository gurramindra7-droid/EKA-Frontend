import { Box, Typography } from '@mui/material'
import AssistantHeader from './AssistantHeader'
import FeedbackControls from './FeedbackControls'
import SourceList from '../sources/SourceList'
import type { ChatMessage } from '../../types/chat'

/** A single conversation turn. */
export default function ChatMessageItem({
  message,
  onFeedback,
}: {
  message: ChatMessage
  onFeedback: (messageId: string, feedback: ChatMessage['feedback']) => void
}) {
  if (message.role === 'user') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', animation: 'ekaRise 0.35s ease both' }}>
        <Box
          sx={{
            maxWidth: { xs: '88%', sm: '72%' },
            px: 2,
            py: 1.25,
            bgcolor: 'eka.surfaceAlt',
            color: 'eka.text',
            borderRadius: '14px',
            borderBottomRightRadius: '4px',
          }}
        >
          <Typography sx={{ fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ animation: 'ekaRise 0.45s ease both' }}>
      <AssistantHeader />
      <Typography sx={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'eka.text', whiteSpace: 'pre-wrap' }}>
        {message.content}
      </Typography>
      {message.sources && message.sources.length > 0 && <SourceList sources={message.sources} />}
      <FeedbackControls value={message.feedback} copyText={message.content} onChange={(fb) => onFeedback(message.id, fb)} />
    </Box>
  )
}
