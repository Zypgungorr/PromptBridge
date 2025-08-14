'use client'

import { RotateCcw, Settings } from 'lucide-react'

interface QuickActionsProps {
  onClearChat: () => void
}

export default function QuickActions({ onClearChat }: QuickActionsProps) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hızlı İşlemler</h3>
      <div className="space-y-2">
        <button
          onClick={onClearChat}
          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Sohbeti Temizle
        </button>
        <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
          <Settings className="h-4 w-4 mr-2" />
          Ayarlar
        </button>
      </div>
    </div>
  )
}
