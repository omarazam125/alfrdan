import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { sid: string } }) {
  try {
    const body = await request.json()
    const { muted = true } = body

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    const twilio = (await import("twilio")).default
    const client = twilio(accountSid, authToken)

    const participants = await client.conferences(params.sid).participants.list()

    return NextResponse.json({
      participants: participants.map((p) => ({
        callSid: p.callSid,
        muted: p.muted,
        hold: p.hold,
        status: p.status,
      })),
    })
  } catch (error) {
    console.error("[v0] Error managing participants:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage participants" },
      { status: 500 },
    )
  }
}
