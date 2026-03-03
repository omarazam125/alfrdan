import { NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET() {
  try {
    const hamsa = createHamsaClient()

    const [statsNumbers, jobsResponse] = await Promise.all([
      hamsa.getStatisticsNumbers(),
      hamsa.getJobs(undefined, { take: 1000, skip: 1 }),
    ])

    console.log("[v0] Statistics response:", JSON.stringify(statsNumbers.data, null, 2))

    const statsData = statsNumbers.data || {}
    const jobs = jobsResponse.data || []

    const totalCalls = Number.parseInt(statsData.requests?.value || "0")
    const totalDurationMinutes = statsData.media?.value || 0
    const totalCost = statsData.credits?.value || 0

    const activeCalls = Array.isArray(jobs)
      ? jobs.filter((job: any) => {
          const status = job.status?.toLowerCase()
          return status === "processing" || status === "pending"
        }).length
      : 0

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let reportsInLast7Days = 0
    try {
      const reports = JSON.parse(localStorage.getItem("reports") || "[]")
      reportsInLast7Days = reports.filter((report: any) => {
        const reportDate = new Date(report.createdAt || 0)
        return reportDate >= sevenDaysAgo
      }).length
    } catch (error) {
      console.error("[v0] Error reading reports from localStorage:", error)
    }

    const completedCalls = reportsInLast7Days

    const failedCalls = Array.isArray(jobs)
      ? jobs.filter((job: any) => {
          const status = job.status?.toLowerCase()
          return status === "failed" || status === "error"
        }).length
      : 0

    const averageDuration = totalCalls > 0 ? Math.round((totalDurationMinutes * 60) / totalCalls) : 0

    const callsInLast7Days = Array.isArray(jobs)
      ? jobs.filter((job: any) => {
          const jobDate = new Date(job.createdAt || 0)
          return jobDate >= sevenDaysAgo
        }).length
      : totalCalls

    const successRate = callsInLast7Days > 0 ? completedCalls / callsInLast7Days : 0

    const analytics = {
      totalCalls,
      activeCalls,
      completedCalls,
      failedCalls,
      totalDuration: Math.round(totalDurationMinutes * 60),
      averageDuration,
      successRate,
      totalCost,
    }

    console.log("[v0] Final mapped analytics:", analytics)
    console.log("[v0] Success rate calculation: ", completedCalls, "/", callsInLast7Days, "=", successRate)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[v0] Error fetching Hamsa analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 },
    )
  }
}
