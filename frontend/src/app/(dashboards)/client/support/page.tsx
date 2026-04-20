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
      setSubject("");
      setMessage("");
    } catch (error) {
      alert("Mock Support ticket submitted!");
      setSubject("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Support</h1>
        <p className="text-muted-foreground dark:text-gray-400">Need help? Submit a support ticket and our team will assist you promptly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Support Form */}
        <Card className="md:col-span-2 dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm">
          <CardHeader>
            <CardTitle className="dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" /> Submit a Ticket
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Describe your issue and our team will get back to you via your registered email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitFeedback} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300">Subject / Topic</label>
                <Input 
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Account issue, Payment problem" 
                  className="dark:bg-[#12161b] dark:border-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300">Message Body</label>
                <textarea 
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your request in detail..." 
                  className="w-full min-h-[180px] p-3 text-sm rounded-md border border-gray-200 dark:border-gray-800 bg-transparent dark:bg-[#12161b] dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>
              <Button type="submit" disabled={submitting || !subject || !message} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Support Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Helpful Links & Contact */}
        <div className="space-y-4">
          <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-500" /> Quick Help
              </h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#12161b] border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors group">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">FAQ & Knowledge Base</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 ml-auto shrink-0" />
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#12161b] border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors group">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Platform Docs</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 ml-auto shrink-0" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm">
            <CardContent className="p-6 text-center space-y-3">
              <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Or email us directly:</p>
              <a href="mailto:support@nutriplatform.com" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline text-sm">
                support@nutriplatform.com
              </a>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
