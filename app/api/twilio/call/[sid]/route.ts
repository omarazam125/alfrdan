import { type NextRequest, NextResponse } from "next/server"

// Get call details
export async function GET(request: NextRequest, { params }: { params: { sid: string } }) {
  try {
    const callSid = params.sid

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    const twilio = (await import("twilio")).default
    const client = twilio(accountSid, authToken)
    const call = await client.calls(callSid).fetch()

    return NextResponse.json({
      success: true,
      call: {
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching call details:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch call details" },
      { status: 500 },
    )
  }
}

// End call
export async function DELETE(request: NextRequest, { params }: { params: { sid: string } }) {
  try {
    const callSid = params.sid

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
