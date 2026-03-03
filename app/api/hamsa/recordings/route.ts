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

    const jobs = response.data?.jobs || []

    const recordings = jobs
      .filter((job: any) => job.url)
      .map((job: any) => {
        // Parse duration from seconds to MM:SS format
        const durationInSeconds = job.callDuration || 0
        const minutes = Math.floor(durationInSeconds / 60)
        const seconds = durationInSeconds % 60
        const formattedDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

        return {
          id: job.id,
          jobId: job.id,
          recordingUrl: job.url,
          mediaUrl: job.url,
          duration: formattedDuration,
          createdAt: job.createdAt,
          customer: {
            name: "Unknown", // Will be replaced on client side with local storage data
            number: "N/A",
          },
          cost: job.cost || 0,
        }
      })

    return NextResponse.json({
      success: true,
      data: recordings,
      total: recordings.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching Hamsa recordings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recordings" },
      { status: 500 },
    )
  }
}
