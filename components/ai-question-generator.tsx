"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, MessageSquare, Send, Plus, Bot } from "lucide-react"
import { getRandomQuestionGroup } from "@/lib/question-groups"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AIQuestionGeneratorProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  required?: boolean
  language?: "ar" | "en"
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  isQuestions?: boolean
}

export function AIQuestionGenerator({
  value,
  onChange,
  label,
  placeholder,
  required,
  language = "ar",
}: AIQuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const randomGroup = getRandomQuestionGroup(language)
      const questionsText = randomGroup.questions.join("\n")
      onChange(questionsText)
      setIsGenerating(false)
    }, 500)
  }

  const handleOpenChat = () => {
    const currentQuestions = value.trim() || getRandomQuestionGroup(language).questions.join("\n")

    if (!value.trim()) {
      onChange(currentQuestions)
    }

    const initialMessage = language === "en" ? currentQuestions : currentQuestions

    setChatMessages([
      {
        role: "assistant",
        content: initialMessage,
        isQuestions: true,
      },
    ])
    setShowChat(true)
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userInput,
    }

    setChatMessages((prev) => [...prev, newUserMessage])
    setUserInput("")
    setIsSendingMessage(true)

    try {
      const response = await fetch("/api/gemini/chat-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages, newUserMessage],
          sessionId: sessionId || undefined,
          language: language,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate questions")
      }

      const data = await response.json()

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.questions,
        isQuestions: true,
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          language === "en"
            ? "Sorry, I couldn't generate the questions. Please try again."
            : "عذراً، لم أستطع توليد الأسئلة. الرجاء المحاولة مرة أخرى.",
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleApplyQuestions = (questions: string) => {
    onChange(questions)
    setShowChat(false)
    setChatMessages([])
    setSessionId("")
  }

  const chatButtonText = language === "en" ? "Chat with AI" : "Chat with AI"
  const generateButtonText = language === "en" ? "Generate Questions" : "Generate Questions"
  const generatingText = language === "en" ? "Generating..." : "Generating..."
  const addMoreText =
    language === "en"
      ? "You can add more questions after automatic generation"
      : "You can add more questions after automatic generation"
  const chatTitleText =
    language === "en" ? "Chat with AI to Customize Questions" : "Chat with AI to Customize Questions"
  const questionsCountText = language === "en" ? "5 questions generated" : "5 أسئلة تم توليدها"
  const applyButtonText = language === "en" ? "Add to Form" : "إضافة للنموذج"
  const inputPlaceholderText = language === "en" ? "Type here..." : "اكتب هنا..."
  const sendButtonText = language === "en" ? "Send" : "إرسال"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-sans text-sm font-medium">
          {label} {required && "*"}
        </Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleOpenChat} className="gap-2 bg-transparent">
            <MessageSquare className="h-4 w-4" />
            {chatButtonText}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 bg-transparent"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? generatingText : generateButtonText}
          </Button>
        </div>
      </div>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] font-sans"
        dir={language === "ar" ? "rtl" : "ltr"}
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Plus className="h-4 w-4" />
        <span>{addMoreText}</span>
      </div>

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-8 pb-6 border-b bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {chatTitleText}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-muted/20 to-background"
          >
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-md transition-all hover:shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                      : "bg-background border border-border/50 backdrop-blur-sm"
                  }`}
                >
                  {message.role === "assistant" && message.isQuestions && (
                    <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground">{questionsCountText}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 text-xs font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleApplyQuestions(message.content)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {applyButtonText}
                      </Button>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" dir={language === "ar" ? "rtl" : "ltr"}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[75%] rounded-2xl bg-background border border-border/50 px-5 py-4 shadow-md backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t px-6 py-5 bg-background/95 backdrop-blur-sm">
            <Input
              placeholder={inputPlaceholderText}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isSendingMessage}
              className="flex-1 h-11 rounded-xl border-border/50 focus-visible:ring-primary"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isSendingMessage || !userInput.trim()}
              className="gap-2 px-6 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
            >
              <Send className="h-4 w-4" />
              {sendButtonText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
