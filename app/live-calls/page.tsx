"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Loader2, Radio, PhoneIncoming } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCustomerNameByJobId, getPhoneNumberByJobId } from "@/lib/call-memory"

interface LiveCall {
  id: string
  jobId: string
  customerName: string
  phoneNumber: string
  status: string
  createdAt: string
  duration: number
}

export default function LiveCallsPage() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchLiveCalls = async () => {
    try {
      console.log("[v0] Fetching live calls from Hamsa API...")

      // Fetch all recent jobs from Hamsa (same as Call Logs)
      const response = await fetch("/api/hamsa/jobs?limit=50")

      if (!response.ok) {
        throw new Error("Failed to fetch jobs from Hamsa")
      }

      const data = await response.json()
      const jobs = data.data?.jobs || []

      console.log("[v0] Fetched jobs:", jobs.length)

      const activeJobs = jobs
        .map((job: any) => {
          // Get customer info from localStorage using job ID
          const customerNameFromMemory = getCustomerNameByJobId(job.id)
          const phoneNumberFromMemory = getPhoneNumberByJobId(job.id)

          // Only include calls that we have in our local memory (calls we initiated)
          if (!customerNameFromMemory) {
            return null
          }

          const hamsaStatus = (job.status || "").toUpperCase()

          if (
            hamsaStatus !== "PENDING" &&
            hamsaStatus !== "QUEUED" &&
            hamsaStatus !== "IN-PROGRESS" &&
            hamsaStatus !== "IN_PROGRESS" &&
            hamsaStatus !== "RUNNING" &&
            hamsaStatus !== "ACTIVE"
          ) {
            return null
          }

          // Determine the exact status
          let callStatus = "in-progress"
          if (hamsaStatus === "PENDING" || hamsaStatus === "QUEUED") {
            callStatus = "pending"
          }

          const durationInSeconds = job.duration || 0

          return {
            id: job.id,
            jobId: job.id,
            customerName: customerNameFromMemory,
            phoneNumber: phoneNumberFromMemory || job.customer?.number || "N/A",
            status: callStatus,
            createdAt: job.createdAt,
            duration: durationInSeconds,
          }
        })
        .filter((call) => call !== null) // Remove null entries

      console.log("[v0] Active live calls (PENDING + IN_PROGRESS):", activeJobs.length)
      setLiveCalls(activeJobs)
    } catch (error) {
      console.error("[v0] Error fetching live calls:", error)
      toast({
        title: "Error",
        description: "Failed to load live calls",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveCalls()
    const interval = setInterval(fetchLiveCalls, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    if (status === "in-progress") return "success"
    if (status === "pending") return "warning"
    return "default"
  }

  const getStatusLabel = (status: string) => {
    if (status === "in-progress") return "Active Call"
    if (status === "pending") return "Ringing"
    return status
  }

  const getStatusIcon = (status: string) => {
    if (status === "in-progress") {
      return <Radio className="h-4 w-4 animate-pulse text-success" />
    }
    if (status === "pending") {
      return <PhoneIncoming className="h-4 w-4 animate-bounce text-warning" />
    }
    return <Phone className="h-4 w-4" />
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString("en")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold tracking-tight">Live Calls</h1>
          <p className="text-muted-foreground">Active and ringing calls in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
            <Radio className="h-4 w-4 animate-pulse text-success" />
            <span className="font-sans text-sm font-medium">{liveCalls.length} Live</span>
          </div>
        </div>
      </div>

      {liveCalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-sans text-lg font-medium text-muted-foreground">No active calls at the moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ongoing and ringing calls will appear here automatically
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveCalls.map((call) => (
            <Card key={call.id} className="relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-24 w-24 -translate-x-8 -translate-y-8 rounded-full ${
                  call.status === "pending" ? "bg-warning/10" : "bg-success/10"
                }`}
              />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-sans text-xl">{call.customerName}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-sm">{call.phoneNumber}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(call.status)} className="flex items-center gap-1">
                    {getStatusIcon(call.status)}
                    {getStatusLabel(call.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono font-medium">{formatDuration(call.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-sans">{formatTime(call.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Call ID</span>
                    <span className="font-mono text-xs">{call.jobId.slice(0, 12)}...</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled>
                    <PhoneOff className="ml-2 h-4 w-4" />
                    End Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
