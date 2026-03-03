import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const hamsa = createHamsaClient()

    const response = await hamsa.getJobDetails(jobId)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching Hamsa job details:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch job details" },
      { status: 500 },
    )
  }
}
