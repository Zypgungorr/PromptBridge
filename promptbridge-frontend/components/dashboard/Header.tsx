'use client'

import { History } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps {
  showHistory: boolean
  onToggleHistory: () => void
  onLogout: () => void
}

export default function Header({ showHistory, onToggleHistory, onLogout }: HeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PromptBridge</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button 
              onClick={onToggleHistory}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              <History className="h-4 w-4 mr-2" />
              Geçmiş
            </button>
                          <button 
                onClick={onLogout}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Çıkış Yap
              </button>
          </div>
        </div>
      </div>
    </div>
  )
}
