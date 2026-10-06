import type {
  ChatMessage,
  ChatPhase,
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationSummary,
  FeedbackKind,
  Source,
  StreamEvent,
} from '../types/chat'

/**
 * Centralized API layer for EKA.
 *
 * Flow: React → api.ts → Node/Express gateway → FastAPI RAG service.
 * Components never talk to the RAG backend directly.
 *
 * All endpoints are configurable via env:
 *   VITE_API_BASE_URL  — gateway base URL (e.g. https://api.eka.internal)
 *   VITE_USE_MOCK      — "true" forces the mock transport (default until
 *                        real endpoints exist)
 *
 * The public surface mirrors an SSE-first contract:
 *   POST /api/chat/stream   → text/event-stream with typed StreamEvents
 *   POST /api/chat          → JSON fallback
 *   GET  /api/chat/history  → conversation list
 *   POST /api/feedback      → message feedback
 *
 * Until the gateway is live, a deterministic mock transport simulates the
 * same event sequence (status → sources → deltas → done) so the streaming
 * UI can be built and verified end-to-end.
 */

const env = import.meta.env as Record<string, string | undefined>

const API_BASE_URL = env.VITE_API_BASE_URL ?? '/api'
const USE_MOCK = env.VITE_USE_MOCK !== 'false'

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* ------------------------------------------------------------------ */
/* Mock corpus — development data only; never presented as real.       */
/* ------------------------------------------------------------------ */

interface MockAnswer {
  match: RegExp
  phases: Extract<ChatPhase, 'searching' | 'retrieving' | 'generating'>[]
  answer: string
  sources: Source[]
}

const MOCK_ANSWERS: MockAnswer[] = [
  {
    match: /vpn|remote access/i,
    phases: ['searching', 'retrieving', 'generating'],
    answer:
      'To connect to the company VPN, open the approved VPN client, select the corporate profile, enter your credentials and complete MFA.\n\nThe approved client is available from the company software portal. If MFA approval does not arrive within a minute, re-open the client and request a new prompt.',
    sources: [
      { id: 'src-vpn-1', title: 'VPN Configuration Guide', sourceSystem: 'SharePoint', page: 5 },
      { id: 'src-vpn-2', title: 'MFA Authentication Guide', sourceSystem: 'SharePoint', page: 2 },
    ],
  },
  {
    match: /leave|vacation|time off|holiday/i,
    phases: ['searching', 'retrieving', 'generating'],
    answer:
      'Leave requests are submitted in the HR portal under "Time & Attendance". Annual leave requires manager approval at least 5 business days in advance; sick leave can be logged retroactively within 3 days. Unused annual leave up to 10 days carries over into Q1. Public holidays follow the regional calendar attached to your employment contract.',
    sources: [
      { id: 'src-leave-1', title: 'Employee Leave Policy', sourceSystem: 'Policy Hub', section: '2. Annual Leave' },
      { id: 'src-leave-2', title: 'HR Portal Quick Reference', sourceSystem: 'Confluence', page: 7 },
    ],
  },
  {
    match: /database|db access|sql/i,
    phases: ['searching', 'retrieving', 'generating'],
    answer:
      'Database access is requested through the Access Management service. Choose the environment (dev, staging, production), attach your project code, and provide a business justification. Production access additionally requires a security review and expires after 90 days. Read-replica credentials are issued automatically once the request is approved.',
    sources: [
      { id: 'src-db-1', title: 'Database Access Request SOP', sourceSystem: 'Jira Service Mgmt', page: 3 },
      { id: 'src-db-2', title: 'Data Security Standards', sourceSystem: 'Policy Hub', section: '6. Production Access' },
    ],
  },
  {
    match: /onboard|first week|new hire/i,
    phases: ['searching', 'retrieving', 'generating'],
    answer:
      'Onboarding begins with the Day One checklist in the HR portal: identity verification, equipment pickup, and account activation. Week one covers mandatory security training, team introductions, and development-environment setup. Your onboarding buddy is listed in your welcome email, and all checklist items are tracked in the People portal under "My Journey".',
    sources: [
      { id: 'src-onb-1', title: 'Onboarding Process Handbook', sourceSystem: 'SharePoint', page: 1 },
      { id: 'src-onb-2', title: 'IT Setup Checklist', sourceSystem: 'Confluence', page: 4 },
      { id: 'src-onb-3', title: 'Security Training Curriculum', sourceSystem: 'LMS', section: 'Mandatory Modules' },
    ],
  },
  {
    match: /security|password|phishing|2fa|mfa/i,
    phases: ['searching', 'retrieving', 'generating'],
    answer:
      'Security guidelines require MFA on all enterprise accounts, a password manager for credential storage, and immediate reporting of suspected phishing to the Security desk. Managed devices must keep disk encryption enabled and receive updates within 14 days of release. Never share production credentials in chat or tickets — use the secret-management service instead.',
    sources: [
      { id: 'src-sec-1', title: 'Security Guidelines 2026', sourceSystem: 'Policy Hub', section: '1. Identity & Access' },
      { id: 'src-sec-2', title: 'Incident Reporting Runbook', sourceSystem: 'Confluence', page: 9 },
    ],
  },
]

