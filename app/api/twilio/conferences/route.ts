import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "in-progress"

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    const twilio = (await import("twilio")).default
    const client = twilio(accountSid, authToken)

    const conferences = await client.conferences.list({
      status: status as any,
      limit: 50,
    })

    return NextResponse.json({
      conferences: conferences.map((conf) => ({
        sid: conf.sid,
        friendlyName: conf.friendlyName,
        status: conf.status,
        dateCreated: conf.dateCreated,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching conferences:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch conferences" },
      { status: 500 },
    )
  }
}
