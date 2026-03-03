import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const event = {
      statusCallbackEvent: formData.get("StatusCallbackEvent"),
      conferenceSid: formData.get("ConferenceSid"),
      friendlyName: formData.get("FriendlyName"),
      callSid: formData.get("CallSid"),
      timestamp: formData.get("Timestamp"),
    }

    console.log("[v0] Conference event:", event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing conference event:", error)
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 })
  }
}
