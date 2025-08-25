'use client'

import { Bot } from 'lucide-react'
import ChatHeader from './ChatHeader'
import ChatMessageComponent from './ChatMessage'
import ChatInput from './ChatInput'

import type { AIProvider, ChatMessage } from '@/types/dashboard'

interface ChatAreaProps {
  selectedProvider: string | null
  providers: AIProvider[]
  messages: ChatMessage[]
  inputMessage: string
  isLoading: boolean
  copiedMessageId: string | null
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onCopyMessage: (text: string, messageId: string) => void
}

export default function ChatArea({
  selectedProvider,
  providers,
  messages,
  inputMessage,
  isLoading,
  copiedMessageId,
  onInputChange,
  onSendMessage,
  onCopyMessage
}: ChatAreaProps) {
  const getProviderInfo = (providerId: string) => {
    return providers.find(p => p.id === providerId)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <ChatHeader 
        selectedProvider={selectedProvider}
        providers={providers}
        messageCount={messages.filter(m => m.role === 'user').length}
      />

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sohbet başlatın</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedProvider 
                ? `${providers.find(p => p.id === selectedProvider)?.name} ile konuşmaya başlayın`
                : 'Önce bir AI servisi seçin'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const provider = getProviderInfo(message.providerId)
              const isLastMessage = index === messages.length - 1
              
              return (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  provider={provider}
                  isLastMessage={isLastMessage}
                  copiedMessageId={copiedMessageId}
                  onCopyMessage={onCopyMessage}
                />
              )
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI düşünüyor...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput
        inputMessage={inputMessage}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        selectedProvider={selectedProvider}
        providers={providers}
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  )
}
