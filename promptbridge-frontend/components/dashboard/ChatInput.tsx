'use client'

import { Send, MessageSquare } from 'lucide-react'

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
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const getLastResponse = () => {
    const lastAIResponse = messages.filter(m => m.role === 'assistant').pop()
    return lastAIResponse
  }

  const getLastPrompt = () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    return lastUserMessage
  }

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider)

  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
      {/* Context Information */}
      {messages.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-3">
            <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Önceki AI Response:</span>
          </div>
          {getLastResponse() && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Önceki Response:</span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                {getLastResponse()?.content.split(' ').slice(0, 20).join(' ')}...
              </span>
            </div>
          )}
          {/* <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Önceki Prompt:</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400 italic">
              "{getLastPrompt()?.content || ''}"
            </span>
          </div> */}
        </div>
      )}

      <div className="flex space-x-4">
        <div className="flex-1">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedProvider 
                ? messages.length > 0
                  ? `Önceki response otomatik eklenecek. ${selectedProviderInfo?.name} için yeni direktif girin...`
                  : `${selectedProviderInfo?.name} ile sohbet edin...`
                : 'Önce bir AI servisi seçin'
            }
            disabled={!selectedProvider || isLoading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            rows={3}
          />
        </div>
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || !selectedProvider || isLoading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      
      {!selectedProvider && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Sohbet başlatmak için sol taraftan bir AI servisi seçin
        </p>
      )}

      {/* Usage Tips */}
      {selectedProvider && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💡 Kullanım İpuçları:</h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>AI Değiştirme:</strong> Farklı AI'lar arasında geçiş yaparak sonuçları karşılaştırabilirsiniz</li>
            <li>• <strong>Otomatik Referans:</strong> Önceki AI response'u otomatik olarak yeni prompt'a eklenir</li>
            <li>• <strong>Örnek:</strong> "Daha insancıl yazılsın", "Daha resmi olsun", "Kısalt" gibi direktifler ekleyebilirsiniz</li>
            <li>• <strong>Zincirleme İyileştirme:</strong> Her AI önceki response'u görür ve üzerine iyileştirme yapar</li>
          </ul>
        </div>
      )}
    </div>
  )
}
