"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Phone,
  Clock,
  Calendar,
  User,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Heart,
  Shield,
  Activity,
  Target,
  MessageSquare,
  Award,
  ThumbsUp,
  BarChart3,
} from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

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
  transcript: string
  recordingUrl: string
  generatedAt: string
  analysis?: any
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<CallReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [params.id])

  const loadReport = async () => {
    try {
      const storedReports = localStorage.getItem("call-reports")
      if (storedReports) {
        const reports = JSON.parse(storedReports)
        const foundReport = reports.find((r: CallReport) => r.id === params.id)
        setReport(foundReport || null)
      }
    } catch (error) {
      console.error("Error loading report:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-[#059669]"
    if (score >= 6) return "text-[#d97706]"
    return "text-[#dc2626]"
  }

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-[#059669]/10 border-[#059669]/30"
    if (score >= 6) return "bg-[#d97706]/10 border-[#d97706]/30"
    return "bg-[#dc2626]/10 border-[#dc2626]/30"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent"
    if (score >= 8) return "Very Good"
    if (score >= 6) return "Good"
    if (score >= 4) return "Fair"
    return "Poor"
  }

  const getMoodColor = (mood: string) => {
    const m = mood?.toLowerCase() || ""
    if (m.includes("happy") || m.includes("satisfied")) return "text-[#059669]"
    if (m.includes("neutral")) return "text-[#d97706]"
    return "text-[#dc2626]"
  }

  const getMoodLabel = (mood: string) => {
    const m = mood?.toLowerCase() || ""
    if (m.includes("happy")) return "Happy"
    if (m.includes("satisfied")) return "Satisfied"
    if (m.includes("neutral")) return "Neutral"
    if (m.includes("frustrated")) return "Frustrated"
    if (m.includes("angry")) return "Angry"
    return mood || "Unknown"
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || ""
    if (s.includes("excellent")) return { variant: "default" as const, className: "bg-[#059669] text-white hover:bg-[#059669]" }
    if (s.includes("good")) return { variant: "default" as const, className: "bg-[#0891b2] text-white hover:bg-[#0891b2]" }
    if (s.includes("needs") || s.includes("fair")) return { variant: "default" as const, className: "bg-[#d97706] text-white hover:bg-[#d97706]" }
    if (s.includes("poor")) return { variant: "destructive" as const, className: "" }
    return { variant: "secondary" as const, className: "" }
  }

  // Derived data for charts
  const analysis = report?.analysis
  const overallScore = analysis?.overallScores?.patientSatisfaction ?? analysis?.customerOverallScore ?? 0
  const cooperationScore = analysis?.patientCooperation?.score ?? analysis?.customerBehavior?.score ?? 0
  const agentScore = analysis?.overallScores?.agentPerformance ?? 0
  const serviceScore = analysis?.overallScores?.serviceQuality ?? 0
  const callSuccessScore = analysis?.overallScores?.callSuccess ?? 0

  const satisfactionMetrics = analysis?.satisfactionMetrics
  const radarData = useMemo(() => {
    if (satisfactionMetrics) {
      return [
        { subject: "Satisfaction", value: satisfactionMetrics.overallSatisfaction ?? 5, fullMark: 10 },
        { subject: "Empathy", value: satisfactionMetrics.empathy ?? 5, fullMark: 10 },
        { subject: "Communication", value: satisfactionMetrics.communication ?? 5, fullMark: 10 },
        { subject: "Speed", value: satisfactionMetrics.serviceSpeed ?? 5, fullMark: 10 },
        { subject: "Resolution", value: satisfactionMetrics.problemResolution ?? 5, fullMark: 10 },
        { subject: "Professionalism", value: satisfactionMetrics.professionalism ?? 5, fullMark: 10 },
      ]
    }
    return [
      { subject: "Satisfaction", value: overallScore, fullMark: 10 },
      { subject: "Cooperation", value: cooperationScore, fullMark: 10 },
      { subject: "Communication", value: 5, fullMark: 10 },
      { subject: "Speed", value: 5, fullMark: 10 },
      { subject: "Resolution", value: 5, fullMark: 10 },
      { subject: "Professionalism", value: 5, fullMark: 10 },
    ]
  }, [satisfactionMetrics, overallScore, cooperationScore])

  const satisfactionPct = overallScore * 10
  const donutData = [
    { name: "Satisfied", value: satisfactionPct },
    { name: "Remaining", value: 100 - satisfactionPct },
  ]
  const DONUT_COLORS = ["#b8860b", "#e2e8f0"]

  const assessmentQuestions = analysis?.detailedAssessmentQuestions ?? analysis?.customerAssessmentQuestions ?? []
  const barChartData = useMemo(() => {
    return assessmentQuestions.slice(0, 8).map((q: any, i: number) => ({
      name: q.question?.substring(0, 25) + (q.question?.length > 25 ? "..." : ""),
      score:
        q.status?.toLowerCase().includes("excellent") ? 10 :
        q.status?.toLowerCase().includes("good") ? 7 :
        q.status?.toLowerCase().includes("needs") || q.status?.toLowerCase().includes("fair") ? 5 : 3,
    }))
  }, [assessmentQuestions])

  const patientName = analysis?.patientName ?? analysis?.customerName ?? report?.customerName ?? "Unknown"
  const patientMood = analysis?.patientMood ?? analysis?.customerMood ?? "neutral"
  const keyPoints = analysis?.keyDiscussionPoints ?? []
  const recommendations = analysis?.recommendations ?? analysis?.customerRecommendations ?? []
  const summary = analysis?.comprehensiveSummary ?? analysis?.customerBehavior?.description ?? ""
  const behaviorAnalysis = analysis?.patientBehaviorAnalysis ?? []

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Report Not Found</h3>
            <p className="text-muted-foreground mb-4">This report may have been deleted.</p>
            <Button onClick={() => router.push("/logs")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Call Records
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <Button onClick={() => router.push("/logs")} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Call Records
            </Button>
            <Badge variant="outline" className="text-xs">Al-Furdan Report</Badge>
          </div>

          {/* Report Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1 text-foreground">Al-Furdan Call Analysis Report</h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analysis of customer interaction and service quality
                </p>
              </div>
              {analysis && (
                <div className={`text-center rounded-xl border-2 p-4 ${getScoreBg(overallScore)}`}>
                  <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}/10
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Customer Satisfaction</div>
                  <Badge className={`mt-1 text-xs ${getScoreColor(overallScore) === "text-[#059669]" ? "bg-[#059669]/20 text-[#059669]" : getScoreColor(overallScore) === "text-[#d97706]" ? "bg-[#d97706]/20 text-[#d97706]" : "bg-[#dc2626]/20 text-[#dc2626]"}`} variant="secondary">
                    {getScoreLabel(overallScore)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><User className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-semibold text-sm">{patientName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><Phone className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="font-semibold text-sm">{report.phoneNumber}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><Clock className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-semibold text-sm">{formatDuration(report.duration)} min</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="font-semibold text-sm">{new Date(report.createdAt).toLocaleDateString("en-US")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><Heart className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Customer Mood</div>
                  <div className={`font-semibold text-sm ${getMoodColor(patientMood)}`}>{getMoodLabel(patientMood)}</div>
                </div>
              </div>
            </div>
          </Card>

          {analysis ? (
            <>
              {/* Score Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`p-5 border-2 ${getScoreBg(overallScore)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">Customer Satisfaction</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}/10</span>
                  </div>
                  <Progress value={overallScore * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{getScoreLabel(overallScore)} - Overall satisfaction with service</p>
                </Card>

                <Card className={`p-5 border-2 ${getScoreBg(cooperationScore)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">Customer Cooperation</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(cooperationScore)}`}>{cooperationScore}/10</span>
                  </div>
                  <Progress value={cooperationScore * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{getScoreLabel(cooperationScore)} - Cooperation and engagement level</p>
                </Card>

                <Card className={`p-5 border-2 ${getScoreBg(agentScore || serviceScore || callSuccessScore)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">Service Quality</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(agentScore || serviceScore || callSuccessScore)}`}>{agentScore || serviceScore || callSuccessScore}/10</span>
                  </div>
                  <Progress value={(agentScore || serviceScore || callSuccessScore) * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{getScoreLabel(agentScore || serviceScore || callSuccessScore)} - Agent performance and service delivery</p>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Multi-Axis Analysis</h2>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#dce3eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#5a6a7e" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="#b8860b"
                          fill="#b8860b"
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Donut Chart */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Customer Satisfaction Index</h2>
                  </div>
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {donutData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                          ))}
                        </Pie>
                        <text x="50%" y="47%" textAnchor="middle" className="text-3xl font-bold fill-foreground">
                          {satisfactionPct}%
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" className="text-xs fill-muted-foreground">
                          Satisfaction Rate
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Horizontal Bar Chart */}
              {barChartData.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Assessment Criteria Scores</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#dce3eb" />
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#b8860b" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Summary */}
              {summary && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Comprehensive Call Summary</h2>
                  </div>
                  <p className="text-foreground leading-relaxed">{summary}</p>
                </Card>
              )}

              {/* Customer Behavior Analysis */}
              {behaviorAnalysis.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Customer Behavior Analysis</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {behaviorAnalysis.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Key Discussion Points */}
              {keyPoints.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Key Discussion Points</h2>
                  </div>
                  <div className="space-y-2">
                    {keyPoints.map((point: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <CheckCircle2 className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Detailed Assessment Questions */}
              {assessmentQuestions.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">
                      Detailed Assessment ({assessmentQuestions.length} Criteria)
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {assessmentQuestions.map((q: any, index: number) => {
                      const badgeStyle = getStatusBadge(q.status || "Good")
                      return (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-0.5">
                                {q.status?.toLowerCase().includes("excellent") ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                                ) : q.status?.toLowerCase().includes("poor") ? (
                                  <XCircle className="w-5 h-5 text-[#dc2626]" />
                                ) : q.status?.toLowerCase().includes("good") ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#0891b2]" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-[#d97706]" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1">
                                  {index + 1}. {q.question}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{q.answer}</p>
                                {q.details && (
                                  <p className="text-xs text-muted-foreground/70 mt-1 italic">{q.details}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={badgeStyle.variant} className={badgeStyle.className}>
                              {q.status || "Good"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Service Quality Metrics */}
              {analysis?.serviceQuality && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Service Quality Checklist</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Customer Query Fully Addressed", value: analysis.serviceQuality.queryFullyAddressed },
                      { label: "Service Guidance Provided", value: analysis.serviceQuality.serviceGuidanceProvided || analysis.serviceQuality.medicalGuidanceProvided ? "Yes" : "No" },
                      { label: "Next Steps Communicated", value: analysis.serviceQuality.nextStepsClear ? "Yes" : "No" },
                      { label: "Follow-up Arranged", value: analysis.serviceQuality.followUpArranged ? "Yes" : "No" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm font-medium">{item.label}</span>
                        <Badge variant={item.value === "Yes" || item.value === true ? "default" : item.value === "Partial" ? "secondary" : "destructive"}>
                          {String(item.value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Actionable Recommendations</h2>
                  </div>
                  <div className="space-y-2">
                    {recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                        </div>
                        <span className="text-sm leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>AI analysis has not been generated for this report yet.</p>
              </div>
            </Card>
          )}

          {/* Transcript */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conversation Transcript
            </h2>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {report.transcript || "No transcript available"}
              </pre>
            </div>
          </Card>

          {/* Recording */}
          {report.recordingUrl && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Call Recording</h2>
              <audio controls className="w-full">
                <source src={report.recordingUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
