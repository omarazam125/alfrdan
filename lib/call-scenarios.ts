export interface ScenarioField {
  id: string
  label: string
  labelEn: string
  type: "text" | "number" | "email" | "textarea" | "select" | "ai-questions"
  placeholder: string
  placeholderEn: string
  required: boolean
  options?: { value: string; label: string; labelEn: string }[]
}

export interface CallScenario {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  icon: string
  fields: ScenarioField[]
  agentId: string
  systemPromptAr?: string
  systemPromptEn?: string
  firstMessageAr?: string
  firstMessageEn?: string
}

export const ALMOAYYED_SCENARIOS: CallScenario[] = [
  {
    id: "service-appointment-booking",
    name: "حجز موعد خدمة",
    nameEn: "Service Appointment Booking",
    description: "حجز موعد صيانة للمركبة في مركز خدمة الفردان",
    descriptionEn: "Book a vehicle service appointment at Alfardan service center",
    icon: "🚗",
    agentId: "ac90bc4a-7e12-43c0-8009-9d462d15896c",
    fields: [
      {
        id: "customer_name",
        label: "الاسم",
        labelEn: "Name",
        type: "text",
        placeholder: "أدخل اسم العميل",
        placeholderEn: "Enter customer name",
        required: true,
      },
      {
        id: "phoneNumber",
        label: "رقم الهاتف",
        labelEn: "Phone Number",
        type: "text",
        placeholder: "+974 XXXX XXXX",
        placeholderEn: "+974 XXXX XXXX",
        required: true,
      },
    ],
  },
]

export const OMANTEL_SCENARIOS = ALMOAYYED_SCENARIOS

export function getScenarioById(id: string): CallScenario | undefined {
  return ALMOAYYED_SCENARIOS.find((s) => s.id === id)
}

export function buildPrompt(scenario: CallScenario, language: "ar" | "en", variables: Record<string, string>): string {
  let prompt = language === "ar" ? scenario.systemPromptAr : scenario.systemPromptEn

  if (!prompt) return ""

  Object.entries(variables).forEach(([key, value]) => {
    const doublePlaceholder = `{{${key}}}`
    const singlePlaceholder = `{${key}}`
    const replacementValue = value || (language === "ar" ? "غير متوفر" : "N/A")
    prompt = prompt.replaceAll(doublePlaceholder, replacementValue)
    prompt = prompt.replaceAll(singlePlaceholder, replacementValue)
  })

  return prompt
}

export function getFirstMessage(
  scenario: CallScenario,
  language: "ar" | "en",
  variables: Record<string, string>,
): string {
  let message = language === "ar" ? scenario.firstMessageAr : scenario.firstMessageEn

  if (!message) return ""

  Object.entries(variables).forEach(([key, value]) => {
    const doublePlaceholder = `{{${key}}}`
    const singlePlaceholder = `{${key}}`
    const replacementValue = value || (language === "ar" ? "غير متوفر" : "N/A")
    message = message.replaceAll(doublePlaceholder, replacementValue)
    message = message.replaceAll(singlePlaceholder, replacementValue)
  })

  return message
}

export function getAllScenarios(): CallScenario[] {
  return [...ALMOAYYED_SCENARIOS, ...getCustomScenarios()]
}

export function getCustomScenarios(): CallScenario[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("customScenarios")
  return stored ? JSON.parse(stored) : []
}

export function saveCustomScenario(scenario: CallScenario): void {
  const customScenarios = getCustomScenarios()
  customScenarios.push(scenario)
  localStorage.setItem("customScenarios", JSON.stringify(customScenarios))
}

export function deleteCustomScenario(id: string): void {
  const customScenarios = getCustomScenarios().filter((s) => s.id !== id)
  localStorage.setItem("customScenarios", JSON.stringify(customScenarios))
}
