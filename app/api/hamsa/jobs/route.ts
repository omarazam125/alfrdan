import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const hamsa = createHamsaClient()

    const filter: any = {
      take: limit,
      skip: 1,
      sort: {
        field: "createdAt",
        direction: "desc",
      },
    }

    if (status) {
      filter.status = status
    }

    if (search) {
      filter.search = search
    }

    const response = await hamsa.getJobs(undefined, filter)

    const jobs = response.data?.jobs || []
    const mappedJobs = jobs.map((job: any) => {
      const titleParts = job.title?.split("|") || []
      const customerName = titleParts[0]?.trim() || "Unknown"
      let phoneNumber = titleParts[1]?.trim() || "N/A"

      // Try to get phone number from job parameters if title parsing failed
      if (phoneNumber === "N/A" || phoneNumber.includes("/")) {
        phoneNumber = job.attributes?.actual_phone_number || job.attributes?.phone_number || phoneNumber
      }

      return {
        id: job.id,
        type: "outboundPhoneCall",
        status: job.status?.toLowerCase() || "completed",
        customer: {
          number: phoneNumber,
          name: customerName,
        },
        phoneNumber: {
          number: phoneNumber,
        },
        // Convert callDuration (seconds) to proper format
        duration: job.callDuration || 0,
        endedAt: job.updatedAt,
        startedAt: job.createdAt,
        createdAt: job.createdAt,
        cost: job.cost || 0,
        // Add recording URL from job.url
        recordingUrl: job.url || null,
        // Keep original Hamsa data for reference
        hamsaData: {
          title: job.title,
          agentName: job.attributes?.agentName,
          voice: job.attributes?.voice,
          callDuration: job.callDuration,
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        jobs: mappedJobs,
        total: mappedJobs.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching Hamsa jobs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch jobs" },
      { status: 500 },
    )
  }
}
