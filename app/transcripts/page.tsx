"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getCustomerNameByJobId, getPhoneNumberByJobId } from "@/lib/call-memory"

interface Transcript {
  id: string
  jobId: string
  transcript: string
  language: string
  createdAt: string
  duration?: string
  agentDetails?: {
    params?: {
      customerName?: string
      phoneNumber?: string
    }
  }
}

export default function TranscriptsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTranscripts() {
      try {
        setLoading(true)
        const response = await fetch("/api/hamsa/transcripts?limit=50")
        if (!response.ok) {
          throw new Error("Failed to fetch transcripts")
        }
        const result = await response.json()
        const jobs = result.data || []

        const transcriptsWithCustomerNames = jobs
          .map((job: any) => {
            const customerName = getCustomerNameByJobId(job.id)
            const phoneNumber = getPhoneNumberByJobId(job.id)

            // Only include transcripts that have customer info in local storage
            if (!customerName) {
              return null
            }

            return {
              ...job,
              agentDetails: {
                params: {
                  customerName: customerName,
                  phoneNumber: phoneNumber || job.agentDetails?.params?.phoneNumber || "N/A",
                },
              },
            }
          })
          .filter((transcript) => transcript !== null)

        console.log("[v0] Transcripts with customer names from memory:", transcriptsWithCustomerNames)
        setTranscripts(transcriptsWithCustomerNames)
        setError(null)
      } catch (err) {
        console.error("Error fetching transcripts:", err)
        setError(err instanceof Error ? err.message : "Failed to load transcripts")
      } finally {
        setLoading(false)
      }
    }

    fetchTranscripts()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (durationStr?: string) => {
    if (!durationStr) return "00:00"
    return durationStr
  }

  const filteredTranscripts = transcripts.filter((transcript) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      transcript.agentDetails?.params?.customerName?.toLowerCase().includes(searchLower) ||
      transcript.agentDetails?.params?.phoneNumber?.toLowerCase().includes(searchLower) ||
      transcript.id.toLowerCase().includes(searchLower) ||
      transcript.transcript.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-foreground">Call Transcripts</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">Review detailed transcripts of all calls</p>
        </div>

        {selectedTranscript && (
          <Card className="mb-6 border-primary/50 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                    {selectedTranscript.agentDetails?.params?.customerName || "Unknown Customer"}
                  </CardTitle>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    {selectedTranscript.agentDetails?.params?.phoneNumber || "No phone number"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                    {selectedTranscript.language === "ar" ? "ARABIC" : "ENGLISH"}
                  </Badge>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selectedTranscript.transcript ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedTranscript.transcript}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-sans text-muted-foreground">No transcript available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transcripts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-sans"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px] font-sans">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px] font-sans">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
              All Transcripts ({filteredTranscripts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 font-sans text-muted-foreground">Loading transcripts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="font-sans text-destructive">{error}</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : filteredTranscripts.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-sans text-muted-foreground">No transcripts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTranscripts.map((transcript) => (
                  <Card
                    key={transcript.id}
                    className={`border-border bg-secondary/30 cursor-pointer transition-colors hover:bg-secondary/50 ${
                      selectedTranscript?.id === transcript.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedTranscript(transcript)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-sans text-base font-semibold text-foreground">
                                {transcript.agentDetails?.params?.customerName || "Unknown Customer"}
                              </h3>
                              <p className="font-mono text-sm text-muted-foreground">
                                {transcript.agentDetails?.params?.phoneNumber || "No phone number"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4">
                            <div>
                              <p className="font-sans text-xs text-muted-foreground">Date & Time</p>
                              <p className="font-sans text-sm text-foreground">{formatDate(transcript.createdAt)}</p>
                            </div>
                            <div>
                              <p className="font-sans text-xs text-muted-foreground">Duration</p>
                              <p className="font-mono text-sm text-foreground">{formatDuration(transcript.duration)}</p>
                            </div>
                            <div>
                              <p className="font-sans text-xs text-muted-foreground">Language</p>
                              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                {transcript.language === "ar" ? "Arabic" : "English"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
