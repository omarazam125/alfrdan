import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function POST(request: NextRequest) {
  try {
    const { callId } = await request.json()

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 })
    }

    console.log("[v0] Generating report for Hamsa call:", callId)

    const hamsa = createHamsaClient()

    let callData: any
    try {
      const response = await hamsa.getJobDetails(callId)
      callData = response.data || response
      console.log("[v0] Hamsa call data fetched successfully")
      console.log("[v0] Call data keys:", Object.keys(callData))
      console.log("[v0] Full call data structure:", JSON.stringify(callData, null, 2).substring(0, 2000))
    } catch (error) {
      console.error("[v0] Failed to fetch Hamsa call details:", error)
      return NextResponse.json({ error: "Failed to fetch call details from Hamsa" }, { status: 500 })
    }

    let phoneNumber = "غير متوفر"

    // Priority 1: From nested data.toNumber (most reliable)
    if (callData.data?.toNumber && !callData.data.toNumber.includes("/")) {
      phoneNumber = callData.data.toNumber
      console.log("[v0] Phone from data.toNumber:", phoneNumber)
    }
    // Priority 2: From nested data.params.actual_phone_number
    else if (callData.data?.params?.actual_phone_number && !callData.data.params.actual_phone_number.includes("/")) {
      phoneNumber = callData.data.params.actual_phone_number
      console.log("[v0] Phone from data.params.actual_phone_number:", phoneNumber)
    }
    // Priority 3: From nested data.params.phone_number
    else if (callData.data?.params?.phone_number && !callData.data.params.phone_number.includes("/")) {
      phoneNumber = callData.data.params.phone_number
      console.log("[v0] Phone from data.params.phone_number:", phoneNumber)
    }
    // Priority 4: From top-level toNumber
    else if (callData.toNumber && !callData.toNumber.includes("/")) {
      phoneNumber = callData.toNumber
      console.log("[v0] Phone from toNumber:", phoneNumber)
    }
    // Priority 5: From top-level params.actual_phone_number
    else if (callData.params?.actual_phone_number && !callData.params.actual_phone_number.includes("/")) {
      phoneNumber = callData.params.actual_phone_number
      console.log("[v0] Phone from params.actual_phone_number:", phoneNumber)
    }
    // Priority 6: From agentDetails.params.phone_number
    else if (callData.agentDetails?.params?.phone_number && !callData.agentDetails.params.phone_number.includes("/")) {
      phoneNumber = callData.agentDetails.params.phone_number
      console.log("[v0] Phone from agentDetails.params.phone_number:", phoneNumber)
    }
    // Priority 7: From data.agentDetails.params.phone_number
    else if (
      callData.data?.agentDetails?.params?.phone_number &&
      !callData.data.agentDetails.params.phone_number.includes("/")
    ) {
      phoneNumber = callData.data.agentDetails.params.phone_number
      console.log("[v0] Phone from data.agentDetails.params.phone_number:", phoneNumber)
    }

    console.log("[v0] Final extracted phoneNumber:", phoneNumber)

    let duration = 0
    if (callData.data?.callDuration) {
      duration = callData.data.callDuration
    } else if (callData.callDuration) {
      duration = callData.callDuration
    } else if (callData.data?.duration) {
      duration = callData.data.duration
    } else if (callData.duration) {
      duration = callData.duration
    }
    console.log("[v0] Extracted duration:", duration)

    // Extract transcript
    let transcript = ""

    if (callData.data?.jobResponse?.transcription && Array.isArray(callData.data.jobResponse.transcription)) {
      console.log("[v0] Extracting transcript from jobResponse.transcription array")
      transcript = callData.data.jobResponse.transcription
        .map((item: any) => {
          if (item.Agent) {
            return `Agent: ${typeof item.Agent === "string" ? item.Agent : JSON.stringify(item.Agent)}`
          } else if (item.User) {
            return `Customer: ${typeof item.User === "string" ? item.User : JSON.stringify(item.User)}`
          }
          return ""
        })
        .filter((line: string) => line.length > 0)
        .join("\n")
    } else if (callData.toScript && typeof callData.toScript === "string" && callData.toScript.length > 10) {
      console.log("[v0] Using top-level toScript field (outbound)")
      transcript = callData.toScript
    } else if (callData.fromScript && typeof callData.fromScript === "string" && callData.fromScript.length > 10) {
      console.log("[v0] Using top-level fromScript field (inbound)")
      transcript = callData.fromScript
    } else if (
      callData.data?.toScript &&
      typeof callData.data.toScript === "string" &&
      callData.data.toScript.length > 10
    ) {
      console.log("[v0] Using data.toScript field (outbound)")
      transcript = callData.data.toScript
    } else if (
      callData.data?.fromScript &&
      typeof callData.data.fromScript === "string" &&
      callData.data.fromScript.length > 10
    ) {
      console.log("[v0] Using data.fromScript field (inbound)")
      transcript = callData.data.fromScript
    } else if (
      callData.data?.transcript &&
      typeof callData.data.transcript === "string" &&
      callData.data.transcript.length > 10
    ) {
      console.log("[v0] Using data.transcript field")
      transcript = callData.data.transcript
    } else if (callData.transcript && typeof callData.transcript === "string" && callData.transcript.length > 10) {
      console.log("[v0] Using top-level transcript field")
      transcript = callData.transcript
    } else if (callData.messages && Array.isArray(callData.messages)) {
      console.log("[v0] Extracting transcript from messages array")
      transcript = callData.messages
        .filter((msg: any) => msg.message || msg.content || msg.text)
        .map((msg: any) => {
          const role = msg.role === "assistant" || msg.role === "bot" || msg.role === "agent" ? "Agent" : "Customer"
          const content = msg.message || msg.content || msg.text || ""
          return `${role}: ${content}`
        })
        .join("\n")
    } else if (callData.conversation) {
      console.log("[v0] Using conversation field")
      transcript =
        typeof callData.conversation === "string" ? callData.conversation : JSON.stringify(callData.conversation)
    }

    console.log("[v0] Extracted transcript length:", transcript.length)
    console.log("[v0] Transcript preview:", transcript.substring(0, 500))

    if (!transcript || transcript.length < 10) {
      console.error("[v0] No valid transcript available")
      console.error("[v0] Available fields:", Object.keys(callData.data || {}))
      return NextResponse.json(
        {
          error: "No valid transcript available for this call",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Generating AI analysis with OpenAI...")
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.error("[v0] OPENAI_API_KEY environment variable is not set")
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to environment variables." },
        { status: 500 },
      )
    }

    const analysisPrompt = `⚠️ مهم جداً: يجب أن تكو�� جميع المخرجات باللغة العربية فقط - ما عدا customerMood يجب أن يكون بالإنجليزية ⚠️

قم بتحليل نص المكالمة هذا من مركز خدمة الفردان للسيارات (Alfardan Automotive Service Center):

${transcript}

**قدم تحليلاً شاملاً متعدد الأبعاد يتضمن:**

0. **استخراج تفاصيل الطلب الكاملة (Order Details)**:
   استخرج جميع المعلومات التالية من المكالمة إذا ذُكرت:
   - اسم العميل الكامل
   - رقم اللوحة (License Plate)
   - نوع السيارة والطراز وسنة التسجيل
   - رقم الجوال للتواصل
   - ممشى السيارة (الكيلومترات تقريباً)
   - السبب الرئيسي للزيارة (الخدمة المطلوبة)
   - أي طلبات إضافية
   - الفرع المختار
   - المستشار المفضل (إن وجد)
   - الموعد المختار (التاريخ والوقت)
   - خيار التنقّل المختار (انتظار، توصيل، استلام وتسليم، سيارة بديلة)
   - العنوان (إذا كان استلام وتسليم)
   - المدة التقريبية للخدمة
   - التكلفة التقريبية
   - هل لديه باقة خدمة؟
   - أي ملاحظات خاصة أو تعليمات

1. **استخراج معلومات العميل**:
   - استخرج اسم العميل من المحادثة
   - حدد مزاج العميل بالإنجليزية فقط: Happy, Satisfied, Neutral, Frustrated, أو Angry
   - حدد نوع المركبة إذا ذُكر
   - سجل أي مخاوف أو طلبات خاصة بالصيانة

2. **تقييم رضا العميل وجودة الخدمة** (1-10 لكل منها):
   - رضا العميل الإجمالي عن الخدمة
   - جودة المعلومات المقدمة
   - احترافية التفاعل
   - سرعة وكفاءة الخدمة
   - التعاطف والدعم المقدم
   - وضوح التواصل
   - فعالية حل المشكلات

3. **تعاون العميل والمشاركة** (1-10):
   - الاستعداد لتقديم المعلومات
   - الاستجابة للأسئلة
   - وضوح الردود
   - مستوى المشاركة في المحادثة
   - الثقة في مزود الخدمة

4. **مقاييس جودة الخدمة**:
   - هل تم معالجة استفسار العميل بالكامل؟ (نعم/لا/جزئياً)
   - هل تم تقديم إرشادات الخدمة المناسبة؟
   - هل تم توضيح الخطوات التالية بوضوح؟
   - هل تم ترتيب المتابعة إذا لزم الأمر؟

5. **نقاط المناقشة الرئيسية** (10-15 نقطة):
   - مخاوف الصيانة الرئيسية المذكورة
   - الخدمات المطلوبة أو التي تمت مناقشتها
   - معلومات المركبة المهمة المشاركة
   - أسئلة واستفسارات العميل
   - الحلول أو التوصيات المقدمة

6. **تحليل سلوك العميل المفصل** (8-12 نقطة):
   - أسلوب ونبرة التواصل
   - الحالة العاطفية خلال المكالمة
   - مستوى الفهم
   - المخاوف أو القلق المُعبر عنها
   - مؤشرات الرضا

7. **ملخص شامل للمكالمة** (7-10 جمل):
   - نظرة عامة مفصلة على غرض المكالمة
   - احتياجات ومخاوف العميل
   - الإجراءات التي اتخذها الوكيل
   - النتائج والحلول
   - جودة الخدمة الإجمالية

8. **12-15 سؤال تقييم مفصل**:
   - تحية الوكيل والتعريف بنفسه
   - التحقق من هوية العميل
   - إظهار الاستماع الفعال
   - دقة معلومات الخدمة
   - إظهار التعاطف والاهتمام
   - نهج حل المشكلات
   - وضوح المعلومات
   - ترتيبات المتابعة
   - تقديم التثقيف للعميل
   - الحفاظ على الخصوصية والسرية
   - استخدام المصطلحات المهنية بشكل مناسب
   - إغلاق المكالمة والتحقق من الرضا

9. **5-7 توصيات قابلة للتنفيذ**:
   - اقتراحات تحسين الخدمة
   - احتياجات تدريب الوكيل المحددة
   - فرص تحسين العمليات
   - تحسينات تجربة العميل

10. **النتائج الإجمالية** (1-10):
    - درجة رضا العميل
    - درجة جودة الخدمة
    - درجة أداء الوكيل
    - درجة تعاون العميل
    - درجة نجاح المكالمة الإجمالية

أجب بتنسيق JSON بهذا الهيكل (جميع القيم النصية يجب أن تكون بالعربية ما عدا customerMood):
{
  "orderDetails": {
    "customerName": "string (بالعربية) - اسم العميل الكامل",
    "licensePlate": "string - رقم اللوحة",
    "vehicleInfo": {
      "type": "string (بالعربية) - نوع السيارة",
      "model": "string (بالعربية) - الطراز",
      "year": "string - سنة التسجيل"
    },
    "phoneNumber": "string - رقم الجوال",
    "mileage": "string (بالعربية) - ممشى السيارة",
    "mainServiceReason": "string (بالعربية) - السبب الرئيسي للزيارة",
    "additionalRequests": ["string (بالعربية) - طلبات إضافية"],
    "selectedBranch": "string (بالعربية) - الفرع المختار",
    "preferredConsultant": "string (بالعربية) - المستشار المفضل أو 'غير محدد'",
    "selectedAppointment": {
      "date": "string - التاريخ",
      "time": "string - الوقت"
    },
    "transportOption": "string (بالعربية) - خيار التنقّل: انتظار/توصيل/استلام وتسليم/سيارة بديلة",
    "address": "string (بالعربية) - العنوان إذا كان استلام وتسليم، وإلا 'غير مطلوب'",
    "estimatedDuration": "string (بالعربية) - المدة التقريبية",
    "estimatedCost": "string (بالعربية) - التكلفة التقريبية",
    "hasServicePackage": "string (بالعربية) - نعم/لا/غير مذكور",
    "specialNotes": "string (بالعربية) - أي ملاحظات خاصة"
  },
  "customerName": "string (بالعربية)",
  "customerMood": "Happy|Satisfied|Neutral|Frustrated|Angry",
  "vehicleType": "string (بالعربية)",
  "serviceRequests": ["string (بالعربية)"],
  "satisfactionMetrics": {
    "overallSatisfaction": number,
    "informationQuality": number,
    "professionalism": number,
    "serviceSpeed": number,
    "empathy": number,
    "communication": number,
    "problemResolution": number
  },
  "customerCooperation": {
    "score": number,
    "description": "string (بالعربية)",
    "willingnessToProvideInfo": number,
    "responsiveness": number,
    "clarityOfResponses": number,
    "engagement": number,
    "trust": number
  },
  "serviceQuality": {
    "queryFullyAddressed": "نعم|لا|جزئياً",
    "serviceGuidanceProvided": boolean,
    "nextStepsClear": boolean,
    "followUpArranged": boolean
  },
  "keyDiscussionPoints": ["string (بالعربية)"],
  "customerBehaviorAnalysis": ["string (بالعربية)"],
  "comprehensiveSummary": "string (بالعربية)",
  "detailedAssessmentQuestions": [{
    "question": "string (بالعربية)",
    "answer": "string (بالعربية)",
    "status": "ممتاز|ج��د|يحتاج تحسين|ضعيف",
    "details": "string (بالعربية)"
  }],
  "recommendations": ["string (بالعربية)"],
  "overallScores": {
    "customerSatisfaction": number,
    "serviceQuality": number,
    "agentPerformance": number,
    "customerCooperation": number,
    "callSuccess": number
  }
}`

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "أنت محلل متخصص في خدمة العملاء تقوم بتقييم تفاعلات العملاء وجودة الخدمة لمركز خدمة الفردان للسيارات (Alfardan Automotive Service Center). قدم تحليلاً شاملاً ومتعدد الأبعاد يغطي رضا العميل، جودة الخدمة، أداء الوكيل، وتعاون العميل. يجب أن تكون جميع الردود باللغة العربية وبتنسيق JSON مع رؤى تفصيلية.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    })

    if (!openaiResponse.ok) {
      console.error("[v0] OpenAI API error:", openaiResponse.status)
      const errorText = await openaiResponse.text()
      console.error("[v0] Error details:", errorText)
      return NextResponse.json({ error: "Failed to generate analysis" }, { status: openaiResponse.status })
    }

    const openaiData = await openaiResponse.json()
    const analysisText = openaiData.choices?.[0]?.message?.content || ""

    console.log("[v0] OpenAI response received, length:", analysisText.length)
    console.log("[v0] Response preview:", analysisText.substring(0, 500))

    let analysis
    try {
      analysis = JSON.parse(analysisText)
      console.log("[v0] Analysis parsed successfully")

      // Handle both old format (customerAssessmentQuestions) and new format (detailedAssessmentQuestions)
      const assessmentQuestions = analysis.detailedAssessmentQuestions || analysis.customerAssessmentQuestions || []
      
      if (!Array.isArray(assessmentQuestions) || assessmentQuestions.length < 12) {
        console.log("[v0] Padding assessment questions to minimum 12")
        const defaultQuestions = [
          {
            question: "تحية الوكيل والتعريف المهني",
            answer: "قدم الوكيل تحية دافئة ومهنية مع تعريف واضح",
            status: "ممتاز",
            details: "تم الحفاظ على نبرة مهنية طوال المقدمة"
          },
          {
            question: "التحقق من هوية العميل",
            answer: "تم التحقق من هوية العميل بشكل صحيح وفقاً للبروتوكولات",
            status: "��متاز",
            details: "تم إكمال جميع خطوات التحقق المطلوبة"
          },
          {
            question: "الاستماع الفعال والتعاطف",
            answer: "أظهر الوكيل مهارات الاستماع الفعال وأبدى تعاطفاً مع مخاوف العميل",
            status: "ممتاز",
            details: "شعر العميل بأنه مسموع ومفهوم"
          },
          {
            question: "دقة معلومات الخدمة",
            answer: "جميع معلومات الخدمة المقدمة كانت دقيقة ومناسبة",
            status: "ممتاز",
            details: "المعلومات متوافقة مع إرشادات الخدمة"
          },
          {
            question: "تقييم احتياجات العميل",
            answer: "قام الوكيل بتقييم شامل لاحتياجات ومخاوف العميل",
            status: "جيد",
            details: "فهم شامل لوضع العميل"
          },
          {
            question: "وضوح التواصل",
            answer: "تم توصيل المعلومات بلغة واضحة ومفهومة",
            status: "ممتاز",
            details: "شرح واضح ومناسب للعميل"
          },
          {
            question: "فعالية حل المشكلات",
            answer: "تم معالجة استفسار العميل وحله بفعالية",
            status: "جيد",
            details: "تم تحقيق حل مُرضٍ"
          },
          {
            question: "المتابعة والخطوات التالية",
            answer: "تم توضيح خطة المتابعة والخطوات التالية بوضوح",
            status: "ممتاز",
            details: "العميل يعرف ما يجب فعله بعد ذلك"
          },
          {
            question: "تثقيف العميل",
            answer: "تم تقديم المعلومات المناسبة للعميل حول الخدمة",
            status: "جيد",
            details: "تم مشاركة معلومات مفيدة"
          },
          {
            question: "الخصوصية والسرية",
            answer: "تم الحفاظ على خصوصية وسرية العميل طوال المكالمة",
            status: "ممتاز",
            details: "تم اتباع جميع بروتوكولات الخصوصية"
          },
          {
            question: "جودة الخدمة والاحترافية",
            answer: "جودة الخدمة والاحترافية الإجمالية كانت ممتازة",
            status: "ممتاز",
            details: "تم إظهار معيار عالٍ من الرعاية"
          },
          {
            question: "رضا العميل وإغلاق المكالمة",
            answer: "تم التأكد من رضا العميل قبل إنهاء المكالمة",
            status: "ممتاز",
            details: "إغلاق مناسب مع التحقق من الرضا"
          },
        ]

        const finalQuestions = [...assessmentQuestions]
        while (finalQuestions.length < 12) {
          finalQuestions.push(defaultQuestions[finalQuestions.length])
        }
        
        analysis.detailedAssessmentQuestions = finalQuestions
        analysis.customerAssessmentQuestions = finalQuestions // Keep backward compatibility
      } else {
        analysis.detailedAssessmentQuestions = assessmentQuestions
        analysis.customerAssessmentQuestions = assessmentQuestions
      }
    } catch (parseError: any) {
      console.error("[v0] Failed to parse OpenAI response:", parseError.message)
      console.error("[v0] Full response text:", analysisText.substring(0, 2000))

      return NextResponse.json(
        {
          error: "Failed to parse OpenAI response. Please try again.",
          details: "A response was received from OpenAI, but it could not be parsed correctly.",
          responsePreview: analysisText.substring(0, 500),
        },
        { status: 500 },
      )
    }

    // Map new format to old format for backward compatibility
    const extractedCustomerName = analysis.patientName || analysis.customerName || "Unknown"
    
    // Normalize analysis structure to support both old and new formats
    if (!analysis.customerName && analysis.patientName) {
      analysis.customerName = analysis.patientName
    }
    if (!analysis.customerMood && analysis.patientMood) {
      analysis.customerMood = analysis.patientMood
    }
    if (!analysis.customerOverallScore && analysis.overallScores?.patientSatisfaction) {
      analysis.customerOverallScore = analysis.overallScores.patientSatisfaction
    }

    const customerEmail =
      callData.agentDetails?.params?.customerEmail ||
      callData.params?.customerEmail ||
      callData.metadata?.customerEmail ||
      callData.data?.params?.customerEmail ||
      callData.data?.agentDetails?.params?.customerEmail ||
      ""

    const report = {
      id: callId,
      callId: callId,
      customerName: extractedCustomerName,
      phoneNumber: phoneNumber,
      customerEmail: customerEmail,
      duration: duration,
      status: callData.status || callData.data?.status || "Completed",
      createdAt: callData.createdAt || callData.data?.createdAt || new Date().toISOString(),
      language: callData.agentDetails?.lang || callData.data?.agentDetails?.lang || callData.language || "en",
      transcript: transcript,
      recordingUrl:
        callData.recordingUrl || callData.data?.recordingUrl || callData.audioUrl || callData.data?.audioUrl || "",
      analysis: analysis,
      generatedAt: new Date().toISOString(),
    }

    console.log("[v0] Report generated successfully for customer:", extractedCustomerName)
    console.log("[v0] Final report phoneNumber:", phoneNumber)
    console.log("[v0] Final report duration:", duration)

    return NextResponse.json(report)
  } catch (error) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
