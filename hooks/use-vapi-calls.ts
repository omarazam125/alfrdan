"use client"

import { useState, useEffect } from "react"
import { getVAPIClient, type VAPICall } from "@/lib/vapi-config"

export function useVAPICalls(status?: string) {
  const [calls, setCalls] = useState<VAPICall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCalls() {
      try {
        setLoading(true)
        const vapiClient = getVAPIClient()
        const data = await vapiClient.getCalls({ status, limit: 50 })
        setCalls(data)
        setError(null)
      } catch (err) {
        setError("Failed to fetch calls")
        console.error("[v0] Error fetching calls:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()

    // Poll for updates every 5 seconds for active calls
    const interval = setInterval(fetchCalls, 5000)

    return () => clearInterval(interval)
  }, [status])

  return { calls, loading, error }
}
