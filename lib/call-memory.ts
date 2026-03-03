export interface CallMemoryEntry {
  phoneNumber: string
  customerName: string
  timestamp: number
  jobId?: string
}

const CALL_MEMORY_KEY = "almoayyed_call_memory"
const MEMORY_EXPIRY_DAYS = 90

export function saveCallToMemory(jobId: string, customerName: string, phoneNumber: string): void {
  if (typeof window === "undefined") return

  const memory = getCallMemory()
  const newEntry: CallMemoryEntry = {
    jobId,
    customerName,
    phoneNumber,
    timestamp: Date.now(),
  }

  // This allows multiple calls to the same phone number to be stored
  const existingIndex = memory.findIndex((e) => e.jobId === jobId)
  if (existingIndex >= 0) {
    memory[existingIndex] = newEntry
  } else {
    memory.push(newEntry)
  }

  const expiryTime = Date.now() - MEMORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  const cleanedMemory = memory.filter((e) => e.timestamp > expiryTime)

  localStorage.setItem(CALL_MEMORY_KEY, JSON.stringify(cleanedMemory))
}

export function getCallMemory(): CallMemoryEntry[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(CALL_MEMORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getCustomerNameByPhone(phoneNumber: string): string | null {
  const memory = getCallMemory()
  const entry = memory.find((e) => e.phoneNumber === phoneNumber)
  return entry?.customerName || null
}

export function getCustomerNameByJobId(jobId: string): string | null {
  const memory = getCallMemory()
  const entry = memory.find((e) => e.jobId === jobId)
  return entry?.customerName || null
}

export function getPhoneNumberByJobId(jobId: string): string | null {
  const memory = getCallMemory()
  const entry = memory.find((e) => e.jobId === jobId)
  return entry?.phoneNumber || null
}

export function getCallFromMemory(jobId: string): CallMemoryEntry | null {
  const memory = getCallMemory()
  const entry = memory.find((e) => e.jobId === jobId)
  return entry || null
}
