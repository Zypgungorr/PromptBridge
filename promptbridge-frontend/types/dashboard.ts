export interface AIProvider {
  id: string
  name: string
  description: string
  icon: any
  color: string
  isActive: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  providerId: string
  providerName: string
  timestamp: Date
  prompt?: string
}

export interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  lastActivityAt: string;
  messageCount: number;
}