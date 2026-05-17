"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquareIcon, XIcon, SendIcon, BotIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { sendChatMessage } from "@/lib/chatbot"
import { Suggestion, Suggestions } from "@/components/ai/suggestion"

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const chatbotSuggestions = [
  "What should I eat today?",
  "How to track my macros?",
  "Give me a healthy recipe",
  "Tips for weight loss"
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hi! I'm NutriBot. How can I help you reach your health goals today?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  // Simulated streaming function to make the bot response feel more organic
  const simulateTyping = async (messageId: string, fullText: string) => {
    setIsTyping(true)
    const words = fullText.split(" ")
    let currentText = ""

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i]
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: currentText } : msg
        )
      )

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 40 + 20))
    }
    
    setIsTyping(false)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || text.length > 500 || isLoading || isTyping) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text.trim() }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("") 
    setIsLoading(true)
    setError(null)

    try {
      const botReply = await sendChatMessage(userMessage.content)
      
      setIsLoading(false) 
      
      const botMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [...prev, { id: botMessageId, role: "assistant", content: "" }])
      
      await simulateTyping(botMessageId, botReply)

    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || "Something went wrong. Please try again.") 
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      
      {/* Floating Close Button */}
      {isOpen && (
        <Button
          onClick={() => setIsOpen(false)}
          size="icon"
          variant="secondary"
          className="size-10 rounded-full shadow-lg border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 animate-in fade-in zoom-in-95"
          aria-label="Close chat"
        >
          <XIcon className="size-5" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="flex h-[550px] max-h-[80vh] w-[350px] sm:w-[380px] flex-col overflow-hidden shadow-2xl border-border/60 rounded-2xl animate-in slide-in-from-bottom-5 fade-in-20 duration-300 bg-card">
          
          {/* Header - Refined for a cleaner, horizontal layout */}
          <div className="flex items-center gap-3 border-b border-border/40 p-4 text-card-foreground">
            <Avatar className="size-10 bg-primary/10 shadow-sm border border-primary/20">
              <AvatarFallback><BotIcon className="size-5 text-primary" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="font-semibold text-sm flex items-center gap-1.5">
                NutriBot <SparklesIcon className="size-3 text-primary animate-pulse" />
              </h2>
              <p className="text-xs text-muted-foreground">Your personal nutrition assistant</p>
            </div>
          </div>

          {/* Messages Area - Unified background */}
          <ScrollArea className="flex-1 min-h-0 bg-transparent">
            <div className="space-y-5 p-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <Avatar className="size-8 bg-primary/10 mt-auto shrink-0 shadow-sm border border-primary/20">
                      <AvatarFallback><BotIcon className="size-4 text-primary" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={`relative rounded-2xl px-4 py-2.5 max-w-[85%] text-sm min-h-[40px] shadow-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted border border-border/40 text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                    {isTyping && msg.role === "assistant" && msg.content !== "" && msg.id === messages[messages.length - 1].id && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-current animate-pulse opacity-60 align-middle rounded-full" />
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in">
                  <Avatar className="size-8 bg-primary/10 mt-auto shrink-0 shadow-sm border border-primary/20">
                    <AvatarFallback><BotIcon className="size-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-muted border border-border/40 shadow-sm flex items-center h-[44px]">
                    <div className="flex gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-center text-xs text-destructive mt-4 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}
              <div ref={scrollRef} className="h-px w-full" />
            </div>
          </ScrollArea>

          {/* Suggestions - Unified background */}
          {messages.length === 1 && !isLoading && !isTyping && (
            <div className="px-4 pb-3 pt-1">
              <Suggestions className="flex flex-wrap gap-2">
                {chatbotSuggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    onClick={handleSuggestionClick}
                    suggestion={suggestion}
                    className="text-xs py-1.5 px-3 rounded-full bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors shadow-sm"
                  />
                ))}
              </Suggestions>
            </div>
          )}

          {/* Input Area - Cleaner borders */}
          <div className="p-3 border-t border-border/40">
            <form onSubmit={handleSend} className="flex gap-2 relative items-end">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about nutrition..."
                disabled={isLoading || isTyping}
                maxLength={500} 
                className="flex-1 rounded-2xl min-h-[44px] pr-12 bg-background border-border/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading || isTyping}
                className="absolute right-1.5 bottom-1.5 size-8 rounded-xl shadow-sm transition-transform active:scale-95"
              >
                <SendIcon className="size-4 ml-0.5" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Floating Open Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="size-14 rounded-full shadow-2xl hover:-translate-y-1 hover:shadow-primary/25 hover:shadow-2xl transition-all duration-300 group"
        >
          <MessageSquareIcon className="size-6 group-hover:scale-110 transition-transform duration-300" />
        </Button>
      )}
    </div>
  )
}