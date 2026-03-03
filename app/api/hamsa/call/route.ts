import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Raw form data received:", JSON.stringify(body, null, 2))

    const formVars = body.variables || body
    const scenarioId = body.scenarioId || "after-sales-followup"
    const selectedLanguage = body.language || "ar"

    const customerName = formVars.customer_name?.trim() || formVars.customerName?.trim() || "عميل محتمل"
    const phoneNumber = formVars.phoneNumber?.trim() || formVars.phone_number?.trim() || ""
    const serviceDate = formVars.service_date?.trim() || formVars.serviceDate?.trim() || ""
    const questions = formVars.questions?.trim() || ""
    const notes = formVars.note?.trim() || formVars.notes?.trim() || ""

    // Build variables for Hamsa based on scenario
    const variables: Record<string, string> = {
      customer_name: customerName,
      phone_number: phoneNumber,
      service_date: serviceDate,
      questions: questions,
      note: notes,
    }

    console.log("[v0] Mapped variables:", JSON.stringify(variables, null, 2))

    if (!phoneNumber) {
      console.log("[v0] Missing required field - phoneNumber:", phoneNumber)
      return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 })
    }

    const hamsa = createHamsaClient()

    let voiceAgentId: string
    let fromPhoneNumber: string

    if (selectedLanguage === "en") {
      // English agent configuration
      voiceAgentId = "a0211628-9490-4b78-837f-d27e6e77f7f3"
      fromPhoneNumber = process.env.HAMSA_PHONE_NUMBER || ""
      console.log("[v0] Using English agent:", voiceAgentId, "with number:", fromPhoneNumber)
    } else {
      // Arabic agent configuration (default)
      voiceAgentId = process.env.HAMSA_VOICE_AGENT_ID || "ac90bc4a-7e12-43c0-8009-9d462d15896c"
      fromPhoneNumber = process.env.HAMSA_PHONE_NUMBER || ""
      console.log("[v0] Using Arabic agent:", voiceAgentId, "with number:", fromPhoneNumber)
    }

    if (!voiceAgentId) {
      return NextResponse.json(
        { error: "HAMSA_VOICE_AGENT_ID environment variable is not configured" },
        { status: 500 },
      )
    }

    const callTitle = `${customerName}|${phoneNumber}`

    const callParams = {
      toNumber: phoneNumber,
      fromNumber: fromPhoneNumber,
      voiceAgentId: voiceAgentId,
      params: {
        ...variables,
        actual_phone_number: phoneNumber,
      },
      title: callTitle,
    }

    console.log("[v0] Creating Hamsa call with Voice Agent ID:", voiceAgentId)
    console.log("[v0] Call params:", JSON.stringify(callParams, null, 2))

    const response = await hamsa.createCallWithPhoneNumber(callParams)

    console.log("[v0] Hamsa call created successfully:", response.success ? "SUCCESS" : "FAILED")
    console.log("[v0] Full Hamsa response:", JSON.stringify(response, null, 2))
    console.log("[v0] Job ID from response:", response.data?.jobId || response.data?.id || "NONE")

    const jobId = response.data?.jobId || response.data?.id || response.jobId || response.id

    console.log("[v0] Final extracted jobId:", jobId)
    console.log("[v0] Returning to client - customerName:", customerName, "phoneNumber:", phoneNumber)

    return NextResponse.json({
      success: true,
      data: response.data,
      jobId: jobId,
      customerName: customerName,
      phoneNumber: phoneNumber,
      message: "تم بدء المكالمة بنجاح",
    })
  } catch (error) {
    console.error("[v0] Error creating Hamsa call:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "فشل في بدء المكالمة" }, { status: 500 })
  }
}
