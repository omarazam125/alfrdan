"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Download, Search, Volume2, SkipBack, SkipForward, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { getCustomerNameByJobId, getPhoneNumberByJobId } from "@/lib/call-memory"

interface Recording {
  id: string
  jobId: string
  recordingUrl?: string
  duration?: string
  createdAt: string
  customer?: {
    name?: string
    number?: string
  }
  phoneNumber?: {
    number?: string
  }
}

export default function RecordingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function fetchRecordings() {
      try {
        setLoading(true)
        const response = await fetch("/api/hamsa/recordings?limit=50")
        if (!response.ok) {
          throw new Error("Failed to fetch recordings")
        }
        const result = await response.json()
        const jobs = result.data || []

        const recordingsWithCustomerNames = jobs
          .map((job: any) => {
            const customerName = getCustomerNameByJobId(job.id)
            const phoneNumber = getPhoneNumberByJobId(job.id)

            // Only include recordings that have customer info in local storage
            if (!customerName) {
              return null
            }

            return {
              ...job,
              customer: {
                name: customerName,
                number: phoneNumber || job.customer?.number || "N/A",
              },
            }
          })
          .filter((recording) => recording !== null)

        console.log("[v0] Recordings with customer names from memory:", recordingsWithCustomerNames)
        setRecordings(recordingsWithCustomerNames)
        setError(null)
      } catch (err) {
        console.error("Error fetching recordings:", err)
        setError(err instanceof Error ? err.message : "Failed to load recordings")
      } finally {
        setLoading(false)
      }
    }

    fetchRecordings()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (!selectedRecording?.recordingUrl) return

    const audio = new Audio(selectedRecording.recordingUrl)
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(Math.floor(audio.duration))
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(Math.floor(audio.currentTime))
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      audio.remove()
    }
  }, [selectedRecording])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (durationStr?: string) => {
    if (!durationStr) return "00:00"
    return durationStr
  }

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

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
    }
  }

  const filteredRecordings = recordings.filter((recording) => {
    const customerName = recording.customer?.name || "Unknown"
    const phoneNumber = recording.customer?.number || recording.phoneNumber?.number || ""
    const searchLower = searchQuery.toLowerCase()

    return customerName.toLowerCase().includes(searchLower) || phoneNumber.includes(searchQuery)
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <DashboardHeader />

        <div className="mx-auto max-w-7xl mt-6 space-y-6">
          <div className="mb-6">
            <h1 className="font-sans text-3xl font-bold text-foreground mb-2">Call Recordings</h1>
            <p className="font-sans text-muted-foreground">Listen to and analyze call recordings</p>
          </div>

          {loading ? (
            <Card className="bg-card">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-card border-destructive">
              <CardContent className="py-8 text-center">
                <p className="text-destructive font-sans">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {selectedRecording && (
                <Card className="mb-6 bg-card">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-sans text-xl font-semibold text-foreground">
                            {selectedRecording.customer?.name || "Unknown Customer"}
                          </h3>
                          <p className="font-mono text-sm text-muted-foreground">
                            {selectedRecording.customer?.number ||
                              selectedRecording.phoneNumber?.number ||
                              "No phone number"}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                          COMPLETED
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={[currentTime]}
                          max={duration || 100}
                          step={1}
                          onValueChange={handleSeek}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" onClick={handleSkipBack}>
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button size="icon" className="h-12 w-12" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                          </Button>
                          <Button size="icon" variant="outline" onClick={handleSkipForward}>
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <Slider
                            value={[volume]}
                            max={100}
                            step={1}
                            onValueChange={(value) => setVolume(value[0])}
                            className="w-24"
                          />
                          <span className="font-mono text-xs text-muted-foreground w-8">{volume}%</span>
                        </div>

                        <Button
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={() => {
                            if (selectedRecording.recordingUrl) {
                              window.open(selectedRecording.recordingUrl, "_blank")
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[300px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search recordings..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 font-sans"
                        />
                      </div>
                    </div>
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
                    All Recordings ({filteredRecordings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredRecordings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-sans text-muted-foreground">No recordings found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRecordings.map((recording) => (
                        <Card
                          key={recording.id}
                          className={`border-border bg-secondary/30 cursor-pointer transition-colors hover:bg-secondary/50 ${
                            selectedRecording?.id === recording.id ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedRecording(recording)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-10 w-10 bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (selectedRecording?.id === recording.id) {
                                      setIsPlaying(!isPlaying)
                                    } else {
                                      setSelectedRecording(recording)
                                      setIsPlaying(true)
                                    }
                                  }}
                                  disabled={!recording.recordingUrl}
                                >
                                  {selectedRecording?.id === recording.id && isPlaying ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <div className="flex-1">
                                  <h3 className="font-sans text-base font-semibold text-foreground">
                                    {recording.customer?.name || "Unknown Customer"}
                                  </h3>
                                  <p className="font-mono text-sm text-muted-foreground">
                                    {recording.customer?.number || recording.phoneNumber?.number || "No phone number"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-sans text-sm text-foreground">{formatDate(recording.createdAt)}</p>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {formatDuration(recording.duration)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                                  COMPLETED
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (recording.recordingUrl) {
                                      window.open(recording.recordingUrl, "_blank")
                                    }
                                  }}
                                  disabled={!recording.recordingUrl}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
