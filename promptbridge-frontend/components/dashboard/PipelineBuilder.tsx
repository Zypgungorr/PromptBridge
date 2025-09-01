'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, ArrowDown, Settings, Info } from 'lucide-react'
import type { CustomPipelineData, CustomPipelineStep } from '@/types/dashboard'

interface PipelineBuilderProps {
  isOpen: boolean
  onClose: () => void
  onExecutePipeline: (pipelineData: CustomPipelineData) => void
}

interface AIProvider {
  id: number
  name: string
  description: string
}

export default function PipelineBuilder({ isOpen, onClose, onExecutePipeline }: PipelineBuilderProps) {
  const [pipelineName, setPipelineName] = useState('')
  const [pipelineDescription, setPipelineDescription] = useState('')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [steps, setSteps] = useState<CustomPipelineStep[]>([])
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [userInput, setUserInput] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProviders()
      // İlk step'i otomatik ekle
      if (steps.length === 0) {
        addInitialStep()
      }
    }
  }, [isOpen])

  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/prompt/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const addInitialStep = () => {
    const newStep: CustomPipelineStep = {
      id: 'initial',
      order: 1,
      aiProviderId: providers.length > 0 ? providers[0].id : 3,
      prompt: '',
      outputFormat: 'text'
    }
    setSteps([newStep])
  }

  const addStep = () => {
    const newStep: CustomPipelineStep = {
      id: Date.now().toString(),
      order: steps.length + 1,
      aiProviderId: providers.length > 0 ? providers[0].id : 3,
      prompt: '',
      outputFormat: 'text'
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (stepId: string) => {
    if (steps.length <= 1) return // En az bir step olmalı
    const newSteps = steps.filter(step => step.id !== stepId)
    // Order'ları yeniden düzenle
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }))
    setSteps(reorderedSteps)
  }

  const updateStep = (stepId: string, field: keyof CustomPipelineStep, value: any) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { ...step, [field]: value }
        : step
    ))
  }

  // Prompt'ları otomatik olarak oluştur
  const buildFinalPrompts = () => {
    return steps.map((step, index) => {
      if (index === 0) {
        // İlk adım: kullanıcı girişi + ilk prompt
        return {
          ...step,
          prompt: `${initialPrompt}\n\nMetin: {userInput}`
        }
      } else {
        // Sonraki adımlar: önceki cevap + yeni talimat
        return {
          ...step,
          prompt: `{previousResponse}\n\n${step.prompt}`
        }
      }
    })
  }

  const handleExecute = () => {
    if (!userInput.trim()) {
      alert('Lütfen işlenecek metni girin!')
      return
    }

    if (!initialPrompt.trim()) {
      alert('Lütfen ilk adım için talimat girin!')
      return
    }

    if (steps.slice(1).some(step => !step.prompt.trim())) {
      alert('Lütfen tüm adımlar için talimat girin!')
      return
    }

    const finalSteps = buildFinalPrompts()
    
    const pipelineData: CustomPipelineData = {
      name: pipelineName || 'Özel Pipeline',
      description: pipelineDescription || 'Kullanıcı tarafından oluşturulan pipeline',
      steps: finalSteps,
      userInput: userInput
    }

    onExecutePipeline(pipelineData)
    onClose()
  }

  const resetForm = () => {
    setPipelineName('')
    setPipelineDescription('')
    setInitialPrompt('')
    setSteps([])
    setUserInput('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pipeline Builder
          </h3>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pipeline Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pipeline Adı
              </label>
              <input
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Özel Pipeline"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama
              </label>
              <input
                type="text"
                value={pipelineDescription}
                onChange={(e) => setPipelineDescription(e.target.value)}
                placeholder="Pipeline açıklaması"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* İşlenecek Metin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              İşlenecek Metin
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Pipeline'ın işleyeceği metni buraya yazın..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* İlk Adım - Ana Talimat */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İlk Adım - Ana Talimat
                </label>
                <textarea
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  placeholder="İlk AI'a nasıl bir işlem yapmasını istiyorsunuz? (Örn: Bu metni analiz et ve özetini çıkar)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İlk Adım AI Provider
                </label>
                <select
                  value={steps[0]?.aiProviderId || 3}
                  onChange={(e) => steps.length > 0 && updateStep('initial', 'aiProviderId', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Çıktı Formatı
                  </label>
                  <select
                    value={steps[0]?.outputFormat || 'text'}
                    onChange={(e) => steps.length > 0 && updateStep('initial', 'outputFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="text">Metin</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <span>Bu talimat + işlenecek metin otomatik olarak birinci AI'a gönderilecek</span>
            </div>
          </div>

          {/* Pipeline Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Ek Adımlar (İsteğe Bağlı)
              </h4>
              <button
                onClick={addStep}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Adım Ekle</span>
              </button>
            </div>

            {/* İlk adımın özeti */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                  Adım 1
                </span>
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {providers.find(p => p.id === (steps[0]?.aiProviderId || 3))?.name || 'AI Provider'}
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {initialPrompt || 'İlk talimatınızı yukarıda yazın'} + İşlenecek metin
              </p>
            </div>

            <div className="space-y-4">
              {steps.slice(1).map((step, index) => (
                <div key={step.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-medium">
                        Adım {step.order}
                      </span>
                      <ArrowDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI Provider
                      </label>
                      <select
                        value={step.aiProviderId}
                        onChange={(e) => updateStep(step.id, 'aiProviderId', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {providers.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Çıktı Formatı
                      </label>
                      <select
                        value={step.outputFormat}
                        onChange={(e) => updateStep(step.id, 'outputFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="text">Metin</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bu Adımda Ne Yapılsın?
                    </label>
                    <textarea
                      value={step.prompt}
                      onChange={(e) => updateStep(step.id, 'prompt', e.target.value)}
                      placeholder="Önceki adımdan gelen cevaba ne yapılmasını istiyorsunuz? (Örn: Daha resmi bir dille yeniden yaz)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex items-center space-x-2 mt-2 text-sm text-green-600 dark:text-green-400">
                      <Info className="h-4 w-4" />
                      <span>Önceki adımın cevabı + bu talimat otomatik olarak bu AI'a gönderilecek</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              İptal
            </button>
            <button
              onClick={handleExecute}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Pipeline'ı Çalıştır
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
