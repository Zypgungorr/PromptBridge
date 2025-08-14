'use client'

import type { AIProvider } from '@/types/dashboard'

interface ChatHeaderProps {
  selectedProvider: string | null
  providers: AIProvider[]
  messageCount: number
}

export default function ChatHeader({ selectedProvider, providers, messageCount }: ChatHeaderProps) {
  const selectedProviderInfo = providers.find(p => p.id === selectedProvider)
  
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">AI Chat</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedProvider 
              ? `${selectedProviderInfo?.name} ile sohbet edin`
              : 'Önce bir AI servisi seçin'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {messageCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {messageCount} prompt
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