const FALLBACK_ANSWER: MockAnswer = {
  match: /.*/,
  phases: ['searching', 'retrieving', 'generating'],
  answer:
    'I searched the connected enterprise sources for your question. Based on the retrieved documents, here is a summary of the most relevant guidance. (This is development mock content — the RAG backend will supply grounded answers with verified citations once connected.)',
  sources: [
    { id: 'src-fb-1', title: 'Knowledge Base Search Manual', sourceSystem: 'Confluence', page: 2 },
    { id: 'src-fb-2', title: 'EKA Pilot Program Notes', sourceSystem: 'SharePoint', section: 'Usage Guidance' },
  ],
}

function pickMockAnswer(message: string): MockAnswer {
  return MOCK_ANSWERS.find((entry) => entry.match.test(message)) ?? FALLBACK_ANSWER
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ------------------------------------------------------------------ */
/* Streaming                                                           */
/* ------------------------------------------------------------------ */

export interface StreamHandlers {
  onStatus?: (phase: Extract<ChatPhase, 'searching' | 'retrieving' | 'generating'>) => void
  onSources?: (sources: Source[]) => void
  onDelta?: (text: string) => void
  onDone?: (result: { conversationId: string; messageId: string }) => void
  onError?: (error: ApiError) => void
}

export interface StreamController {
  cancel: () => void
}

/**
 * Sends a chat message and streams the response.
 *
 * Real transport: SSE via fetch + ReadableStream against POST /api/chat/stream.
 * Mock transport: timed emission of the same StreamEvent sequence.
 */
export function streamChat(request: ChatRequest, handlers: StreamHandlers): StreamController {
  if (USE_MOCK) return streamChatMock(request, handlers)
  return streamChatSse(request, handlers)
}

/**
 * Mock-only: a message containing "simulate error" fails on its first
 * attempt and succeeds on retry, so the error + retry UI can be exercised.
 */
const mockFailedOnce = new Set<string>()

function streamChatMock(request: ChatRequest, handlers: StreamHandlers): StreamController {
  let cancelled = false

  const run = async () => {
    try {
      const mock = pickMockAnswer(request.message)

      for (const phase of mock.phases) {
        if (cancelled) return
        handlers.onStatus?.(phase)
        await sleep(phase === 'generating' ? 500 : 700)
      }

      if (cancelled) return
      if (/simulate error/i.test(request.message) && !mockFailedOnce.has(request.message)) {
        mockFailedOnce.add(request.message)
        handlers.onError?.(new ApiError('The knowledge gateway did not respond in time.', 504))
        return
      }
      handlers.onSources?.(mock.sources)
      await sleep(250)

      // Emit the answer in word chunks to simulate token streaming.
      const tokens = mock.answer.split(/(\s+)/)
      for (let i = 0; i < tokens.length; i += 2) {
        if (cancelled) return
        handlers.onDelta?.(tokens[i] + (tokens[i + 1] ?? ''))
        await sleep(24 + Math.random() * 36)
      }

      if (cancelled) return
      handlers.onDone?.({
        conversationId: request.conversationId ?? 'mock-conv-1',
        messageId: `mock-msg-${Date.now()}`,
      })
    } catch (error) {
      if (!cancelled) {
        handlers.onError?.(new ApiError(error instanceof Error ? error.message : 'Stream failed'))
      }
    }
  }

  void run()
  return { cancel: () => { cancelled = true } }
}

/**
 * Production SSE transport. Expects `data:` lines carrying JSON StreamEvents,
 * terminated by an empty line, per the text/event-stream convention.
 */
function streamChatSse(request: ChatRequest, handlers: StreamHandlers): StreamController {
  const controller = new AbortController()

  const run = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new ApiError(`Chat stream failed (${response.status})`, response.status)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const handleEvent = (raw: string) => {
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const event = JSON.parse(payload) as StreamEvent
            switch (event.type) {
              case 'status': handlers.onStatus?.(event.phase); break
              case 'sources': handlers.onSources?.(event.sources); break
              case 'delta': handlers.onDelta?.(event.text); break
              case 'done': handlers.onDone?.({ conversationId: event.conversationId, messageId: event.messageId }); break
              case 'error': handlers.onError?.(new ApiError(event.message)); break
            }
          } catch {
            // Ignore malformed keep-alive frames; never crash the stream.
          }
        }
      }

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''
        frames.forEach(handleEvent)
      }
      if (buffer) handleEvent(buffer)
    } catch (error) {
      if (controller.signal.aborted) return
      handlers.onError?.(
        error instanceof ApiError ? error : new ApiError(error instanceof Error ? error.message : 'Stream failed'),
      )
    }
  }

  void run()
  return { cancel: () => controller.abort() }
}

