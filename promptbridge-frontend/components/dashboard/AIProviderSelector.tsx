'use client'

import { Sparkles, Brain, Zap } from 'lucide-react'

import { AIProvider } from '@/types/dashboard'

interface AIProviderSelectorProps {
  providers: AIProvider[]
  selectedProvider: string | null
  onSelectProvider: (providerId: string) => void
}

export default function AIProviderSelector({ 
  providers, 
  selectedProvider, 
  onSelectProvider 
}: AIProviderSelectorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Servisi Seçin</h2>
      <div className="flex flex-wrap gap-3">
        {providers.map((provider) => {
          const IconComponent = provider.icon
          const isSelected = selectedProvider === provider.id
          
          return (
            <button
              key={provider.id}
              onClick={() => onSelectProvider(provider.id)}
              className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${provider.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{provider.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
