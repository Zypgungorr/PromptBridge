'use client'
import { useState, useEffect } from 'react'
import { 
  Sparkles,
  Brain,
  Zap
} from 'lucide-react'
import { Header, AIProviderSelector, ChatArea } from '@/components/dashboard'
import PipelineTemplates from '@/components/dashboard/PipelineTemplates'
import PipelineBuilder from '@/components/dashboard/PipelineBuilder'
import type { AIProvider, ChatMessage, CustomPipelineData } from '@/types/dashboard'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatHistory from '@/components/dashboard/ChatHistory'

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
  const [showPipelines, setShowPipelines] = useState(false)
  const [showPipelineBuilder, setShowPipelineBuilder] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)

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
              id: provider.id.toString(), // ID'yi string'e çevir
              icon,
              color
            }
          })
          
          setAiProviders(providersWithUI)
          // Eğer seçili provider yoksa ilkini otomatik seç
          if (!selectedProvider && providersWithUI.length > 0) {
            setSelectedProvider(providersWithUI[0].id)
          }

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
  
  // Sayfa yüklendiğinde aktif session'ı geri yükle
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!token) return
      
      const activeSessionId = localStorage.getItem('activeSessionId')
      if (activeSessionId && activeSessionId !== 'null') {
        console.log('Aktif session bulundu, yükleniyor:', activeSessionId)
        try {
          await handleLoadSession(activeSessionId)
        } catch (error) {
          console.error('Aktif session yüklenirken hata:', error)
          // Hata durumunda localStorage'ı temizle
          localStorage.removeItem('activeSessionId')
          setCurrentSessionId(null)
        }
      }
    }
    
    // Provider'lar yüklendikten sonra session'ı yükle
    if (!providersLoading && token) {
      loadActiveSession()
    }
  }, [providersLoading, token])
  

