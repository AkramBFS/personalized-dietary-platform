"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Check, X, AlertCircle } from "lucide-react";
import { getModerationPosts, approvePost, rejectPost, deletePost, type ModerationPost } from "@/lib/admin";

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ModerationPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModerationPosts();
      setPosts(data);
    } catch (err: any) {
      console.error("Failed to load posts", err);
      setError("Failed to load posts. Please try again.");
      toast.error("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  // FIXED: No longer calls API. Uses the post data already available in state.
  const handleViewPost = (post: ModerationPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleApprovePost = async (postId: number) => {
    setSubmitting(true);
    try {
      await approvePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "approved" } : p)),
      );
      setIsModalOpen(false);
      setSelectedPost(null);
      toast.success("Post approved successfully.");
    } catch (error: any) {
      console.error("Failed to approve post", error);
      const message =
        error.response?.data?.message || "Failed to approve post.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPost = async (postId: number) => {
    setSubmitting(true);
    try {
      await rejectPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "rejected" } : p)),
      );
      setIsModalOpen(false);
      setSelectedPost(null);
      toast.success("Post rejected.");
    } catch (error: any) {
      console.error("Failed to reject post", error);
      const message = error.response?.data?.message || "Failed to reject post.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    setSubmitting(true);
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setIsModalOpen(false);
      setSelectedPost(null);
      toast.success("Post deleted successfully.");
    } catch (error: any) {
      console.error("Failed to delete post", error);
      const message = error.response?.data?.message || "Failed to delete post.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Content Moderation
        </h1>
        <p className="text-muted-foreground mt-1">
          Review community posts for policy compliance.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => void loadPosts()}
              >
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Table>{/* Skeleton logic stays same... */}</Table>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-foreground font-medium">
                No posts to moderate
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {post.content}
                    </TableCell>
                    <TableCell>{post.author_username}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          post.status === "approved"
                            ? "text-primary border-primary/30"
                            : post.status === "rejected"
                              ? "text-destructive border-destructive/30"
                              : "text-amber-600 border-amber-300"
                        }
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPost(post)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Post Review</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPost.author_username}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Posted</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPost.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDeletePost(selectedPost.id)}
                    disabled={submitting}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectPost(selectedPost.id)}
                    disabled={submitting}
                  >
                    Hide/Reject
                  </Button>
                  <Button
                    onClick={() => handleApprovePost(selectedPost.id)}
                    disabled={submitting || selectedPost.status === "approved"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
