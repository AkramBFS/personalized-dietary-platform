"use client";

import {
  CalendarDays,
  Facebook,
  Twitter,
  Linkedin,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getBlogPost, BlogPost, parseBlogPostIdFromSlug } from "@/lib/api";

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

// Related posts are kept static per instructions to repurpose UI but data isn't available
const relatedPosts = [
  {
    title: "5 Simple Ways to Boost Your Immune System Naturally",
    image: "https://placehold.co/100x100?text=Immunity",
  },
  {
    title: "Understanding Food Intolerances vs. Allergies",
    image: "https://placehold.co/100x100?text=Food+Info",
  },
  {
    title: "Meal Prep Made Easy: Healthy Recipes for Busy Weeks",
    image: "https://placehold.co/100x100?text=Meal+Prep",
  },
];

interface BlogPostProps {
  slug: string;
}

export default function SingleBlogPostPageComponent({ slug }: BlogPostProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const fetchPost = async () => {
      const id = parseBlogPostIdFromSlug(slug);
      if (!id) {
        setError("Invalid blog post URL.");
        setLoading(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);
      setError(null);

      try {
        const data = await getBlogPost(id);
        if (requestId !== requestIdRef.current) return;
        setPost(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError("We couldn't load this article right now.");
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    };

    void fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          Loading article...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-background text-foreground min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-3xl p-10 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-foreground mb-4">
            Article unavailable
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't find the requested article."}
          </p>
          <a
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Blog
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      {/* Left Column (Main Article Content - Scrollable) */}
      <section className="md:col-span-8 flex flex-col gap-8 mt-1">
        {/* Feature Image */}
        <div className="w-full h-auto overflow-hidden rounded-2xl shadow-lg">
          <img
            src={FALLBACK_IMAGE_URL}
            alt="Feature for blog post"
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Category Tag */}
        <span className="inline-block bg-muted text-primary text-sm font-bold px-4 py-1.5 rounded-full w-max border border-primary/10 tracking-wide uppercase">
          Article
        </span>

        {/* Article Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground border-y border-border py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-base md:prose-lg max-w-none text-muted-foreground leading-relaxed flex flex-col gap-6">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      </section>

      {/* Right Column (Sticky Sidebar) */}
      <aside className="md:col-span-4 sticky top-2 flex flex-col gap-10">
        {/* Follow Me Section */}
        <div className="flex flex-col gap-6 p-2">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">
            FOLLOW FOR MORE TIPS
          </h2>
          <div className="flex gap-4">
            {[
              { icon: Facebook, label: "Facebook" },
              { icon: Twitter, label: "Twitter" },
              { icon: Linkedin, label: "LinkedIn" },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={`Follow us on ${social.label}`}
                className="p-3 bg-muted rounded-full text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Read More Section (Recent Posts adaptation) */}
        <div className="flex flex-col gap-6 p-2">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">
            RECENT ARTICLES
          </h2>
          <div className="flex flex-col gap-5">
            {relatedPosts.map((post, index) => (
              <a href="#" key={index} className="flex items-center gap-4 group">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <h4 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h4>
              </a>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
