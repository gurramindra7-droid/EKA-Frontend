import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, streamChat } from '../services/api'
import type { ChatMessage, ChatPhase, Source } from '../types/chat'

export interface ChatState {
  messages: ChatMessage[]
  phase: ChatPhase
  streamingText: string
  pendingSources: Source[]
  error: string | null
  isBusy: boolean
}

interface UseChatResult extends ChatState {
  send: (content: string) => void
  cancel: () => void
  retry: () => void
  reset: () => void
  setFeedback: (messageId: string, feedback: ChatMessage['feedback']) => void
}

function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Chat orchestration hook.
 *
 * Owns the full streaming lifecycle without coupling the UI to the
 * transport: user message → status phases → sources → streamed deltas →
 * final message → done/error. Supports cancel and retry.
 */
export function useChat(initialMessages: ChatMessage[] = []): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [phase, setPhase] = useState<ChatPhase>('idle')
  const [streamingText, setStreamingText] = useState('')
  const [pendingSources, setPendingSources] = useState<Source[]>([])
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<{ cancel: () => void } | null>(null)
  const lastRequestRef = useRef<string | null>(null)
  const pendingSourcesRef = useRef<Source[]>([])
  const streamTextRef = useRef('')

  // Keep a ref mirror so stream callbacks always read latest sources.
  useEffect(() => {
    pendingSourcesRef.current = pendingSources
  }, [pendingSources])

  const cancel = useCallback(() => {
    controllerRef.current?.cancel()
    controllerRef.current = null
    setPhase('idle')
    setStreamingText('')
    setPendingSources([])
  }, [])

  const runStream = useCallback((content: string, baseMessages: ChatMessage[]) => {
    setError(null)
    setPhase('searching')
    setStreamingText('')
    streamTextRef.current = ''
    setPendingSources([])
    lastRequestRef.current = content

    const userMessage = createUserMessage(content)
    setMessages([...baseMessages, userMessage])

    controllerRef.current = streamChat(
      { message: content, stream: true },
      {
        onStatus: (next) => setPhase(next),
        onSources: (sources) => {
          pendingSourcesRef.current = sources
          setPendingSources(sources)
          setPhase('generating')
        },
        onDelta: (text) => {
          streamTextRef.current += text
          setStreamingText(streamTextRef.current)
          setPhase('streaming')
        },
        onDone: ({ messageId }) => {
          // Commit the streamed text as the final message (no side effects inside state updaters).
          const finalMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: streamTextRef.current,
            createdAt: new Date().toISOString(),
            sources: [...pendingSourcesRef.current],
          }
          setMessages((prev) => [...prev, finalMessage])
          streamTextRef.current = ''
          setPendingSources([])
          setStreamingText('')
          setPhase('complete')
          controllerRef.current = null
        },
        onError: (err: ApiError) => {
          setError(err.message)
          setPhase('error')
          controllerRef.current = null
        },
      },
    )
  }, [])

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      const canSend = phase === 'idle' || phase === 'complete' || phase === 'error'
      if (!trimmed || !canSend) return
      runStream(trimmed, messages)
    },
    [messages, phase, runStream],
  )

  const retry = useCallback(() => {
    if (lastRequestRef.current) {
      // Drop the failed exchange back to the last good state.
      runStream(lastRequestRef.current, messages.filter((m, i) => !(i === messages.length - 1 && m.role === 'user')))
    }
  }, [messages, runStream])

  const reset = useCallback(() => {
    controllerRef.current?.cancel()
    controllerRef.current = null
    setMessages([])
    setPhase('idle')
    setStreamingText('')
    setPendingSources([])
    setError(null)
    lastRequestRef.current = null
  }, [])

  const setFeedback = useCallback((messageId: string, feedback: ChatMessage['feedback']) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m)),
    )
  }, [])

  return {
    messages,
    phase,
    streamingText,
    pendingSources,
    error,
    isBusy: phase !== 'idle' && phase !== 'complete' && phase !== 'error',
    send,
    cancel,
    retry,
    reset,
    setFeedback,
  }
}
