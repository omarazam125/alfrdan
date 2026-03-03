import { NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function GET() {
  try {
    const hamsa = createHamsaClient()
    const status = await hamsa.checkStatus()

    if (status.connected) {
      return NextResponse.json({
        connected: true,
        message: "Connected to Shaffra AI Cloud",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          connected: false,
          message: status.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
