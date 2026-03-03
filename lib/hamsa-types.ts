/**
 * Hamsa API TypeScript Types
 */

export interface HamsaJob {
  id: string
  title: string
  model: string
  type: string
  processingType: string
  webhookUrl: string | null
  totalCost: number
  usageTime: string
  fromLng: string
  toLng: string
  mediaUrl: string | null
  jobResponse: any
  fromScript: string | null
  toScript: string | null
  status: "PENDING" | "COMPLETED" | "FAILED"
  relevantJobId: string | null
  agentDetails?: HamsaAgentDetailsResponse
  apiKeyId: string
  billingId: string
  systemModelKey: string
  voiceAgentId: string | null
  createdAt: string
  updatedAt: string
}

export interface HamsaAgentDetailsResponse {
  id: string
  agentName: string
  greetingMessage: string
  description: string
  preamble: string
  lang: "ar" | "en"
  pokeMessages: string[]
  realTime: boolean
  silenceThreshold: number
  interrupt: boolean
  outcome: string | null
  outcomeResponseShape: any
  projectId: string
  apiKeyId: string
  voiceRecordId: string
  voiceRecord: any
  webhookUrl: string | null
  webhookAuth: {
    authKey: string
    authSecret: string
  } | null
  params: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface HamsaCallResponse {
  success: boolean
  message: string
  data: {
    voiceAgentId: string
    jobId: string
  }
}

export interface HamsaJobsResponse {
  success: boolean
  message: string
  data: {
    jobs: HamsaJob[]
    total: number
    page: number
    pageSize: number
  }
}

export interface HamsaVoiceAgent {
  id: string
  agentName: string
  greetingMessage: string
  description: string
  preamble: string
  lang: "ar" | "en"
  pokeMessages: string[]
  realTime: boolean
  silenceThreshold: number
  interrupt: boolean
  voiceRecordId: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface HamsaStatisticsNumbers {
  success: boolean
  message: string
  data: {
    totalCalls: number
    totalDuration: number
    totalCost: number
    averageDuration: number
    successRate: number
    failedCalls: number
    completedCalls: number
    pendingCalls: number
  }
}

export interface HamsaStatisticsChart {
  success: boolean
  message: string
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }>
  }
}

export interface HamsaProject {
  success: boolean
  message: string
  data: {
    id: string
    name: string
    apiKeyId: string
    createdAt: string
    updatedAt: string
  }
}

// Call status mapping from Hamsa job status to our UI
export type CallStatus = "queued" | "ringing" | "in-progress" | "completed" | "failed" | "ended"

export function mapHamsaStatusToCallStatus(hamsaStatus: string): CallStatus {
  switch (hamsaStatus) {
    case "PENDING":
      return "queued"
    case "COMPLETED":
      return "completed"
    case "FAILED":
      return "failed"
    default:
      return "in-progress"
  }
}
