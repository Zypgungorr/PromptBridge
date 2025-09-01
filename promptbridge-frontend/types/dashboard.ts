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

// Pipeline Types
export interface PipelineStep {
  order: number
  stepType: string
  aiProviderId: number
  aiProviderName: string
  promptTemplate: string
}

export interface Pipeline {
  id: number
  name: string
  description: string
  steps: PipelineStep[]
  isTemplate: boolean
  createdAt: string
  lastUsedAt?: string
}

export interface PipelineStepResult {
  order: number
  stepType: string
  aiProviderName: string
  prompt: string
  response: string
  status: string
  executionTimeMs: number
  wasConditionMet: boolean
  performanceScore: number
}

export interface PipelineExecution {
  executionId: number
  status: 'Running' | 'Completed' | 'Failed'
  finalResponse: string
  stepResults: PipelineStepResult[]
  totalExecutionTimeMs: number
  errorMessage?: string
}

// Custom Pipeline Builder Types
export interface CustomPipelineStep {
  id: string
  order: number
  aiProviderId: number
  prompt: string
  outputFormat: string
}

export interface CustomPipelineData {
  name: string
  description: string
  steps: CustomPipelineStep[]
  userInput?: string
}