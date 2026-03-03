import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const identity = searchParams.get("identity") || `admin_${Date.now()}`

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      return NextResponse.json(
        {
          error: "Missing Twilio configuration",
          details: {
            accountSid: !!accountSid,
            apiKey: !!apiKey,
            apiSecret: !!apiSecret,
            twimlAppSid: !!twimlAppSid,
          },
        },
        { status: 500 },
      )
    }

    const twilio = (await import("twilio")).default
    const AccessToken = twilio.jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600,
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    token.addGrant(voiceGrant)

    return NextResponse.json({
      token: token.toJwt(),
      identity,
    })
  } catch (error) {
    console.error("[v0] Error generating Twilio token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate token" },
      { status: 500 },
    )
  }
}
