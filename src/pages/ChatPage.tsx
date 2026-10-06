import { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import ChatWindow from '../components/chat/ChatWindow'
import EmptyState from '../components/chat/EmptyState'
import { useChat } from '../hooks/useChat'
import { MOCK_CONVERSATIONS } from '../services/api'
import type { ConversationSummary } from '../types/chat'

/**
 * Main EKA chat experience.
 *
 * Mock conversations seed the sidebar; live conversation fetch will swap
 * in via fetchConversation() once the gateway endpoints exist.
 */
export default function ChatPage() {
  const chat = useChat()
  const [conversations] = useState<ConversationSummary[]>(MOCK_CONVERSATIONS)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)

    chat.reset()
    // Live data path (wire up when history API is available):
    // void fetchConversation(id).then((conv) => chat.hydrate(conv.messages))
  }

  const handleNewChat = () => {
    chat.reset()
    setActiveConversationId(null)
  }

  return (
    <AppLayout
      sidebar={
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      }
      topbar={<TopBar />}
    >
      {chat.messages.length === 0 && !chat.isBusy ? (
        <EmptyState onSend={(q) => chat.send(q)} />
      ) : (
        <ChatWindow
          messages={chat.messages}
          phase={chat.phase}
          streamingText={chat.streamingText}
          pendingSources={chat.pendingSources}
          error={chat.error}
          busy={chat.isBusy}
          onSend={chat.send}
          onStop={chat.cancel}
          onRetry={chat.retry}
          onFeedback={chat.setFeedback}
        />
      )}
    </AppLayout>
  )
}
