import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const conferenceName = formData.get("conferenceName") || formData.get("To")

    console.log("[v0] TwiML voice webhook called")
    console.log("[v0] Conference name:", conferenceName)

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference
      beep="false"
      statusCallback="${process.env.NEXT_PUBLIC_BASE_URL || "https://your-app.vercel.app"}/api/twilio/conference-events"
      statusCallbackEvent="start end join leave mute hold speaker"
    >${conferenceName}</Conference>
  </Dial>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("[v0] Error in TwiML voice webhook:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred</Say>
</Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  }
}
