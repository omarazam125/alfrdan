/**
 * Hamsa API Client
 * A wrapper for all Hamsa API interactions
 */

interface HamsaConfig {
  apiKey: string
  baseUrl: string
}

interface HamsaCallParams {
  toNumber: string
  phoneNumber?: string
  fromNumber?: string
  voiceAgentId?: string | null
  params?: Record<string, any>
  agentDetails?: HamsaAgentDetails
  webhookUrl?: string
  webhookAuth?: {
    authKey: string
    authSecret: string
  }
}

interface HamsaAgentDetails {
  agentName?: string
  greetingMessage?: string
  preamble?: string
  lang?: "ar" | "en"
  pokeMessages?: string[]
  realTime?: boolean
  silenceThreshold?: number
  interrupt?: boolean
  outcome?: string
  webhookUrl?: string | null
  webhookAuth?: {
    authKey: string
    authSecret: string
  }
  outcomeResponseShape?: any
  voiceId?: string
  tools?: {
    genderDetection?: boolean
    smartCallEnd?: boolean
  }
  params?: Record<string, any>
}

interface HamsaJobsFilter {
  sort?: {
    field: string
    direction: "asc" | "desc"
  }
  take?: number
  skip?: number
  search?: string
  status?: "PENDING" | "COMPLETED" | "FAILED"
  type?: "TRANSCRIPTION" | "TRANSLATION" | "TTS" | "AI_CONTENT"
}

export class HamsaClient {
  private config: HamsaConfig
  private projectIdCache: string | null = null

  constructor(config: HamsaConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers = {
      Authorization: `Token ${this.config.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hamsa API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create an outbound call using custom phone number
   * Updated to use conference-based calling for listen capability
   */
  async createCallWithPhoneNumber(params: HamsaCallParams) {
    console.log("[v0] Sending call request to Hamsa API...")

    const endpoint = `/voice-agents/phone-number/call`

    const conferenceName = `call_${Date.now()}`

    const fromNumber = params.fromNumber || process.env.HAMSA_PHONE_NUMBER || "+13183785706"

    const requestBody = {
      voiceAgentId: params.voiceAgentId,
      phoneNumber: fromNumber,
      toNumber: params.toNumber,
      params: {
        ...params.params,
        conferenceName, // Pass conference name for consistent room naming
      },
    }

    console.log("[v0] Endpoint:", endpoint)
    console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

    const response = await this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Full Hamsa call response:", JSON.stringify(response, null, 2))
    console.log("[v0] Response data:", response.data)
    console.log("[v0] Job ID:", response.data?.jobId || response.data?.id || "NOT FOUND")

    return response
  }

  /**
   * Create an outbound call using Hamsa's default numbers
   */
  async createCall(params: HamsaCallParams) {
    return this.request("/voice-agents/call", {
      method: "POST",
      body: JSON.stringify(params),
    })
  }

  /**
   * Get list of jobs/calls
   */
  async getJobs(projectId?: string, filter?: HamsaJobsFilter) {
    try {
      const pid = projectId || (await this.getProjectId())
      const queryParams = new URLSearchParams({ projectId: pid })

      const response = await this.request(`/jobs/all?${queryParams}`, {
        method: "POST",
        body: JSON.stringify(
          filter || {
            sort: {
              field: "createdAt",
              direction: "desc",
            },
            take: 50,
            skip: 1,
          },
        ),
      })

      return response
    } catch (error) {
      console.error("[v0] Error in getJobs:", error)
      throw error
    }
  }

  /**
   * Get job details by ID
   */
  async getJobDetails(jobId: string, options?: { search?: string; speaker?: string }) {
    const queryParams = new URLSearchParams({ jobId })
    if (options?.search) queryParams.append("search", options.search)
    if (options?.speaker) queryParams.append("speaker", options.speaker)

    return this.request(`/jobs?${queryParams}`)
  }

  /**
   * Get voice agents list
   */
  async getVoiceAgents(skip = 1, take = 10) {
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      take: take.toString(),
    })
    return this.request(`/voice-agents?${queryParams}`)
  }

  /**
   * Get voice agent by ID
   */
  async getVoiceAgentById(voiceAgentId: string) {
    return this.request(`/voice-agents/${voiceAgentId}`)
  }

  /**
   * Get project statistics - numbers
   */
  async getStatisticsNumbers(projectId?: string, startPeriod?: string, endPeriod?: string) {
    const pid = projectId || (await this.getProjectId())

    const endDate = endPeriod ? new Date(endPeriod) : new Date()
    const startDate = startPeriod ? new Date(startPeriod) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const queryParams = new URLSearchParams({
      projectId: pid,
      startPeriod: startDate.getTime().toString(),
      endPeriod: endDate.getTime().toString(),
    })

    const response = await this.request(`/projects/statistics/numbers?${queryParams}`)
    console.log("[v0] Full statistics response:", JSON.stringify(response, null, 2))
    return response
  }

  /**
   * Get project statistics - chart
   */
  async getStatisticsChart(projectId?: string, startPeriod?: string, endPeriod?: string) {
    const pid = projectId || (await this.getProjectId())

    const queryParams = new URLSearchParams({ projectId: pid })
    if (startPeriod) {
      queryParams.append("startPeriod", new Date(startPeriod).getTime().toString())
    }
    if (endPeriod) {
      queryParams.append("endPeriod", new Date(endPeriod).getTime().toString())
    }
    return this.request(`/projects/statistics/chart?${queryParams}`)
  }

  /**
   * Get project details by API key
   */
  async getProject() {
    return this.request("/projects/by-api-key")
  }

  /**
   * Get project ID (cached after first call)
   */
  private async getProjectId(): Promise<string> {
    if (this.projectIdCache) {
      console.log("[v0] Using cached projectId:", this.projectIdCache)
      return this.projectIdCache
    }

    try {
      const project = await this.getProject()
      console.log("[v0] Project response:", JSON.stringify(project, null, 2))

      const projectId = project?.data?.id

      if (!projectId) {
        console.error("[v0] Could not find project ID in response. Response was:", project)
        throw new Error("Could not extract projectId from response. Please set HAMSA_PROJECT_ID manually.")
      }

      this.projectIdCache = projectId
      console.log("[v0] Extracted and cached projectId:", this.projectIdCache)
      return this.projectIdCache
    } catch (error) {
      console.error("[v0] Error getting project ID:", error)
      const envProjectId = process.env.HAMSA_PROJECT_ID
      if (envProjectId) {
        console.log("[v0] Using HAMSA_PROJECT_ID from environment")
        this.projectIdCache = envProjectId
        return envProjectId
      }
      throw error
    }
  }

  /**
   * Check connection status
   */
  async checkStatus() {
    try {
      await this.getProject()
      return { connected: true, message: "Connected to Shaffra AI Cloud" }
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }
  }
}

/**
 * Create a Hamsa client instance
 */
export function createHamsaClient(): HamsaClient {
  const apiKey = process.env.HAMSA_API_KEY
  const baseUrl = process.env.HAMSA_BASE_URL || "https://api.tryhamsa.com/v1"

  if (!apiKey) {
    throw new Error("HAMSA_API_KEY environment variable is not set")
  }

  return new HamsaClient({ apiKey, baseUrl })
}
