import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const hamsa = createHamsaClient()

    const response = await hamsa.getJobs(undefined, {
      take: limit,
      skip: 1,
      status: "COMPLETED",
      sort: {
        field: "createdAt",
        direction: "desc",
      },
    })

    console.log("[v0] Transcripts response:", response)

    const jobs = response.data?.jobs || []

    const transcripts = jobs.map((job: any) => {
      // Parse duration from seconds to MM:SS format
      const durationInSeconds = job.callDuration || 0
      const minutes = Math.floor(durationInSeconds / 60)
      const seconds = durationInSeconds % 60
      const formattedDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

      return {
        id: job.id,
        jobId: job.id,
        transcript: job.toScript || job.fromScript || job.transcript || "",
        language: job.agentDetails?.lang || "ar",
        createdAt: job.createdAt,
        duration: formattedDuration,
        agentDetails: {
          params: {
            customerName: "Unknown", // Will be replaced on client side with local storage data
            phoneNumber: "N/A",
          },
        },
      }
    })

    console.log("[v0] Found transcripts:", transcripts.length)

    return NextResponse.json({
      success: true,
      data: transcripts || [],
      total: transcripts?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching Hamsa transcripts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transcripts" },
      { status: 500 },
    )
  }
}
