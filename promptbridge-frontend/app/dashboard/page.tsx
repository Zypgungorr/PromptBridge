'use client'

import { useState } from 'react'
import { 
  Sparkles,
  Brain,
  Zap
} from 'lucide-react'
import { Header, AIProviderSelector, QuickActions, ChatArea } from '@/components/dashboard'
import type { AIProvider, ChatMessage } from '@/types/dashboard'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Mock data - backend'den gelecek
const aiProviders = [
  {
    id: '1',
    name: 'Google Gemini',
    description: 'Google\'ın en gelişmiş AI modeli',
    icon: Sparkles,
    color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    isActive: true
  },
  {
    id: '2',
    name: 'Cohere',
    description: 'Command-R modeli ile güçlü metin üretimi',
    icon: Brain,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    isActive: true
  },
  {
    id: '3',
    name: 'OpenRouter',
    description: 'OpenAI GPT-3.5 Turbo ve premium modeller',
    icon: Zap,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    isActive: true
  }
]



export default function DashboardPage() {
  const { logout } = useAuth()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProvider) return

    const provider = aiProviders.find(p => p.id === selectedProvider)
    if (!provider) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      providerId: selectedProvider,
      providerName: provider.name,
      timestamp: new Date(),
      prompt: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response - backend'den gelecek
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Bu bir ${provider.name} yanıtıdır. "${inputMessage}" prompt'unuza göre oluşturulmuştur.`,
        providerId: selectedProvider,
        providerName: provider.name,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 2000)
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header 
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onLogout={logout}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - AI Provider Selection */}
            <div className="lg:col-span-1">
              <AIProviderSelector
                providers={aiProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={setSelectedProvider}
              />
              
              <QuickActions onClearChat={clearChat} />
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              <ChatArea
                selectedProvider={selectedProvider}
                providers={aiProviders}
                messages={messages}
                inputMessage={inputMessage}
                isLoading={isLoading}
                copiedMessageId={copiedMessageId}
                onInputChange={setInputMessage}
                onSendMessage={handleSendMessage}
                onCopyMessage={copyToClipboard}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
