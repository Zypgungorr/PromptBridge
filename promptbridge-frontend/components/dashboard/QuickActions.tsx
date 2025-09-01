'use client'

interface QuickActionsProps {
  onShowHistory: () => void
  onNewChat: () => void
  onShowPipelines?: () => void
  onQuickPipeline?: () => void
}

function QuickActions(props: QuickActionsProps) {
  const { onShowHistory, onNewChat, onShowPipelines, onQuickPipeline } = props
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Hızlı İşlemler
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={onNewChat}
          className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
        >
          Yeni Chat
        </button>
        
        <button
          onClick={onShowHistory}
          className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
        >
          Chat Geçmişi
        </button>

        {onShowPipelines && (
          <button
            onClick={onShowPipelines}
            className="w-full px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
          >
            Pipeline Builder
          </button>
        )}
      </div>
    </div>
  )
}

export default QuickActions