"use client"

import { useState, useEffect, useRef } from "react"

interface TwilioVoiceHook {
  isInitialized: boolean
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  connect: (conferenceName: string) => Promise<void>
  disconnect: () => void
  mute: () => void
  unmute: () => void
  isMuted: boolean
}

export function useTwilioVoice(): TwilioVoiceHook {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deviceRef = useRef<any>(null)
  const callRef = useRef<any>(null)

  useEffect(() => {
    const loadTwilioSDK = async () => {
      if (typeof window === "undefined") return

      try {
        // @ts-ignore - Twilio Device SDK loaded via CDN
        if (!window.Twilio?.Device) {
          const script = document.createElement("script")
          script.src = "https://sdk.twilio.com/js/client/v1.14/twilio.min.js"
          script.async = true
          document.body.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        console.log("[v0] Twilio Voice SDK loaded")
        setIsInitialized(true)
      } catch (err) {
        console.error("[v0] Failed to load Twilio SDK:", err)
        setError("Failed to load Twilio Voice SDK")
      }
    }

    loadTwilioSDK()
  }, [])

  const connect = async (conferenceName: string) => {
    if (!isInitialized) {
      setError("Twilio SDK not initialized")
      return
    }

    try {
      setIsConnecting(true)
      setError(null)

      console.log("[v0] Fetching Twilio token...")
      const response = await fetch("/api/twilio/token")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get token")
      }

      console.log("[v0] Token received, initializing device...")

      // @ts-ignore
      const Device = window.Twilio.Device
      const device = new Device(data.token, {
        codecPreferences: ["opus", "pcmu"],
        fakeLocalDTMF: true,
        enableRingingState: true,
      })

      device.on("ready", () => {
        console.log("[v0] Twilio Device ready")
      })

      device.on("error", (error: any) => {
        console.error("[v0] Twilio Device error:", error)
        setError(error.message || "Device error")
        setIsConnecting(false)
        setIsConnected(false)
      })

      device.on("connect", (conn: any) => {
        console.log("[v0] Successfully connected to conference")
        setIsConnected(true)
        setIsConnecting(false)
        callRef.current = conn

        // Mute by default for listen-only mode
        if (conn.mute) {
          conn.mute(true)
          setIsMuted(true)
        }
      })

      device.on("disconnect", () => {
        console.log("[v0] Disconnected from conference")
        setIsConnected(false)
        setIsConnecting(false)
        callRef.current = null
      })

      deviceRef.current = device

      console.log("[v0] Connecting to conference:", conferenceName)
      await device.connect({
        conferenceName: conferenceName,
      })
    } catch (err) {
      console.error("[v0] Error connecting:", err)
      setError(err instanceof Error ? err.message : "Connection failed")
      setIsConnecting(false)
      setIsConnected(false)
    }
  }

  const disconnect = () => {
    if (deviceRef.current) {
      console.log("[v0] Disconnecting from conference")
      deviceRef.current.disconnectAll()
      deviceRef.current = null
      callRef.current = null
      setIsConnected(false)
    }
  }

  const mute = () => {
    if (callRef.current && callRef.current.mute) {
      callRef.current.mute(true)
      setIsMuted(true)
      console.log("[v0] Muted")
    }
  }

  const unmute = () => {
    if (callRef.current && callRef.current.mute) {
      callRef.current.mute(false)
      setIsMuted(false)
      console.log("[v0] Unmuted")
    }
  }

  return {
    isInitialized,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    mute,
    unmute,
    isMuted,
  }
}
