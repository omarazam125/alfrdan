import { NextResponse } from "next/server"

export async function GET() {
  try {
    // This endpoint is deprecated - using Hamsa API instead
    // Twilio is only used indirectly through Hamsa
    return NextResponse.json({
      success: true,
      calls: [],
      total: 0,
      message: "Using Hamsa API for call management. Check /api/hamsa/live-calls instead.",
    })
  } catch (error) {
    console.error("[v0] Error in Twilio endpoint:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Endpoint deprecated" }, { status: 500 })
  }
}