/* ------------------------------------------------------------------ */
/* REST endpoints (JSON fallback + history + feedback)                 */
/* ------------------------------------------------------------------ */

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status)
  return (await response.json()) as T
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) {
    const mock = pickMockAnswer(request.message)
    await sleep(600)
    return {
      conversationId: request.conversationId ?? 'mock-conv-1',
      message: {
        id: `mock-msg-${Date.now()}`,
        role: 'assistant',
        content: mock.answer,
        createdAt: new Date().toISOString(),
        sources: mock.sources,
      },
    }
  }
  return requestJson<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(request) })
}

export async function fetchConversationHistory(): Promise<ConversationSummary[]> {
  if (USE_MOCK) {
    await sleep(300)
    return MOCK_CONVERSATIONS
  }
  return requestJson<ConversationSummary[]>('/chat/history')
}

export async function fetchConversation(id: string): Promise<Conversation> {
  if (USE_MOCK) {
    await sleep(250)
    return {
      id,
      title: MOCK_CONVERSATIONS.find((c) => c.id === id)?.title ?? 'Conversation',
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      messages: [],
    }
  }
  return requestJson<Conversation>(`/chat/history/${encodeURIComponent(id)}`)
}

export async function submitFeedback(messageId: string, feedback: FeedbackKind): Promise<void> {
  if (USE_MOCK) {
    await sleep(200)
    return
  }
  await requestJson('/feedback', { method: 'POST', body: JSON.stringify({ messageId, feedback }) })
}

/* ------------------------------------------------------------------ */
/* Mock seed data                                                      */
/* ------------------------------------------------------------------ */

export const MOCK_CONVERSATIONS: ConversationSummary[] = [
  { id: 'conv-1', title: 'VPN Configuration', lastMessageAt: '2026-10-06T09:12:00Z', messageCount: 6 },
  { id: 'conv-2', title: 'Leave Policy', lastMessageAt: '2026-10-05T16:40:00Z', messageCount: 4 },
  { id: 'conv-3', title: 'Database Access', lastMessageAt: '2026-10-05T11:05:00Z', messageCount: 9 },
  { id: 'conv-4', title: 'Onboarding Process', lastMessageAt: '2026-10-04T14:22:00Z', messageCount: 12 },
  { id: 'conv-5', title: 'Security Guidelines', lastMessageAt: '2026-10-03T10:31:00Z', messageCount: 3 },
]

export function buildMockMessage(content: string, role: ChatMessage['role'], sources?: Source[]): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    sources,
  }
}
