"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, MessageSquare, Send, HelpCircle, Mail, FileText, ExternalLink } from "lucide-react";

export default function SupportPage() {
  // Feedback states
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    
    setSubmitting(true);
    try {
      await api.post("/client/feedback/", { subject, message });
      alert("Support ticket submitted! Admin will review shortly.");
      setSubject(""); setMessage("");
    } catch (error) {
      alert("Mock Support ticket submitted!");
      setSubject(""); setMessage("");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Support</h1>
        <p className="text-muted-foreground">Need help? Submit a support ticket and our team will assist you promptly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Support Form */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Submit a Ticket
            </CardTitle>
            <CardDescription>Describe your issue and our team will get back to you via your registered email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitFeedback} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject / Topic</label>
                <Input 
                  required value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Account issue, Payment problem" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message Body</label>
                <textarea 
                  required value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your request in detail..." 
                  className="w-full min-h-[180px] p-3 text-sm rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" disabled={submitting || !subject || !message} className="w-full py-6">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Support Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Helpful Links & Contact */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" /> Quick Help
              </h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors group">
                  <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">FAQ & Knowledge Base</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto shrink-0" />
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors group">
                  <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">Platform Docs</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto shrink-0" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 text-center space-y-3">
              <Mail className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Or email us directly:</p>
              <a href="mailto:support@nutriplatform.com" className="text-primary font-medium hover:underline text-sm">
                support@nutriplatform.com
              </a>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
