import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET(request: NextRequest) {
  try {
    const hamsa = createHamsaClient()

    const response = await hamsa.getJobs(undefined, {
      take: 100,
      skip: 1,
      sort: {
        field: "createdAt",
        direction: "desc",
      },
    })

    console.log("[v0] Hamsa API response:", JSON.stringify(response, null, 2))

    const jobs = response.data?.jobs || []

    const liveCalls = jobs.filter((job: any) => {
      const status = (job.status || "").toUpperCase()
      return status === "PENDING" || status === "IN_PROGRESS" || status === "IN-PROGRESS" || status === "RUNNING"
    })

    console.log("[v0] Found live calls:", liveCalls.length, "out of", jobs.length, "total jobs")

    const formattedCalls = liveCalls.map((job: any) => {
      // Extract customer name and phone from title (format: "Name | Phone")
      const titleParts = job.title?.split("|") || []
      const customerName = titleParts[0]?.trim() || "Unknown Customer"
      let phoneNumber = titleParts[1]?.trim() || "N/A"

      // Fallback to job attributes if title parsing failed
      if (phoneNumber === "N/A" || phoneNumber.includes("/")) {
        phoneNumber = job.attributes?.actual_phone_number || job.attributes?.phone_number || phoneNumber
      }

      return {
        id: job.id,
        jobId: job.id,
        customerName,
        phoneNumber,
        status: job.status,
        createdAt: job.createdAt || job.created_at || new Date().toISOString(),
        duration: job.callDuration || 0,
        variables: job.attributes || {},
      }
    })

    return NextResponse.json({
      success: true,
      liveCalls: formattedCalls,
      count: formattedCalls.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching live calls:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch live calls" },
      { status: 500 },
    )
  }
}