const handleLoadSession = async (sessionId: string) => {
  try {
    console.log('Loading session messages for:', sessionId); // Debug için
    
    // Önce mevcut session'ı deaktif et (eğer varsa)
    if (currentSessionId) {
      try {
        await fetch(`http://localhost:5170/api/chat/sessions/${currentSessionId}/deactivate`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error deactivating current session:', error);
      }
    }
    
    // Yeni session'ı aktif et
    const sessionIdNum = parseInt(sessionId)
    setCurrentSessionId(sessionIdNum);
    localStorage.setItem('activeSessionId', sessionId);
    
    // Session mesajlarını yükle
    const response = await fetch(`http://localhost:5170/api/chat/sessions/${sessionId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const messages = await response.json();
      console.log('Loaded messages:', messages); // Debug için
      
      // Backend'den gelen mesajları frontend formatına çevir
      const formattedMessages: ChatMessage[] = messages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content,
        providerId: msg.aiProviderId?.toString() || '',
        providerName: msg.aiProviderName || 'AI',
        timestamp: new Date(msg.createdAt),
        prompt: msg.isUserMessage ? msg.content : undefined
      }));

      setMessages(formattedMessages);
      console.log('Session başarıyla yüklendi:', sessionId)
    } else {
      console.error('Failed to load session messages');
      throw new Error('Failed to load session messages')
    }
    
    setShowHistory(false);
  } catch (error) {
    console.error('Error loading session:', error);
    throw error; // Hatayı yukarı ilet
  }
};


  // Yeni sohbet başlatma fonksiyonu
  const handleNewChat = async () => {
    try {
      // Backend'de yeni session oluştur
      const response = await fetch('http://localhost:5170/api/prompt/sessions/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Yeni session'ı aktif et
        setCurrentSessionId(data.id);
        localStorage.setItem('activeSessionId', data.id);
        
        // Mesajları temizle
        setMessages([]);
      }
    } catch (error) {
      console.error('Yeni session oluşturulamadı:', error);
      // Hata durumunda sadece local state'i temizle
      setMessages([]);
      setCurrentSessionId(null);
      localStorage.removeItem('activeSessionId');
    }
  };

  // Mesaj gönderme fonksiyonu
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
      const lastResponse = messages.filter(m => m.role === 'assistant').pop()
      
      let fullPrompt = inputMessage
      if (lastResponse) {
        fullPrompt = `Önceki AI Response:\n${lastResponse.content}\n\nYeni İstek:\n${inputMessage}`
      }
      
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
        
        // Eğer response'da sessionId varsa, onu localStorage'a kaydet
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId)
          localStorage.setItem('activeSessionId', data.sessionId.toString())
          console.log('Session ID güncellendi:', data.sessionId)
        }
        
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

  // Mesaj kopyalama fonksiyonu
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Provider değiştirme fonksiyonu
  const handleProviderChange = (providerId: string) => {
    const previousProvider = selectedProvider
    setSelectedProvider(providerId)
    
    if (previousProvider && previousProvider !== providerId && messages.length > 0) {
      const lastResponse = messages.filter(m => m.role === 'assistant').pop()
      if (lastResponse) {
        setProviderChangeMessage(`Önceki AI response'unu referans alarak yeni prompt yazabilirsiniz!`)
        setTimeout(() => setProviderChangeMessage(null), 5000)
      }
    }
  }

  // Pipeline execution fonksiyonu
  const handleExecutePipeline = async (pipelineId: number, prompt: string) => {
    setShowPipelines(false)
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5170/api/pipeline/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pipelineId,
          initialPrompt: prompt
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Eğer aktif session yoksa yeni bir tane oluştur
        let sessionId = currentSessionId
        if (!sessionId) {
          const newSessionResponse = await fetch('http://localhost:5170/api/prompt/sessions/new', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (newSessionResponse.ok) {
            const sessionData = await newSessionResponse.json()
            sessionId = sessionData.id
            setCurrentSessionId(sessionId)
            if (sessionId) {
              localStorage.setItem('activeSessionId', sessionId.toString())
            }
          }
        }

        // Pipeline sonucunu backend'e kaydet
        if (sessionId) {
          // User message'ı kaydet
          const saveUserResponse = await fetch('http://localhost:5170/api/prompt/save-pipeline-message', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: sessionId,
              content: prompt,
              isUserMessage: true,
              pipelineId: pipelineId
            })
          })

          // AI response'ı kaydet
          const saveAiResponse = await fetch('http://localhost:5170/api/prompt/save-pipeline-message', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: sessionId,
              content: result.finalResponse,
              isUserMessage: false,
              pipelineId: pipelineId
            })
          })
        }
        
        // Pipeline sonucunu chat'e ekle
        const userMessage: ChatMessage = {
          id: Date.now().toString() + '-user',
          role: 'user',
          content: prompt,
          providerId: 'pipeline',
          providerName: 'AI Pipeline',
          timestamp: new Date(),
          prompt: prompt
        }

        const aiMessage: ChatMessage = {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: result.finalResponse,
          providerId: 'pipeline',
          providerName: `Pipeline #${pipelineId}`,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage, aiMessage])
      } else {
        console.error('Pipeline execution failed')
        // Hata mesajı gösterebiliriz
      }
    } catch (error) {
      console.error('Error executing pipeline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Custom Pipeline Execution fonksiyonu
  const handleExecuteCustomPipeline = async (pipelineData: CustomPipelineData) => {
    setIsLoading(true)

    try {
      let stepResponses: string[] = []
      let finalResult = ''

      console.log('Pipeline başlatılıyor:', pipelineData.name)
      console.log('Adım sayısı:', pipelineData.steps.length)
      console.log('Başlangıç metni:', pipelineData.userInput)

      // Her adımı sırayla çalıştır
      for (let i = 0; i < pipelineData.steps.length; i++) {
        const step = pipelineData.steps[i]
        const stepNumber = i + 1
        
        console.log(`\n--- ADIM ${stepNumber} BAŞLIYOR ---`)
        console.log('AI Provider ID:', step.aiProviderId)
        console.log('Orijinal Prompt Template:', step.prompt)

        // Prompt template'ini işle
        let processedPrompt = step.prompt
          .replace(/{userInput}/g, pipelineData.userInput || '')
          .replace(/{previousResponse}/g, stepResponses[i - 1] || '')

        console.log('İşlenmiş Prompt:', processedPrompt)

        // AI Provider'a istek gönder
        const response = await fetch('http://localhost:5170/api/prompt/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            AIProviderId: step.aiProviderId,
            Prompt: processedPrompt
          })
        })

        if (response.ok) {
          const result = await response.json()
          const aiResponse = result.response || result.aiResponse || result.content || 'Yanıt alınamadı'
          
          console.log('AI Response:', aiResponse)
          stepResponses.push(aiResponse)
          
          // Provider adını bul
          const providerName = aiProviders.find(p => p.id === step.aiProviderId)?.name || 'AI Provider'
          
          finalResult += `\n\n**${stepNumber}. Adım (${providerName}):**\n${aiResponse}`
        } else {
          const errorText = await response.text()
          console.error(`Adım ${stepNumber} başarısız:`, errorText)
          throw new Error(`Adım ${stepNumber} başarısız oldu: ${errorText}`)
        }
      }

      console.log('\n--- PIPELINE TAMAMLANDI ---')
      console.log('Final sonuç:', finalResult)

      // Eğer aktif session yoksa yeni bir tane oluştur
      let sessionId = currentSessionId
      if (!sessionId) {
        const newSessionResponse = await fetch('http://localhost:5170/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            title: pipelineData.name || 'Özel Pipeline'
          })
        })
        
        if (newSessionResponse.ok) {
          const sessionData = await newSessionResponse.json()
          sessionId = sessionData.id
          setCurrentSessionId(sessionId)
          if (sessionId) {
            localStorage.setItem('activeSessionId', sessionId.toString())
          }
        }
      }

      // Pipeline sonucunu backend'e kaydet
      if (sessionId) {
        // User message'ı kaydet
        await fetch('http://localhost:5170/api/prompt/save-pipeline-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: sessionId,
            content: pipelineData.userInput || '',
            isUserMessage: true,
            pipelineId: 999, // Custom pipeline için özel ID
            pipelineName: pipelineData.name
          })
        })

        // AI response'ı kaydet
        await fetch('http://localhost:5170/api/prompt/save-pipeline-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: sessionId,
            content: finalResult,
            isUserMessage: false,
            pipelineId: 999,
            pipelineName: pipelineData.name
          })
        })
      }

      // Mesajları chat'e ekle
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '-user',
        role: 'user',
        content: pipelineData.userInput || '',
        providerId: 'custom-pipeline',
        providerName: 'Özel Pipeline',
        timestamp: new Date(),
        prompt: pipelineData.userInput || ''
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: finalResult,
        providerId: 'custom-pipeline',
        providerName: pipelineData.name,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage, aiMessage])

    } catch (error) {
      console.error('Pipeline çalıştırılırken hata:', error)
      alert('Pipeline çalıştırılırken bir hata oluştu: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  // Yüklenme durumu
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
            {/* Sol Kenar Çubuğu - AI Provider Seçimi ve Hızlı Aksiyonlar */}
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
              
              {/* Hızlı İşlemler */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Hızlı İşlemler
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleNewChat}
                    className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  >
                    Yeni Chat
                  </button>
                  
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                  >
                    Chat Geçmişi
                  </button>

                  <button
                    onClick={() => setShowPipelines(true)}
                    className="w-full px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    Pipeline Templates
                  </button>

                  <button
                    onClick={() => setShowPipelineBuilder(true)}
                    className="w-full px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                  >
                    Özel Pipeline Oluştur
                  </button>
                </div>
              </div>
            </div>

            {/* Ana Sohbet Alanı */}
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
        
        {/* Chat Geçmişi Modalı */}
        <ChatHistory
          isVisible={showHistory}
          onClose={() => setShowHistory(false)}
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId ? currentSessionId.toString() : ''}
        />

        {/* Pipeline Templates Modalı */}
        {showPipelines && (
          <PipelineTemplates
            onExecutePipeline={handleExecutePipeline}
            onClose={() => setShowPipelines(false)}
          />
        )}

        {/* Pipeline Builder Modalı */}
        {showPipelineBuilder && (
          <PipelineBuilder
            isOpen={showPipelineBuilder}
            onClose={() => setShowPipelineBuilder(false)}
            onExecutePipeline={handleExecuteCustomPipeline}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}