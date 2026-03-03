import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, customerName, language } = body

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const analysisPrompt =
      language === "ar"
        ? `أنت محلل مكالمات خبير لمركز اتصالات المؤيد. قم بتحليل النص التالي للمكالمة وقدم تقريراً شاملاً باللغة العربية.

نص المكالمة:
${transcript}

قدم التحليل التالي بصيغة JSON:

{
  "customerCooperation": {
    "score": (رقم من 1-10),
    "assessment": "تقييم مفصل لمدى تعاون العميل"
  },
  "engagement": {
    "score": (رقم من 1-10),
    "assessment": "تقييم مدى تفاعل العميل"
  },
  "issueResolved": {
    "resolved": (true/false),
    "details": "تفاصيل إن وجدت"
  },
  "keyPoints": [
    "النقطة الأولى المهمة",
    "النقطة الثانية المهمة",
    "النقطة الثالثة المهمة"
  ],
  "assessmentQuestions": [
    {
      "question": "هل تم التعريف بالهوية بشكل صحيح؟",
      "answer": "نعم/لا",
      "status": "ناجح/فاشل",
      "details": "تفاصيل إضافية"
    }
  ],
  "summary": "ملخص شامل للمكالمة (3-5 جمل)",
  "recommendations": [
    "توصية 1",
    "توصية 2"
  ],
  "overallScore": (رقم من 1-10)
}`
        : `You are an expert call analyst for Almoayyed call center. Analyze the following call transcript and provide a comprehensive report.

Call Transcript:
${transcript}

Provide the analysis in JSON format:

{
  "customerCooperation": {
    "score": (number 1-10),
    "assessment": "detailed assessment of customer cooperation"
  },
  "engagement": {
    "score": (number 1-10),
    "assessment": "assessment of customer engagement level"
  },
  "issueResolved": {
    "resolved": (true/false),
    "details": "details if any"
  },
  "keyPoints": [
    "first key discussion point",
    "second key discussion point",
    "third key discussion point"
  ],
  "assessmentQuestions": [
    {
      "question": "Was proper identification provided?",
      "answer": "Yes/No",
      "status": "Pass/Fail",
      "details": "additional details"
    }
  ],
  "summary": "comprehensive call summary (3-5 sentences)",
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "overallScore": (number 1-10)
}`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenAI API Error:", errorText)
      return NextResponse.json({ error: `OpenAI API Error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content || ""

    const analysis = JSON.parse(generatedText)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] Error analyzing call:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze call" },
      { status: 500 },
    )
  }
}
