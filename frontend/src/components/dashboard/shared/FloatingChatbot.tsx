"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquareIcon, XIcon, SendIcon, Loader2, BotIcon } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { sendChatMessage } from "@/lib/chatbot"

// Define the message structure for frontend history
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hi! I'm NutriBot. How can I help you today?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || input.length > 500) return // Max 500 chars 

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    
    // Add user message to UI state immediately
    setMessages((prev) => [...prev, userMessage])
    setInput("") // Clear input field
    setIsLoading(true)
    setError(null)

    try {
      // Send ONLY the latest message to the stateless backend 
      // The API token is handled automatically by the configured axios instance in @/lib/api
      const botReply = await sendChatMessage(userMessage.content)
      
      const botMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: botReply 
      }
      
      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.") 
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden shadow-2xl border border-border animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary p-3 text-primary-foreground">
            <div className="flex items-center gap-2 font-medium">
              <BotIcon className="size-5" />
              <span>NutriBot</span>
            </div>
            <Button size="icon" variant="ghost" className="size-8 text-primary-foreground hover:bg-primary/90 hover:text-white" onClick={() => setIsOpen(false)}>
              <XIcon className="size-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-muted/30">
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <Avatar className="size-8 bg-primary/10">
                      <AvatarFallback><BotIcon className="size-4 text-primary" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm text-card-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Loading Spinner  */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="size-8 bg-primary/10">
                    <AvatarFallback><BotIcon className="size-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-3 py-2 bg-card border shadow-sm flex items-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-center text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t bg-background">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about nutrition or the platform..."
                disabled={isLoading}
                maxLength={500} // Frontend validation for max length 
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <SendIcon className="size-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="size-14 rounded-full shadow-xl hover:scale-105 transition-transform"
      >
        {isOpen ? <XIcon className="size-6" /> : <MessageSquareIcon className="size-6" />}
      </Button>
    </div>
  )
}
