/**
 * EKA domain types.
 *
 * These model the contract between the frontend and the Node/Express
 * gateway (which proxies the FastAPI RAG service). They intentionally
 * contain no RAG/embedding/LLM logic — only transport shapes.
 */

export type MessageRole = 'user' | 'assistant'

export type ChatPhase =
  | 'idle'
  | 'searching'
  | 'retrieving'
  | 'generating'
  | 'streaming'
  | 'complete'
  | 'error'

export interface Source {
  id: string
  title: string
  sourceSystem: string
  page?: number
  section?: string
  /** Optional deep link resolved by the backend; may be absent in mock data. */
  url?: string
  /** Optional relevance score from the retrieval layer (0..1). */
  score?: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string // ISO 8601
  sources?: Source[]
  feedback?: FeedbackKind
}

export type FeedbackKind = 'helpful' | 'not_helpful'

export interface ChatRequest {
  conversationId?: string
  message: string
  /** Streaming is requested via SSE; consumers may fall back to JSON. */
  stream?: boolean
}

export interface ChatResponse {
  conversationId: string
  message: ChatMessage
}

export interface ConversationSummary {
  id: string
  title: string
  lastMessageAt: string
  messageCount: number
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[]
}

export type StreamEvent =
  | { type: 'status'; phase: Extract<ChatPhase, 'searching' | 'retrieving' | 'generating'> }
  | { type: 'delta'; text: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'done'; conversationId: string; messageId: string }
  | { type: 'error'; message: string }
