"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, MessageCircle, Heart, Send } from "lucide-react";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get("/client/posts/mine/");
        setPosts(response.data.results || response.data || []);
      } catch (error) {
        // Mock fallback
        setPosts([
          { id: 1, content: "Just started the Hormonal Balance plan and feeling great after week 1!", status: "approved", created_at: new Date().toISOString() },
          { id: 2, content: "Does anyone have good substitutes for almond milk in the recipes?", status: "approved", created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, content: "Reviewing my calorie logs, I think I need to up my protein.", status: "draft", created_at: new Date(Date.now() - 172800000).toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPost) return;
    setSubmitting(true);
    try {
      await api.post("/client/posts/", { content: newPost });
      alert("Post submitted and is pending moderation!");
      setNewPost("");
      setPosts([{ id: Math.random(), content: newPost, status: "draft", created_at: new Date().toISOString() }, ...posts]);
    } catch (err) {
      alert("Mock post submitted!");
      setNewPost("");
      setPosts([{ id: Math.random(), content: newPost, status: "draft", created_at: new Date().toISOString() }, ...posts]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Community</h1>
        <p className="text-muted-foreground">Share your journey, ask questions, and inspire others.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <textarea 
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="What's on your mind? Share your progress..." 
              className="w-full min-h-[100px] p-4 text-sm rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-all"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newPost || submitting} className="rounded-lg px-6">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Share Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground tracking-wide border-b border-border pb-2">My Posts</h2>
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">You haven't shared anything yet.</p>
        ) : (
          posts.map(post => (
            <Card key={post.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                      Me
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Souki</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${post.status === 'approved' ? 'bg-accent text-primary' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500'}`}>
                    {post.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="px-5 py-3 border-t border-border flex gap-4 bg-muted/50">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" /> 0 Likes
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" /> 0 Comments
                </button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
