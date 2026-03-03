"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Phone, PhoneMissed, Loader2, MoreVertical, Headphones, Send } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useTwilioVoice } from "@/hooks/use-twilio-voice"
import { ALMOAYYED_SCENARIOS, type ScenarioField } from "@/lib/call-scenarios"
import { AIQuestionGenerator } from "@/components/ai-question-generator"
import { saveCallToMemory } from "@/lib/call-memory"
import { useRouter } from "next/navigation"

const OMANTEL_SCENARIOS = ALMOAYYED_SCENARIOS; // Assuming ALMOAYYED_SCENARIOS is the correct variable to use

interface TwilioCall {
  sid: string
  from: string
  to: string
  status: string
  direction: string
  duration: string
  startTime: string
}

interface HamsaJob {
  id: string
  status: string
  createdAt: string
  agentDetails?: {
    params?: {
      customerName?: string
      phoneNumber?: string
    }
  }
}

interface LiveCall {
  id: string
  customerName: string
  phoneNumber: string
  status: string
  duration: string
  startedAt: string
  twilioSid?: string
  hamsaJobId: string
}

export default function CallsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCallLoading, setIsCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([])
  const [isLoadingCalls, setIsLoadingCalls] = useState(true)

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<"ar" | "en">("en")
  const [formData, setFormData] = useState<Record<string, string>>({})

  const [endingCallId, setEndingCallId] = useState<string | null>(null)
  const [liveInstructionOpen, setLiveInstructionOpen] = useState<string | null>(null)
  const [liveInstruction, setLiveInstruction] = useState("")
  const { toast } = useToast()
  const twilioVoice = useTwilioVoice()
  const [listeningToCallId, setListeningToCallId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchCalls() {
      try {
        const [hamsaResponse, twilioResponse] = await Promise.all([
          fetch("/api/hamsa/jobs?limit=50"),
          fetch("/api/twilio/active-calls"),
        ])

        const hamsaData = await hamsaResponse.json()
        const twilioData = twilioResponse.ok ? await twilioResponse.json() : { calls: [] }

        const hamsaJobs: HamsaJob[] = hamsaData.data?.jobs || []
        const twilioCalls: TwilioCall[] = twilioData.calls || []

        console.log("[v0] Hamsa jobs total:", hamsaJobs.length)
        console.log("[v0] Twilio active calls:", twilioCalls.length)

        // Filter Hamsa jobs for active calls (processing or pending status)
        const activeHamsaJobs = hamsaJobs.filter((job: HamsaJob) => {
          const status = job.status?.toLowerCase()
          const isActiveStatus = status === "processing" || status === "pending"

          // Only show calls from last 2 hours to avoid showing old stuck jobs
          if (job.createdAt) {
            const createdTime = new Date(job.createdAt).getTime()
            const now = new Date().getTime()
            const twoHours = 2 * 60 * 60 * 1000
            return isActiveStatus && now - createdTime < twoHours
          }

          return isActiveStatus
        })

        console.log("[v0] Active Hamsa jobs (processing/pending):", activeHamsaJobs.length)

        const transformedCalls: LiveCall[] = activeHamsaJobs
          .map((hamsaJob) => {
            const phoneNumber = hamsaJob.agentDetails?.params?.phoneNumber || "Unknown"

            // Try to find matching Twilio call for additional info
            const twilioCall = twilioCalls.find((call: TwilioCall) => {
              return call.to === phoneNumber || call.from === phoneNumber
            })

            // Calculate duration
            let duration = "0:00"
            let statusText = hamsaJob.status === "processing" ? "In Progress" : "Ringing..."

            if (twilioCall) {
              // If we have Twilio data, use it for accurate status and duration
              statusText = twilioCall.status === "ringing" ? "Ringing..." : "In Progress"

              if (twilioCall.duration && twilioCall.duration !== "0") {
                const durationSeconds = Number.parseInt(twilioCall.duration)
                const minutes = Math.floor(durationSeconds / 60)
                const seconds = durationSeconds % 60
                duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
              } else if (twilioCall.startTime) {
                const startTime = new Date(twilioCall.startTime)
                const now = new Date()
                const durationMs = now.getTime() - startTime.getTime()
                const minutes = Math.floor(durationMs / 60000)
                const seconds = Math.floor((durationMs % 60000) / 1000)
                duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
              }
            } else if (hamsaJob.createdAt) {
              // Fallback to Hamsa createdAt for duration
              const createdTime = new Date(hamsaJob.createdAt)
              const now = new Date()
              const durationMs = now.getTime() - createdTime.getTime()
              const minutes = Math.floor(durationMs / 60000)
              const seconds = Math.floor((durationMs % 60000) / 1000)
              duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
            }

            return {
              id: hamsaJob.id || "",
              customerName: hamsaJob.agentDetails?.params?.customerName || "Unknown",
              phoneNumber,
              status: statusText,
              duration,
              startedAt: twilioCall?.startTime || hamsaJob.createdAt,
              twilioSid: twilioCall?.sid,
              hamsaJobId: hamsaJob.id,
            }
          })
          .filter((call): call is LiveCall => call.id !== "")

        console.log("[v0] Filtered live calls (Hamsa source):", transformedCalls.length)
        console.log("[v0] Transformed live calls:", transformedCalls)

        setLiveCalls(transformedCalls)
      } catch (error) {
        console.error("[v0] Error fetching live calls:", error)
      } finally {
        setIsLoadingCalls(false)
      }
    }

    fetchCalls()
    const interval = setInterval(fetchCalls, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId)
    setFormData({})
    setCallError(null)
  }

  const isFormValid = () => {
    if (!selectedScenario) return false
    return ALMOAYYED_SCENARIOS.find((s) => s.id === selectedScenario)
      ?.fields.filter((f) => f.required)
      .every((f) => formData[f.id]?.trim())
  }

  const handleMakeCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScenario) return

    setIsCallLoading(true)
    setCallError(null)

    try {
      console.log("[v0] Initiating Hamsa call with scenario:", selectedScenario)
      console.log("[v0] Selected language:", selectedLanguage)

      const response = await fetch("/api/hamsa/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          language: selectedLanguage,
          variables: formData,
        }),
      })

      const data = await response.json()

      console.log("[v0] Call API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create call")
      }

      console.log(
        "[v0] Checking data for memory save - jobId:",
        data.jobId,
        "customerName:",
        data.customerName,
        "phoneNumber:",
        data.phoneNumber,
      )

      if (data.jobId && data.customerName && data.phoneNumber) {
        console.log("[v0] Saving to call memory:", {
          jobId: data.jobId,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
        })
        saveCallToMemory(data.jobId, data.customerName, data.phoneNumber)
        console.log("[v0] Call saved to memory successfully")
      } else {
        console.log(
          "[v0] WARNING: Missing data for memory save. jobId:",
          data.jobId,
          "customerName:",
          data.customerName,
          "phoneNumber:",
          data.phoneNumber,
        )
      }

      toast({
        title: "Call Initiated",
        description: data.message || "Call started successfully",
      })
      setIsDialogOpen(false)
      setFormData({})
      setSelectedScenario(null)

      router.push("/live-calls")
    } catch (error) {
      setCallError(error instanceof Error ? error.message : "حدث خطأ غير معروف")
    } finally {
      setIsCallLoading(false)
    }
  }

  const handleEndCall = async (call: LiveCall) => {
    setEndingCallId(call.id)

    try {
      // Try to end via Twilio first if we have the SID
      if (call.twilioSid) {
        const response = await fetch(`/api/twilio/call/${call.twilioSid}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast({
            title: "Call Ended Successfully",
            description: "Call terminated by system",
          })
          return
        }
      }

      // Fallback to Hamsa endpoint
      const response = await fetch(`/api/hamsa/jobs/${call.hamsaJobId}/end`, {
        method: "POST",
        body: JSON.stringify({
          callSid: call.twilioSid || call.hamsaJobId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Call Ended Successfully",
          description: "Call terminated by system",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to End Call",
          description: errorData.message || errorData.error || "Unable to terminate call",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end call",
        variant: "destructive",
      })
    } finally {
      setEndingCallId(null)
    }
  }

  const handleJoinAsListener = async (call: LiveCall) => {
    try {
      if (twilioVoice.isConnected && listeningToCallId === call.id) {
        twilioVoice.disconnect()
        setListeningToCallId(null)
        toast({
          title: "Disconnected",
          description: "Stopped listening to call",
        })
        return
      }

      const conferenceName = `call_${call.hamsaJobId}`
      console.log("[v0] Attempting to join conference:", conferenceName)

      setListeningToCallId(call.id)
      await twilioVoice.connect(conferenceName)

      toast({
        title: "Connected",
        description: "You are now listening to the call",
      })
    } catch (error) {
      console.error("[v0] Error joining as listener:", error)
      setListeningToCallId(null)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join call",
        variant: "destructive",
      })
    }
  }

  const handleSendLiveInstruction = async (callId: string) => {
    if (!liveInstruction.trim()) return

    try {
      toast({
        title: "Coming Soon",
        description: "Live instruction feature is under development",
      })

      setLiveInstructionOpen(null)
      setLiveInstruction("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send instruction",
        variant: "destructive",
      })
    }
  }

  const renderField = (field: ScenarioField) => {
    const label = selectedLanguage === "ar" ? field.label : field.labelEn
    const placeholder = selectedLanguage === "ar" ? field.placeholder : field.placeholderEn

    if (field.type === "ai-questions") {
      return (
        <div key={field.id} className="md:col-span-2">
          <AIQuestionGenerator
            label={label}
            placeholder={placeholder}
            required={field.required}
            value={formData[field.id] || ""}
            onChange={(value) => setFormData({ ...formData, [field.id]: value })}
            language={selectedLanguage}
          />
        </div>
      )
    }

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id} className="font-sans text-sm font-medium">
              {label} {field.required && "*"}
            </Label>
            <Textarea
              id={field.id}
              placeholder={placeholder}
              className="mt-1.5 font-sans"
              rows={3}
              value={formData[field.id] || ""}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            />
          </div>
        )
      case "select":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id} className="font-sans text-sm font-medium">
              {label} {field.required && "*"}
            </Label>
            <Select
              value={formData[field.id] || ""}
              onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {selectedLanguage === "ar" ? opt.label : opt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      default:
        return (
          <div key={field.id}>
            <Label htmlFor={field.id} className="font-sans text-sm font-medium">
              {label} {field.required && "*"}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={placeholder}
              className="mt-1.5 font-sans"
              value={formData[field.id] || ""}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            />
            {field.id === "customerEmail" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Email is for internal records only - Agent Omar will not mention it during the call
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold text-foreground">Call Management</h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Make calls and monitor live call activity in real-time
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(!isDialogOpen)} className="gap-2">
            <Phone className="h-4 w-4" />
            Make New Call
          </Button>
        </div>

        {isDialogOpen && (
          <Card className="mb-6 border-green-500/30 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                Initiate Outbound Call
              </CardTitle>
              {selectedScenario && (
                <p className="mt-1 font-sans text-sm text-muted-foreground">
                  {selectedLanguage === "ar"
                    ? ALMOAYYED_SCENARIOS.find((s) => s.id === selectedScenario)?.description
                    : ALMOAYYED_SCENARIOS.find((s) => s.id === selectedScenario)?.descriptionEn}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {callError && (
                <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="font-sans text-sm text-destructive">{callError}</p>
                </div>
              )}

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="font-sans text-sm font-medium">Call Scenario *</Label>
                  <Select onValueChange={handleScenarioChange} value={selectedScenario || ""}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a call scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALMOAYYED_SCENARIOS.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          <span className="flex items-center gap-2">
                            <span>{scenario.icon}</span>
                            <span>{selectedLanguage === "ar" ? scenario.name : scenario.nameEn}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-sans text-sm font-medium">Call Language *</Label>
                  <Select value={selectedLanguage} onValueChange={(value: "ar" | "en") => setSelectedLanguage(value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">
                        <span className="flex items-center gap-2">
                          <span>العربية</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="en">
                        <span className="flex items-center gap-2">
                          <span>English</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedScenario && (
                <div className="grid gap-4 md:grid-cols-2">
                  {ALMOAYYED_SCENARIOS.find((s) => s.id === selectedScenario)?.fields.map((field) => renderField(field))}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  className="gap-2"
                  onClick={handleMakeCall}
                  disabled={isCallLoading || !isFormValid()}
                >
                  {isCallLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      Start Call
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setSelectedScenario(null)
                    setFormData({})
                  }}
                  disabled={isCallLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                Live Calls ({liveCalls.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="font-sans text-sm text-muted-foreground">Updates every 2 seconds</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCalls ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : liveCalls.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <span className="font-sans text-sm text-muted-foreground">No active calls at the moment</span>
              </div>
            ) : (
              <div className="space-y-3">
                {liveCalls.map((call) => {
                  const isListening = listeningToCallId === call.id && twilioVoice.isConnected
                  const isConnecting = listeningToCallId === call.id && twilioVoice.isConnecting

                  return (
                    <div
                      key={call.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-1 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                          <Phone className="h-6 w-6 text-green-500" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-sans font-semibold text-foreground">{call.customerName}</h3>
                            <Badge
                              variant={call.status === "Ringing..." ? "default" : "secondary"}
                              className={
                                call.status === "Ringing..."
                                  ? "animate-pulse bg-amber-500 text-white hover:bg-amber-600"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }
                            >
                              {call.status}
                            </Badge>
                            {isListening && (
                              <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                                <Headphones className="mr-1 h-3 w-3" />
                                Listening
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-4 font-sans text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span>{call.phoneNumber}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>{call.duration}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isListening ? "default" : "outline"}
                          onClick={() => handleJoinAsListener(call)}
                          disabled={isConnecting || twilioVoice.error !== null}
                          className={isListening ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isListening ? (
                            <>
                              <PhoneMissed className="h-4 w-4" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Headphones className="h-4 w-4" />
                              Listen
                            </>
                          )}
                        </Button>

                        <Dialog
                          open={liveInstructionOpen === call.id}
                          onOpenChange={(open) => setLiveInstructionOpen(open ? call.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Send className="h-4 w-4" />
                              Instruct
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <CardHeader>
                              <CardTitle>Send Live Instructions to Agent</CardTitle>
                              <CardDescription>
                                Instructions will be sent to the agent immediately during the call
                              </CardDescription>
                            </CardHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Type instructions here..."
                                value={liveInstruction}
                                onChange={(e) => setLiveInstruction(e.target.value)}
                                rows={4}
                              />
                              <Button onClick={() => handleSendLiveInstruction(call.id)} className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                Send
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto bg-transparent">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEndCall(call)}>End Call</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {twilioVoice.isConnected && (
          <Card className="mt-4 border-blue-500 bg-blue-500/10">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-foreground">Currently Listening</p>
                  <p className="font-sans text-sm text-muted-foreground">Microphone muted (Listen-only mode)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    twilioVoice.disconnect()
                    setListeningToCallId(null)
                  }}
                >
                  <PhoneMissed className="h-4 w-4" />
                  Stop Listening
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {twilioVoice.error && (
          <Card className="mt-4 border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm text-destructive">{twilioVoice.error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
