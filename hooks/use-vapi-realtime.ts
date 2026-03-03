"use client"

import { useState, useEffect } from "react"

interface VAPIRealtimeEvent {
  type: "call.started" | "call.ended" | "transcript.updated" | "recording.ready"
  callId: string
  data: any
}

export function useVAPIRealtime() {
  const [events, setEvents] = useState<VAPIRealtimeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // In production, this would connect to a WebSocket or Server-Sent Events
    // For now, we'll simulate real-time updates

    console.log("[v0] VAPI real-time connection initialized")
    setIsConnected(true)

    // Simulate receiving events
    const simulateEvent = () => {
      const mockEvent: VAPIRealtimeEvent = {
        type: "transcript.updated",
        callId: "call-" + Math.random().toString(36).substr(2, 9),
        data: {
          transcript: "Customer is speaking...",
          timestamp: new Date().toISOString(),
        },
      }
      setEvents((prev) => [...prev.slice(-10), mockEvent])
    }

    const interval = setInterval(simulateEvent, 10000)

    return () => {
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [])

  return { events, isConnected }
}
