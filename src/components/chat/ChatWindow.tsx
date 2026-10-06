import { useEffect, useRef } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import ChatInput from './ChatInput'
import ChatMessageItem from './ChatMessage'
import StreamingIndicator from './StreamingIndicator'
import AssistantHeader from './AssistantHeader'
import SourceList from '../sources/SourceList'
import type { ChatMessage as ChatMessageType, Source, ChatPhase } from '../../types/chat'

interface ChatWindowProps {
  messages: ChatMessageType[]
  phase: ChatPhase
  streamingText: string
  pendingSources: Source[]
  error: string | null
  busy: boolean
  onSend: (message: string) => void
  onStop: () => void
  onRetry: () => void
  onFeedback: (messageId: string, feedback: ChatMessageType['feedback']) => void
}

/**
 * The live conversation: completed turns, the in-flight streaming answer
 * (loading → streaming → sources), and error/retry.
 */
export default function ChatWindow({
  messages,
  phase,
  streamingText,
  pendingSources,
  error,
  busy,
  onSend,
  onStop,
  onRetry,
  onFeedback,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamingText, phase, error])

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: 'eka.bg' }}>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 780, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} onFeedback={onFeedback} />
          ))}

          {busy && (
            <Box sx={{ animation: 'ekaRise 0.3s ease both' }}>
              <AssistantHeader />
              {streamingText ? (
                <>
                  <Typography sx={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'eka.text', whiteSpace: 'pre-wrap' }}>
                    {streamingText}
                    <Box
                      component="span"
                      aria-hidden
                      sx={{ display: 'inline-block', width: 7, height: 15, ml: 0.5, bgcolor: 'eka.textMuted', verticalAlign: 'text-bottom', animation: 'ekaBlink 1s step-end infinite' }}
                    />
                  </Typography>
                  {pendingSources.length > 0 && <SourceList sources={pendingSources} />}
                </>
              ) : (
                <StreamingIndicator phase={phase} />
              )}
            </Box>
          )}

          {error && (
            <Box
              role="alert"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                px: 2,
                py: 1.5,
                border: '1px solid',
                borderColor: 'eka.borderStrong',
                borderRadius: '10px',
                bgcolor: 'eka.surface',
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 18, color: 'eka.text' }} />
              <Typography sx={{ flex: 1, minWidth: 180, fontSize: '0.8125rem', color: 'eka.text' }}>
                EKA couldn't complete that answer. {error}
              </Typography>
              <Button size="small" variant="outlined" startIcon={<ReplayRoundedIcon sx={{ fontSize: 16 }} />} onClick={onRetry}>
                Retry
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1.5, bgcolor: 'eka.bg' }}>
        <Box sx={{ maxWidth: 780, mx: 'auto' }}>
          <ChatInput onSend={onSend} onStop={onStop} busy={busy} />
          <Typography sx={{ mt: 1.25, textAlign: 'center', fontSize: '0.6875rem', color: 'eka.textMuted' }}>
            EKA answers from your enterprise sources. Verify critical information.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
