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
import { getModerationPosts, type ModerationPost } from "@/lib/admin";
import api from "@/lib/api";

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ModerationPost | null>(null);
  const [postDetails, setPostDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
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

  const handleViewPost = async (post: ModerationPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/admin/posts/${post.id}/`);
      setPostDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch post details", error);
      toast.error("Failed to load post details.");
      setPostDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprovePost = async (postId: number) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/posts/${postId}/`, { status: "approved" });
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
      await api.patch(`/admin/posts/${postId}/`, { status: "rejected" });
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
      await api.delete(`/admin/posts/${postId}/`);
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
          Review community posts for policy compliance and manage inappropriate
          content.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-500/10">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
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

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No posts to moderate
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                All community posts have been reviewed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.author ?? "Unknown"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          post.status === "approved"
                            ? "text-emerald-600 border-emerald-200"
                            : post.status === "rejected"
                              ? "text-red-600 border-red-200"
                              : "text-yellow-600 border-yellow-200"
                        }
                      >
                        {post.status ?? "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : "N/A"}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">
                Post Review - {selectedPost?.title}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : postDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <p className="text-sm text-muted-foreground">
                        {postDetails.title}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Author</label>
                      <p className="text-sm text-muted-foreground">
                        {postDetails.author}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground capitalize">
                        {postDetails.status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Posted</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(postDetails.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-4 rounded-md max-h-60 overflow-y-auto">
                      {postDetails.content}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleDeletePost(selectedPost!.id)}
                      disabled={submitting}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectPost(selectedPost!.id)}
                      disabled={submitting}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                    <Button
                      onClick={() => handleApprovePost(selectedPost!.id)}
                      disabled={submitting}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Failed to load post details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
