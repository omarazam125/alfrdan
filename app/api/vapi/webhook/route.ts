import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    console.log("[v0] Webhook received message type:", message?.type)

    if (message?.type === "status-update") {
      const call = message?.call
      const status = call?.status

      console.log("[v0] Call status update:", {
        callId: call?.id,
        status: status,
        phoneCallProvider: call?.phoneCallProvider,
        phoneCallProviderId: call?.phoneCallProviderId,
      })

      // Log important status changes for monitoring
      if (status === "ringing") {
        console.log("[v0] Call is ringing - phone is ringing on recipient's end")
      } else if (status === "in-progress") {
        console.log("[v0] Call answered - conversation in progress")
      } else if (status === "forwarded-to-voicemail") {
        console.log("[v0] Call forwarded to voicemail")
      }

      return NextResponse.json({ success: true, message: "Status update logged" })
    }

    if (message?.type !== "end-of-call-report") {
      console.log("[v0] Ignoring message (not end-of-call-report):", message?.type)
      return NextResponse.json({ success: true, message: "Message ignored" })
    }

    const call = message?.call
    console.log("[v0] Processing end-of-call-report for call:", call?.id)

    try {
      const n8nWebhookUrl =
        process.env.WEBHOOK_URL || "https://omar545454.app.n8n.cloud/webhook/ee4cfe15-bab4-4e8d-973a-2e2d0c9f5b42"

      // Extract customer data from metadata
      const customerEmail = call?.metadata?.customerEmail || ""
      const phoneNumber = call?.customer?.number || call?.phoneNumber?.number || ""

      // Get transcript from call messages
      let transcript = ""
      if (call?.messages && Array.isArray(call.messages)) {
        transcript = call.messages.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
      } else if (call?.transcript) {
        transcript = call.transcript
      }

      const webhookPayload = {
        email: customerEmail,
        phoneNumber: phoneNumber,
        transcript: transcript,
        callId: call?.id || "",
        customerName: call?.customer?.name || "",
        duration: call?.duration || 0,
        status: call?.status || "",
        endedAt: call?.endedAt || new Date().toISOString(),
        recordingUrl: call?.recordingUrl || "",
        analysis: call?.analysis || null,
      }

      console.log("[v0] Forwarding end-of-call data to n8n webhook")

      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      })

      if (webhookResponse.ok) {
        console.log("[v0] Successfully forwarded to n8n webhook")
      } else {
        console.error("[v0] Failed to forward to n8n webhook. Status:", webhookResponse.status)
      }
    } catch (webhookError) {
      console.error("[v0] Error forwarding to n8n webhook:", webhookError)
    }

    return NextResponse.json({ success: true, message: "End-of-call processed" })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
