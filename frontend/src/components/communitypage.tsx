"use client";

import {
  Users,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Flame,
  Shuffle,
  ImageIcon,
  X,
  Send,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  getCommunityPosts,
  deleteCommunityPost,
  postComment,
  CommunityPost,
  resolveApiUrl,
} from "@/lib/api";
import { getProfileIdentity, CurrentProfileIdentity } from "@/lib/profile";

export default function CommunityComponent() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentProfileIdentity | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<number | null>(null);

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    }
  };

  const removeCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const handlePostComment = async (postId: number) => {
    if (!commentText && !commentImage) return;
    setCommentingPostId(postId);
    try {
      const responseComment = await postComment(postId, { content: commentText, image: commentImage });
      
      const newComment: CommunityComment = {
        ...responseComment,
        author_username: responseComment.author_username || (responseComment as any).username || currentUser?.username || "Unknown",
        created_at: responseComment.created_at || new Date().toISOString(),
      };

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...(p.comments || []), newComment],
            };
          }
          return p;
        })
      );
      setCommentText("");
      removeCommentImage();
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post comment.");
    } finally {
      setCommentingPostId(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [fetchedPosts, profile] = await Promise.all([
          getCommunityPosts(),
          getProfileIdentity().catch(() => null),
        ]);
        setPosts(fetchedPosts);
        setCurrentUser(profile);
      } catch (error) {
        console.error("Error fetching community data", error);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteCommunityPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete post", error);
      alert("Could not delete post.");
    }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (sortBy === "recent") return timeB - timeA;
      return timeA - timeB;
    });
  }, [posts, sortBy]);

  const topContributors = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      counts[p.author_username] = (counts[p.author_username] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        rep: `${count} post${count === 1 ? "" : "s"}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      }));
  }, [posts]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">
      {/* Left Sidebar - Navigation & Filters */}
      <aside className="w-full lg:w-64 hidden lg:flex flex-col gap-4 shrink-0 mt-8">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col gap-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">
            Sort By
          </h3>
          <button
            onClick={() => setSortBy("recent")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-colors ${sortBy === "recent" ? "bg-secondary text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Clock className="w-5 h-5" />
            Most Recent
          </button>
          <button
            onClick={() => setSortBy("oldest")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-colors ${sortBy === "oldest" ? "bg-secondary text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Clock className="w-5 h-5" />
            Oldest First
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full mt-8">
        {/* Community Header */}
        <div className="bg-card rounded-xl border border-border p-8 mb-8 flex items-start justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary"></div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              General Wellness Discussion
            </h2>
            <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              124.5k Members
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Join
          </button>
        </div>

        {/* Posts Feed */}
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              Loading posts...
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No posts found.
            </div>
          ) : (
            sortedPosts.map((post) => (
              <article
                key={post.id}
                className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300"
              >
                {/* Post Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <span className="font-bold text-foreground">
                        {post.author_username}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {currentUser?.username === post.author_username && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-base text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.image_url && (
                    <div className="mb-4">
                      <img
                        src={resolveApiUrl(post.image_url)}
                        alt="Post content"
                        className="max-h-96 rounded-lg object-contain"
                      />
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <button 
                      onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                      className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-semibold"
                    >
                      <MessageSquare className="w-[18px] h-[18px]" />
                      {post.comments?.length || 0} Comments
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedPostId === post.id && (
                    <div className="mt-6 pt-6 border-t border-border flex flex-col gap-4">
                      {/* Comment List */}
                      {post.comments && post.comments.length > 0 ? (
                        <div className="flex flex-col gap-4 mb-4">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold uppercase text-muted-foreground">
                                {comment.author_username?.[0] || "?"}
                              </div>
                              <div className="flex-1 bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-foreground text-sm">{comment.author_username}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
                                {comment.image_url && (
                                  <div className="mt-2">
                                    <img src={resolveApiUrl(comment.image_url)} alt="Comment attachment" className="max-h-40 rounded-lg object-contain" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-4">No comments yet. Be the first to comment!</p>
                      )}

                      {/* Add Comment */}
                      {currentUser ? (
                        <div className="flex flex-col gap-3">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full min-h-[80px] p-3 text-sm rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                          />
                          {commentImagePreview && (
                            <div className="relative inline-block w-max">
                              <img src={commentImagePreview} alt="Preview" className="max-h-32 rounded-lg object-contain border border-border" />
                              <button type="button" onClick={removeCommentImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <label className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                              <ImageIcon className="w-4 h-4" />
                              <span>Attach Image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleCommentImageChange} />
                            </label>
                            <button
                              onClick={() => handlePostComment(post.id)}
                              disabled={(!commentText && !commentImage) || commentingPostId === post.id}
                              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                              {commentingPostId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Post Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Please log in to leave a comment.</p>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Community Info */}
      <aside className="mt-8 w-full lg:w-80 hidden lg:flex flex-col gap-6 shrink-0">
        {/* About Community */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            About Community
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A supportive space for discussing general wellness, sharing
            evidence-based practices, and supporting each other on the journey
            to better health. We focus on holistic well-being, including
            physical, mental, and emotional health.
          </p>
          <div className="flex flex-col gap-2 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Created Jan 2021
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Community Rules
          </h3>
          <ol className="list-decimal pl-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
            <li>Be respectful and supportive.</li>
            <li>No medical advice - consult a professional.</li>
            <li>Keep discussions evidence-based where possible.</li>
            <li>No self-promotion or spam.</li>
          </ol>
        </div>

        {/* Top Contributors */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Top Contributors
          </h3>
          <ul className="space-y-4">
            {topContributors.map((user, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <img
                  alt={`${user.name} avatar`}
                  className="w-10 h-10 rounded-full bg-muted border border-border"
                  src={user.avatar}
                />
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {user.name}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {user.rep}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
