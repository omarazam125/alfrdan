import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const report = await request.json()

    console.log("[v0] Saving complete report to Supabase:", {
      id: report.id,
      customerName: report.customerName,
      phoneNumber: report.phoneNumber,
      duration: report.duration,
      status: report.status,
    })

    const supabase = await createSupabaseServer()

    const reportData = {
      id: report.id,
      call_id: report.callId || report.id,
      job_id: report.id,
      customer_name: report.customerName || "Unknown",
      phone_number: report.phoneNumber || "N/A",
      duration: report.duration?.toString() || "0:00",
      status: report.status || "completed",
      transcript: report.transcript || "",
      summary: report.analysis?.customerBehavior?.description || report.summary || "",
      notes: report.notes || "",
      analysis: report.analysis || {},
      created_at: report.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Prepared report data for Supabase:", reportData)

    const { data, error } = await supabase
      .from("call_reports")
      .upsert(reportData, {
        onConflict: "id",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving report to Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Report saved successfully to Supabase:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in save report API:", error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}
