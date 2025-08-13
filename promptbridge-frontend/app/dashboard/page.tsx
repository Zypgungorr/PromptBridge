'use client'

import { useState } from 'react'
import { 
  Bot, 
  Send, 
  RotateCcw, 
  Copy, 
  Check,
  Sparkles,
  Zap,
  Brain,
  MessageSquare,
  History,
  Settings
} from 'lucide-react'

// Mock data - backend'den gelecek
const aiProviders = [
  {
    id: '1',
    name: 'Google Gemini',
    description: 'Google\'ın en gelişmiş AI modeli',
    icon: Sparkles,
    color: 'bg-green-100 text-green-600',
    isActive: true
  },
  {
    id: '2',
    name: 'Cohere',
    description: 'Command-R modeli ile güçlü metin üretimi',
    icon: Brain,
    color: 'bg-orange-100 text-orange-600',
    isActive: true
  },
  {
    id: '3',
    name: 'OpenRouter',
    description: 'OpenAI GPT-3.5 Turbo ve premium modeller',
    icon: Zap,
    color: 'bg-purple-100 text-purple-600',
    isActive: true
  }
]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  providerId: string
  providerName: string
  timestamp: Date
  prompt?: string
}

export default function DashboardPage() {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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

  const getProviderInfo = (providerId: string) => {
    return aiProviders.find(p => p.id === providerId)
  }

  const getLastResponse = () => {
    const lastAIResponse = messages.filter(m => m.role === 'assistant').pop()
    return lastAIResponse
  }

  const getLastPrompt = () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    return lastUserMessage
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PromptBridge</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md"
              >
                <History className="h-4 w-4 mr-2" />
                Geçmiş
              </button>
              <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - AI Provider Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">AI Servisi Seçin</h2>
              <div className="space-y-3">
                {aiProviders.map((provider) => {
                  const IconComponent = provider.icon
                  const isSelected = selectedProvider === provider.id
                  
                  return (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${provider.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-500">{provider.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Hızlı İşlemler</h3>
                <div className="space-y-2">
                  <button
                    onClick={clearChat}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Sohbeti Temizle
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <Settings className="h-4 w-4 mr-2" />
                    Ayarlar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">AI Chat</h2>
                    <p className="text-sm text-gray-500">
                      {selectedProvider 
                        ? `${aiProviders.find(p => p.id === selectedProvider)?.name} ile sohbet edin`
                        : 'Önce bir AI servisi seçin'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {messages.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {messages.filter(m => m.role === 'user').length} prompt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sohbet başlatın</h3>
                    <p className="text-gray-500">
                      {selectedProvider 
                        ? `${aiProviders.find(p => p.id === selectedProvider)?.name} ile konuşmaya başlayın`
                        : 'Önce bir AI servisi seçin'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const provider = getProviderInfo(message.providerId)
                      const IconComponent = provider?.icon || Bot
                      const isLastMessage = index === messages.length - 1
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-3xl rounded-lg px-4 py-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex items-center mb-2">
                                <div className={`p-1 rounded mr-2 ${provider?.color || 'bg-gray-100 text-gray-600'}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {provider?.name || 'AI Assistant'}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                  className="ml-auto text-gray-400 hover:text-gray-600"
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
                              message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                            }`}>
                              {message.timestamp.toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                            <span className="text-sm text-gray-500">AI düşünüyor...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200">
                {/* Context Information */}
                {messages.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-sm text-blue-800">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="font-medium">Önceki Prompt:</span>
                      <span className="ml-2 text-blue-600">
                        "{getLastPrompt()?.content || ''}"
                      </span>
                    </div>
                    {getLastResponse() && (
                      <div className="mt-2 text-sm text-blue-700">
                        <span className="font-medium">Son Response:</span>
                        <span className="ml-2">
                          {getLastResponse()?.content.substring(0, 100)}...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        selectedProvider 
                          ? messages.length > 0
                            ? "Önceki response'u referans alarak yeni prompt girin..."
                            : `${aiProviders.find(p => p.id === selectedProvider)?.name} ile sohbet edin...`
                          : 'Önce bir AI servisi seçin'
                      }
                      disabled={!selectedProvider || isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !selectedProvider || isLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                
                {!selectedProvider && (
                  <p className="mt-2 text-sm text-gray-500">
                    Sohbet başlatmak için sol taraftan bir AI servisi seçin
                  </p>
                )}

                {/* Usage Tips */}
                {selectedProvider && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Kullanım İpuçları:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Farklı AI'lar arasında geçiş yaparak sonuçları karşılaştırabilirsiniz</li>
                      <li>• Önceki response'u referans alarak yeni prompt'lar yazabilirsiniz</li>
                      <li>• Her AI'nın güçlü yanlarını keşfedin</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
