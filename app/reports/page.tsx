"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, FileText, Clock, Phone, TrendingUp, Trash2 } from "lucide-react"


interface CallReport {
  id: string
  callId: string
  customerName: string
  phoneNumber: string
  customerEmail: string
  duration: number
  status: string
  createdAt: string
  language: string
  generatedAt: string
  analysis?: {
    overallScore?: number
    customerOverallScore?: number
    customerMood?: string
    overallScores?: {
      customerSatisfaction?: number
      serviceQuality?: number
      agentPerformance?: number
      customerCooperation?: number
      callSuccess?: number
    }
    satisfactionMetrics?: {
      overallSatisfaction?: number
    }
    customerCooperation?: { score: number; description: string }
    engagement?: { score: number; description: string }
  }
}

// Helper function to extract score from various possible locations
const getOverallScore = (analysis: CallReport["analysis"]): number | undefined => {
  if (!analysis) return undefined
  return analysis.overallScore 
    || analysis.customerOverallScore
    || analysis.overallScores?.customerSatisfaction
    || analysis.overallScores?.callSuccess
    || analysis.satisfactionMetrics?.overallSatisfaction
}

export default function ReportsPage() {
  const [reports, setReports] = useState<CallReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      // Load from localStorage only
      const storedReports = localStorage.getItem("call-reports")
      if (storedReports) {
        const localReports = JSON.parse(storedReports)
        setReports(localReports)
      }
    } catch (error) {
      console.error("[v0] Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const parseDuration = (duration: any): number => {
    if (typeof duration === "number") return duration
    if (typeof duration === "string") {
      const parts = duration.split(":")
      if (parts.length === 2) {
        return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
      }
    }
    return 0
  }

  const handleDeleteReport = (reportId: string) => {
    const updatedReports = reports.filter((r) => r.id !== reportId)
    localStorage.setItem("call-reports", JSON.stringify(updatedReports))
    setReports(updatedReports)
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.phoneNumber?.includes(searchQuery) ||
      report.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ended":
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "in-progress":
        return "bg-blue-500/10 text-blue-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Call Reports - Al-Furdan</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive analytics and AI-powered insights for all customer service calls
              </p>
            </div>
            <Button onClick={loadReports} variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, phone number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Make calls from the Calls page to see reports here"}
              </p>
              <Link href="/calls">
                <Button>Go to Calls</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <Link href={`/reports/${report.id}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{report.customerName || "Unknown"}</h3>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === "ended"
                              ? "Completed"
                              : report.status === "completed"
                                ? "Completed"
                                : report.status === "in-progress"
                                  ? "In Progress"
                                  : "Failed"}
                          </Badge>
                          {report.language && (
                            <Badge variant="outline">{report.language === "ar" ? "Arabic" : "English"}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {report.phoneNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(report.duration)}
                          </span>
                          <span>{new Date(report.createdAt).toLocaleString("en-US")}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-4">
                      {getOverallScore(report.analysis) && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{getOverallScore(report.analysis)}/10</div>
                          <div className="text-xs text-muted-foreground">Overall Score</div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteReport(report.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
