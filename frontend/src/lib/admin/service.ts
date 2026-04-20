"use client";

import api from "@/lib/api";

type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T;
};

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "client" | "nutritionist" | "high_admin";
  is_active: boolean;
  date_joined: string;
}

export interface PendingNutritionist {
  id: number;
  username: string;
  email: string;
  bio?: string;
  nutritionist?: {
    specialization?: { name?: string };
    years_experience?: number;
    certification_ref?: string;
    cert_image_url?: string;
  };
}

export interface ModerationPlan {
  id: number;
  title: string;
  plan_type: "private-custom" | "public-predefined";
  status: "pending" | "approved" | "rejected";
  price: number;
  created_at: string;
}

export interface ModerationPost {
  id: number;
  title: string;
  author?: string;
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
}

export interface BlogArticle {
  id: number;
  title: string;
  cover_image?: string;
  content: string;
  tags?: string[];
  created_at?: string;
}

export interface InquiryTicket {
  id: number;
  subject: string;
  message: string;
  status: "open" | "resolved";
  admin_response?: string;
  created_at?: string;
}

const unwrapEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === "object" && "status" in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get("/admin/users/");
  const data = unwrapEnvelope<AdminUser[] | { results?: AdminUser[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getPendingNutritionists(): Promise<PendingNutritionist[]> {
  const response = await api.get("/admin/nutritionists/pending/");
  const data = unwrapEnvelope<PendingNutritionist[] | { results?: PendingNutritionist[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function approveNutritionist(id: number): Promise<void> {
  await api.post(`/admin/nutritionists/${id}/approve/`);
}

export async function rejectNutritionist(id: number, rejection_reason: string): Promise<void> {
  await api.post(`/admin/nutritionists/${id}/reject/`, { rejection_reason });
}

export async function getModerationPlans(): Promise<ModerationPlan[]> {
  const response = await api.get("/admin/plans/");
  const data = unwrapEnvelope<ModerationPlan[] | { results?: ModerationPlan[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getModerationPosts(): Promise<ModerationPost[]> {
  const response = await api.get("/admin/posts/");
  const data = unwrapEnvelope<ModerationPost[] | { results?: ModerationPost[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getBlogArticles(): Promise<BlogArticle[]> {
  const response = await api.get("/admin/blog/");
  const data = unwrapEnvelope<BlogArticle[] | { results?: BlogArticle[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function createBlogArticle(payload: Pick<BlogArticle, "title" | "content"> & { cover_image?: string; tags?: string[] }): Promise<void> {
  await api.post("/admin/blog/", payload);
}

export async function getAdminInquiries(): Promise<InquiryTicket[]> {
  const response = await api.get("/admin/inquiries/");
  const data = unwrapEnvelope<InquiryTicket[] | { results?: InquiryTicket[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}
