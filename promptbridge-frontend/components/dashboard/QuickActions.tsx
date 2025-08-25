// 'use client'

// import { RotateCcw, Settings } from 'lucide-react'

// interface QuickActionsProps {
//   onClearChat: () => void
// }

// export default function QuickActions({ onClearChat }: QuickActionsProps) {
//   return (
//     <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
//       <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hızlı İşlemler</h3>
//       <div className="space-y-2">
//         <button
//           onClick={onClearChat}
//           className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
//         >
//           <RotateCcw className="h-4 w-4 mr-2" />
//           Sohbeti Temizle
//         </button>
//         <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
//           <Settings className="h-4 w-4 mr-2" />
//           Ayarlar
//         </button>
//       </div>
//     </div>
//   )
// }


'use client'

import { Plus, History  } from 'lucide-react'

interface QuickActionsProps {
  onShowHistory: () => void;
  onNewChat: () => void;
}

export default function QuickActions({ onShowHistory, onNewChat }: QuickActionsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Hızlı İşlemler
      </h3>
      <div className="space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Sohbet</span>
        </button>
        <button
          onClick={onShowHistory}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <History className="h-4 w-4" />
          <span>Geçmiş</span>
        </button>
      </div>
    </div>
  );
}