import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const body = await request.json()
    const callSid = body.callSid

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    console.log("[v0] Ending Hamsa call:", jobId, "with Twilio SID:", callSid)

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    const twilio = (await import("twilio")).default
    const client = twilio(accountSid, authToken)

    const call = await client.calls(callSid).update({
      status: "completed",
    })

    console.log("[v0] Twilio call ended successfully:", call.sid)

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
      callSid: call.sid,
      status: call.status,
    })
  } catch (error) {
    console.error("[v0] Error ending call:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to end call" }, { status: 500 })
  }
}
