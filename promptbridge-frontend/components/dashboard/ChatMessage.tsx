'use client'

import { Bot, Copy, Check } from 'lucide-react'

import type { ChatMessage } from '@/types/dashboard'

interface ChatMessageProps {
  message: ChatMessage
  provider: any
  isLastMessage: boolean
  copiedMessageId: string | null
  onCopyMessage: (text: string, messageId: string) => void
}

export default function ChatMessage({ 
  message, 
  provider, 
  isLastMessage, 
  copiedMessageId, 
  onCopyMessage 
}: ChatMessageProps) {
  const IconComponent = provider?.icon || Bot
  
  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 shadow-sm ${
          message.role === 'user'
            ? 'bg-purple-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
        }`}
      >
        {message.role === 'assistant' && (
          <div className="flex items-center mb-2">
            <div className={`p-1 rounded mr-2 ${provider?.color || 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {provider?.name || 'AI Assistant'}
            </span>
            <button
              onClick={() => onCopyMessage(message.content, message.id)}
              className="ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              {copiedMessageId === message.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        <div className={`text-xs mt-2 ${
          message.role === 'user' ? 'text-purple-100' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {message.timestamp.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}
