'use client'

import { useState, useEffect } from 'react'
import { FileText, Mail, BarChart3, Zap, Sparkles, Play, Clock } from 'lucide-react'
import type { Pipeline } from '@/types/dashboard'

interface PipelineTemplatesProps {
  onExecutePipeline: (pipelineId: number, prompt: string) => void
  onClose: () => void
}

export default function PipelineTemplates({ onExecutePipeline, onClose }: PipelineTemplatesProps) {
  const [templates, setTemplates] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Pipeline | null>(null)
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // Backend'den pipeline template'larını çek
      const response = await fetch('http://localhost:5170/api/pipeline/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTemplateIcon = (templateName: string) => {
    if (templateName.includes('Blog')) return FileText
    if (templateName.includes('Email')) return Mail
    if (templateName.includes('Analiz') || templateName.includes('Analysis')) return BarChart3
    if (templateName.includes('Hızlı') || templateName.includes('Quick')) return Zap
    return Sparkles
  }

  const getTemplateColor = (templateName: string) => {
    if (templateName.includes('Blog')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    if (templateName.includes('Email')) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (templateName.includes('Analiz') || templateName.includes('Analysis')) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
    if (templateName.includes('Hızlı') || templateName.includes('Quick')) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
  }

  const handleExecute = () => {
    if (selectedTemplate && prompt.trim()) {
      onExecutePipeline(selectedTemplate.id, prompt)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 min-h-[60vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🚀 AI Pipeline Templates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="flex h-96">
          {/* Template List */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Hazır Template'lar
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {templates.map((template) => {
                const Icon = getTemplateIcon(template.name)
                const colorClass = getTemplateColor(template.name)
                
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors $\\{
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-md $\\{colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {template.steps.length} adım
                          </span>
                          {template.lastUsedAt && (
                            <span className="text-xs text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Son kullanım
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pipeline Executor */}
          <div className="w-1/2 p-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pipeline Adımları:
                  </h4>
                  <div className="space-y-1">
                    {selectedTemplate.steps.map((step, index) => (
                      <div key={index} className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mr-2 text-[10px]">
                          {step.order}
                        </span>
                        {step.aiProviderName}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt'ınız:
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Pipeline için prompt'ınızı yazın..."
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleExecute}
                  disabled={!prompt.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>Pipeline'ı Çalıştır</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bir template seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
