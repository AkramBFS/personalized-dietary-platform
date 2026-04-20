"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import {
  createBlogArticle,
  getBlogArticles,
  type BlogArticle,
} from "@/lib/admin";

const mockArticles: BlogArticle[] = [
  {
    id: 1,
    title: "How to Build Sustainable Meal Habits",
    content:
      "A practical guide for clients to build consistent nutrition habits with simple weekly planning.",
    tags: ["habits", "meal-planning"],
    created_at: "2026-04-03T00:00:00Z",
  },
  {
    id: 2,
    title: "Understanding Macronutrients for Beginners",
    content:
      "A beginner-friendly breakdown of proteins, fats, and carbohydrates with examples.",
    tags: ["education", "macros"],
    created_at: "2026-04-06T00:00:00Z",
  },
];

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>(mockArticles);
  const [editorOpen, setEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        await getBlogArticles();
      } catch {
        // Intentionally ignored for now: UI uses static mock data.
      }
    };
    void load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createBlogArticle({
        title: title.trim(),
        content: content.trim(),
        cover_image: coverImage.trim() || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setArticles((prev) => [
        {
          id: Date.now(),
          title: title.trim(),
          content: content.trim(),
          cover_image: coverImage.trim() || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Article created (mock UI).");
      setEditorOpen(false);
      setTitle("");
      setContent("");
      setCoverImage("");
      setTags("");
    } catch {
      // Keep the flow usable while backend is pending.
      setArticles((prev) => [
        {
          id: Date.now(),
          title: title.trim(),
          content: content.trim(),
          cover_image: coverImage.trim() || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Article created locally (mock UI).");
      setEditorOpen(false);
      setTitle("");
      setContent("");
      setCoverImage("");
      setTags("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground mt-1">
            Publish and manage articles shown on the platform.
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setEditorOpen(true)}
        >
          New Article
        </Button>
      </div>

      {/* Article Cards - Now in a responsive grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Card
            key={article.id}
            className="hover:shadow-md transition-all flex flex-col"
          >
            <CardHeader>
              <CardTitle className="text-lg leading-tight">
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {article.content}
              </p>
              <div className="flex gap-2 flex-wrap pt-2">
                {(article.tags ?? []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="font-normal text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background dark:bg-slate-900 border border-border rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  New Article
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Draft and publish a new blog post.
                </p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Article Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 10 Tips for Better React Components"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Image URL</label>
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, web-dev, tutorial (comma-separated)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Article Content</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Markdown supported
                  </span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your article here..."
                  className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={submitting}
                onClick={handleCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Publishing..." : "Publish Article"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
