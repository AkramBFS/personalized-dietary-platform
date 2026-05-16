"use client";

import {
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Send,
  X,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getCommunityPosts,
  deleteCommunityPost,
  postComment,
  CommunityPost,
  CommunityComment,
  resolveApiUrl,
} from "@/lib/api";
import {
  postCreateCommunityPost,
  getClientOwnPosts,
} from "@/lib/client/service";
import { getProfileIdentity, CurrentProfileIdentity } from "@/lib/profile";

// ─── User Profile Modal ───────────────────────────────────────────────────────

interface UserStats {
  username: string;
  postCount: number;
  commentCount: number;
  lastActive: string | null;
}

function UserProfileModal({
  user,
  onClose,
}: {
  user: UserStats;
  onClose: () => void;
}) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&size=128`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src={avatarUrl}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-border shadow-sm"
          />
          <div>
            <p className="text-lg font-bold text-foreground">{user.username}</p>
            <p className="text-xs text-muted-foreground">Community Member</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <div className="bg-muted/50 rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-foreground">{user.postCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Posts</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-foreground">{user.commentCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Comments</p>
            </div>
          </div>

          {user.lastActive && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last active{" "}
                {new Date(user.lastActive).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Clickable User Avatar / Name ─────────────────────────────────────────────

function UserChip({
  username,
  onClick,
}: {
  username: string;
  onClick: () => void;
}) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=64`;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 group focus:outline-none"
    >
      <img
        src={avatarUrl}
        alt={username}
        className="w-8 h-8 rounded-full border border-border shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all"
      />
      <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
        {username}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommunityComponent() {
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentProfileIdentity | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");

  // New post
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentingPostId, setCommentingPostId] = useState<number | null>(null);

  // Profile modal
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [communityPosts, profile] = await Promise.all([
        getCommunityPosts(),
        getProfileIdentity().catch(() => null),
      ]);
      setAllPosts(communityPosts);
      setCurrentUser(profile);
    } catch (err) {
      console.error("Error fetching community data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const sortedPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return sortBy === "recent" ? tB - tA : tA - tB;
    });
  }, [allPosts, sortBy]);

  const topContributors = useMemo(() => {
    const postCounts: Record<string, number> = {};
    allPosts.forEach((p) => {
      postCounts[p.author_username] = (postCounts[p.author_username] || 0) + 1;
    });
    return Object.entries(postCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [allPosts]);

  const buildUserStats = useCallback(
    (username: string): UserStats => {
      const userPosts = allPosts.filter((p) => p.author_username === username);
      const commentCount = allPosts.reduce((acc, p) => {
        return acc + (p.comments?.filter((c) => c.author_username === username).length ?? 0);
      }, 0);
      const dates: string[] = [
        ...userPosts.map((p) => p.created_at),
        ...allPosts.flatMap(
          (p) => p.comments?.filter((c) => c.author_username === username).map((c) => c.created_at) ?? []
        ),
      ];
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return {
        username,
        postCount: userPosts.length,
        commentCount,
        lastActive: dates[0] ?? null,
      };
    },
    [allPosts]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNewPostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      setNewPostImagePreview(URL.createObjectURL(file));
    }
  };

  const removeNewPostImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText && !newPostImage) return;
    setSubmittingPost(true);
    try {
      await postCreateCommunityPost({ content: newPostText, image: newPostImage });
      setNewPostText("");
      removeNewPostImage();
      // Reload the feed so the new post appears (pending moderation)
      const refreshed = await getCommunityPosts();
      setAllPosts(refreshed);
    } catch (err) {
      console.error("Failed to create post", err);
      alert("Failed to submit post. Please try again.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteCommunityPost(id);
      setAllPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete post", err);
      alert("Could not delete post.");
    }
  };

  const handlePostComment = async (postId: number) => {
    const text = commentTexts[postId] ?? "";
    if (!text.trim()) return;
    setCommentingPostId(postId);
    try {
      const responseComment = await postComment(postId, { content: text });
      const newComment: CommunityComment = {
        ...responseComment,
        author_username:
          responseComment.author_username || currentUser?.username || "Unknown",
        created_at: responseComment.created_at || new Date().toISOString(),
      };
      setAllPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [...(p.comments ?? []), newComment] }
            : p
        )
      );
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post comment.");
    } finally {
      setCommentingPostId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your wellness journey, ask questions, and connect with others.
          </p>
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Sort:</span>
          <button
            onClick={() => setSortBy("recent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              sortBy === "recent"
                ? "bg-secondary text-foreground border-border"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Most Recent
          </button>
          <button
            onClick={() => setSortBy("oldest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              sortBy === "oldest"
                ? "bg-secondary text-foreground border-border"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Oldest First
          </button>
        </div>

        {/* Main layout: Feed + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: Post Feed ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Create Post */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-1">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-9 h-9 rounded-full border border-border object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="What's on your mind? Share your progress..."
                    rows={3}
                    className="flex-1 p-3 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-all"
                  />
                </div>

                {newPostImagePreview && (
                  <div className="relative inline-block w-max ml-12">
                    <img
                      src={newPostImagePreview}
                      alt="Preview"
                      className="max-h-44 rounded-lg object-contain border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeNewPostImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pl-12">
                  <label className="cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-medium">
                    <ImageIcon className="w-4 h-4" />
                    <span>Attach Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewPostImageChange}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={(!newPostText.trim() && !newPostImage) || submittingPost}
                    className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingPost ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post
                  </button>
                </div>
              </form>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="py-16 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Loading posts...</span>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No posts yet. Be the first to share something!
              </div>
            ) : (
              sortedPosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                const isOwn = currentUser?.username === post.author_username;
                const commentText = commentTexts[post.id] ?? "";

                return (
                  <article
                    key={post.id}
                    className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Post header */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserChip
                            username={post.author_username}
                            onClick={() => setSelectedUser(buildUserStats(post.author_username))}
                          />
                          <span className="text-muted-foreground text-xs shrink-0">·</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-border">
                          <img
                            src={resolveApiUrl(post.image_url)}
                            alt="Post attachment"
                            className="w-full max-h-80 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Post footer */}
                    <div className="px-5 py-3 border-t border-border flex items-center gap-4 bg-muted/30">
                      <button
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {post.comments?.length ?? 0} Comment{(post.comments?.length ?? 0) !== 1 ? "s" : ""}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="px-5 py-4 border-t border-border flex flex-col gap-4 bg-background/50">
                        {/* Comment list */}
                        {(post.comments?.length ?? 0) > 0 ? (
                          <div className="flex flex-col gap-3">
                            {post.comments!.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <button
                                  onClick={() =>
                                    setSelectedUser(buildUserStats(comment.author_username))
                                  }
                                  className="shrink-0 focus:outline-none"
                                >
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_username)}&background=random&size=64`}
                                    alt={comment.author_username}
                                    className="w-7 h-7 rounded-full border border-border hover:ring-2 hover:ring-primary transition-all"
                                  />
                                </button>
                                <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2.5 border border-border/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <button
                                      onClick={() =>
                                        setSelectedUser(buildUserStats(comment.author_username))
                                      }
                                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
                                    >
                                      {comment.author_username}
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(comment.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No comments yet. Be the first!
                          </p>
                        )}

                        {/* Add comment */}
                        {currentUser ? (
                          <div className="flex gap-2 items-end pt-1">
                            {currentUser.avatarUrl ? (
                              <img
                                src={currentUser.avatarUrl}
                                alt={currentUser.username}
                                className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 flex gap-2 items-end">
                              <textarea
                                value={commentText}
                                onChange={(e) =>
                                  setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    void handlePostComment(post.id);
                                  }
                                }}
                                placeholder="Write a comment… (Enter to send)"
                                rows={1}
                                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                              />
                              <button
                                onClick={() => void handlePostComment(post.id)}
                                disabled={!commentText.trim() || commentingPostId === post.id}
                                className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                              >
                                {commentingPostId === post.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Please log in to comment.
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* ── Right: Sidebar ────────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-5">

            {/* About */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                About This Community
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                A supportive space for discussing general wellness, sharing evidence-based
                practices, and supporting each other on the journey to better health.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created Jan 2021</span>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-foreground text-sm mb-3">Community Rules</h3>
              <ol className="list-decimal pl-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
                <li>Be respectful and supportive.</li>
                <li>No medical advice — consult a professional.</li>
                <li>Keep discussions evidence-based.</li>
                <li>No self-promotion or spam.</li>
              </ol>
            </div>

            {/* Top Contributors */}
            {topContributors.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-foreground text-sm mb-3">Top Contributors</h3>
                <ul className="space-y-3">
                  {topContributors.map((u, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUser(buildUserStats(u.name))}
                        className="flex items-center gap-3 w-full text-left group focus:outline-none"
                      >
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=64`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-border group-hover:ring-2 group-hover:ring-primary transition-all"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {u.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.count} post{u.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </aside>
        </div>
      </div>
    </>
  );
}
