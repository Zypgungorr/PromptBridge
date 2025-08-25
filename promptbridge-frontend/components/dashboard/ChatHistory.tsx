'use client';

import { useState, useEffect } from 'react';
import { History, MessageSquare, Trash2, Plus } from 'lucide-react';
import type { ChatMessage } from '@/types/dashboard';

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
  messageCount: number;
}

interface ChatHistoryProps {
  isVisible: boolean;
  onClose: () => void;
  onLoadSession: (sessionId: string) => void; // string olarak
  currentSessionId: string | null; // string olarak
}

export default function ChatHistory({ 
  isVisible, 
  onClose, 
  onLoadSession,
  currentSessionId 
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5170/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched sessions:', data); 
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      console.log('Loading session:', sessionId); 
      // Sadece sessionId'yi parent'a gönder
      onLoadSession(sessionId);
      setSelectedSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5170/api/prompt/sessions/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Yeni Sohbet' })
      });
      
      if (response.ok) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchSessions();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat Geçmişi ({sessions.length} sohbet)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={createNewSession}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Sohbet</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Henüz chat geçmişi yok
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSessionId === session.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{session.messageCount} mesaj</span>
                        </span>
                        <span>
                          {new Date(session.lastActivityAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    {currentSessionId === session.id && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}