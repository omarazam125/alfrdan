import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, sessionId, language } = body

    // Generate or use existing session ID
    const currentSessionId = sessionId || nanoid()

    // Get the user's message
    const userMessage = messages[messages.length - 1].content

    console.log("[v0] Sending message to n8n agent:", {
      message: userMessage,
      sessionId: currentSessionId,
      language: language,
    })

    // Call n8n webhook
    const response = await fetch(
      "https://n8n.srv1022179.hstgr.cloud/webhook/852036a0-5587-4f22-b4df-c116abd6a7b4/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          language: language || "ar",
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] n8n webhook error:", errorText)
      return NextResponse.json({ error: `n8n webhook error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] n8n agent response:", data)

    // Extract questions from response
    const generatedText = data.output || data.response || data.message || ""

    const questionMarkPattern = language === "en" ? "?" : "؟"
    const lines = generatedText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.endsWith(questionMarkPattern))
      // Remove numbers, bullets, or any prefix
      .map((line: string) => line.replace(/^[\d\-*•]+[.)]\s*/, ""))
      .slice(0, 5) // Ensure only 5 questions

    const questions = lines.join("\n")

    console.log("[v0] Filtered questions:", { questions, count: lines.length, language })

    return NextResponse.json({
      questions,
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("[v0] Error generating questions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate questions" },
      { status: 500 },
    )
  }
}
