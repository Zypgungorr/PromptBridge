'use client'

import { Send } from 'lucide-react'
import { useRef, useEffect } from 'react'

import type { AIProvider, ChatMessage } from '@/types/dashboard'

interface ChatInputProps {
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  selectedProvider: string | null
  providers: AIProvider[]
  messages: ChatMessage[]
  isLoading: boolean
}

export default function ChatInput({
  inputMessage,
  onInputChange,
  onSendMessage,
  selectedProvider,
  providers,
  messages,
  isLoading
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Otomatik boyutlandırma için useEffect
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value)
  }

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider)

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Bir mesaj yazın..."
            disabled={!selectedProvider || isLoading}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || !selectedProvider || isLoading}
            className="absolute right-2 top-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          {selectedProvider ? '' : 'Sohbet başlatmak için sol taraftan bir AI servisi seçin'}
        </div>
      </div>
    </div>
  )
}