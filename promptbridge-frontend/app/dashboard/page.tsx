'use client'
import { useState, useEffect } from 'react'
import { 
  Sparkles,
  Brain,
  Zap
} from 'lucide-react'
import { Header, AIProviderSelector, QuickActions, ChatArea } from '@/components/dashboard'
import type { AIProvider, ChatMessage } from '@/types/dashboard'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatHistory from '@/components/dashboard/ChatHistory';

export default function DashboardPage() {
  const { logout, token } = useAuth()
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [providerChangeMessage, setProviderChangeMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // AI Provider'ları backend'den çek
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('http://localhost:5170/api/prompt/providers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const providers = await response.json()
          // Sadece çalışan provider'ları filtrele ve UI ekle
          const workingProviders = providers.filter((provider: any) => 
            provider.id === 3 || provider.id === 5 || provider.id === 6
          )
          
          const providersWithUI = workingProviders.map((provider: any) => {
            let icon = Sparkles
            let color = 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
            
            if (provider.id === 3) { // Gemini
              icon = Sparkles
              color = 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            } else if (provider.id === 5) { // Cohere
              icon = Brain
              color = 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
            } else if (provider.id === 6) { // OpenRouter
              icon = Zap
              color = 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
            }
            
            return {
              ...provider,
              icon,
              color
            }
          })
          
          setAiProviders(providersWithUI)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
      } finally {
        setProvidersLoading(false)
      }
    }

    if (token) {
      fetchProviders()
    }
  }, [token])
  

  const handleLoadSession = (messages: ChatMessage[]) => {
    setMessages(messages);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    localStorage.removeItem('activeSessionId');
  };

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

    try {
      // Önceki AI response'unu al
      const lastResponse = messages.filter(m => m.role === 'assistant').pop()
      
      // Eğer önceki response varsa, onu da prompt'a ekle
      let fullPrompt = inputMessage
      if (lastResponse) {
        fullPrompt = `Önceki AI Response:\n${lastResponse.content}\n\nYeni İstek:\n${inputMessage}`
      }
      
      // Backend'e prompt gönder
      const response = await fetch('http://localhost:5170/api/prompt/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aiProviderId: parseInt(selectedProvider),
          prompt: fullPrompt
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || `Bu bir ${provider.name} yanıtıdır.`,
          providerId: selectedProvider,
          providerName: provider.name,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])

      } else {
        // Hata durumunda fallback mesaj
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Üzgünüm, ${provider.name} ile bağlantı kurulamadı. Lütfen tekrar deneyin.`,
          providerId: selectedProvider,
          providerName: provider.name,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error sending prompt:', error)
      // Hata durumunda fallback mesaj
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Bağlantı hatası oluştu. Lütfen tekrar deneyin.`,
        providerId: selectedProvider,
        providerName: provider.name,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
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

  const handleProviderChange = (providerId: string) => {
    const previousProvider = selectedProvider
    setSelectedProvider(providerId)
    
    // Eğer önceki provider'dan farklı bir provider seçildiyse ve mesaj varsa
    if (previousProvider && previousProvider !== providerId && messages.length > 0) {
      const lastResponse = messages.filter(m => m.role === 'assistant').pop()
      if (lastResponse) {
        setProviderChangeMessage(`Önceki AI response'unu referans alarak yeni prompt yazabilirsiniz!`)
        setTimeout(() => setProviderChangeMessage(null), 5000)
      }
    }
  }

  if (providersLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">AI Provider'lar yükleniyor...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header 
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onLogout={logout}
        />

        <div className="max-w-full mx-auto px-10 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - AI Provider Selection */}
            <div className="lg:col-span-1">
                                      <AIProviderSelector
              providers={aiProviders}
              selectedProvider={selectedProvider}
              onSelectProvider={handleProviderChange}
            />
            
            {providerChangeMessage && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">{providerChangeMessage}</p>
              </div>
            )}
            
            {/* <QuickActions onClearChat={clearChat} /> */}
            <QuickActions
                onShowHistory={() => setShowHistory(true)}
                onNewChat={() => {
                  setMessages([]);
                  setCurrentSessionId(null);
                }}
                
              />
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
        {/* Chat History Modal */}
        <ChatHistory
          isVisible={showHistory}
          onClose={() => setShowHistory(false)}
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId}
        />
      </div>
    </ProtectedRoute>
  )
}
