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
  created_at: string;
}

export interface PendingNutritionist {
  id: number;
  username: string;
  email: string;
  nutritionist_id: number;
  specialization_name?: string;
  country_name?: string;
  years_experience?: number;
  consultation_price?: number;
  bio?: string;
  certification_ref?: string;
  cert_image_url?: string;
  approval_status: string;
  rejection_reason?: string | null;
  languages?: string[];
  created_at: string;
}

export interface ModerationPlan {
  id: number;
  title: string;
  plan_type: "private-custom" | "public-predefined";
  status: "pending" | "approved" | "rejected";
  price: number;
  category?: string;
  created_at: string;
}

export interface ModerationPost {
  id: number;
  author_username: string; // Matches API
  content: string;         // Matches API
  image_url: string | null;
  status: "draft" | "approved" | "rejected"; // Matches API "status"
  is_approved: boolean;    // Matches API
  created_at: string;      // Matches API
  title?: string;          // Kept as optional if some posts have titles
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

export interface DashboardStats {
  total_users: number;
  total_clients: number;
  total_nutritionists: number;
  pending_approvals: number;
  pending_plans: number;
  unresolved_inquiries: number;
  recent_activity: { id: number; text: string; created_at: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get("/lookup/admin/dashboard/");
  const raw = unwrapEnvelope(response.data) as any;
  
  // Map API response to interface
  return {
    total_users: raw.users?.total ?? 0,
    total_clients: raw.users?.clients ?? 0,
    total_nutritionists: raw.users?.nutritionists ?? 0,
    pending_approvals: raw.pending_approvals ?? 0,
    pending_plans: raw.pending_plans ?? 0,
    unresolved_inquiries: raw.unresolved_inquiries ?? 0,
    recent_activity: [], // Backend doesn't provide this yet, keep empty for now
  };
}

export interface AdminUserDetail extends AdminUser {
  client?: {
    age: number;
    weight: number;
    height: number;
    bmi: number;
    bmr: number;
    goal?: { name: string };
    health_history?: string;
  };
  nutritionist?: {
    bio: string;
    years_experience: number;
    consultation_price: number;
    specialization?: { name: string };
  };
}

const unwrapEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === "object" && "status" in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get("/lookup/admin/users/");
  const data = unwrapEnvelope<AdminUser[] | { results?: AdminUser[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getAdminUserDetail(id: number): Promise<AdminUserDetail> {
  const response = await api.get(`/lookup/admin/users/${id}/`);
  return unwrapEnvelope(response.data);
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/lookup/admin/users/${id}/delete/`);
}

export async function getPendingNutritionists(): Promise<PendingNutritionist[]> {
  const response = await api.get("/lookup/nutritionists/pending/");
  const data = unwrapEnvelope<PendingNutritionist[] | { results?: PendingNutritionist[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getNutritionistDetail(id: number): Promise<PendingNutritionist> {
  const response = await api.get(`/lookup/nutritionists/${id}/`);
  return unwrapEnvelope(response.data);
}

export async function approveNutritionist(id: number): Promise<void> {
  await api.post(`/lookup/nutritionists/${id}/approve/`);
}

export async function rejectNutritionist(id: number, rejection_reason: string): Promise<void> {
  await api.post(`/lookup/nutritionists/${id}/reject/`, { rejection_reason });
}

export async function reReviewNutritionist(id: number): Promise<void> {
  await api.post(`/lookup/nutritionists/${id}/re-review/`);
}

export async function getModerationPlans(status?: string): Promise<ModerationPlan[]> {
  const response = await api.get("/lookup/admin/plans/", { params: { status } });
  const data = unwrapEnvelope<ModerationPlan[] | { results?: ModerationPlan[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getPlanDetail(id: number): Promise<any> {
  const response = await api.get(`/lookup/admin/plans/${id}/`);
  return unwrapEnvelope(response.data);
}

export async function approvePlan(id: number): Promise<void> {
  await api.post(`/lookup/admin/plans/${id}/approve/`);
}

export async function rejectPlan(id: number, rejection_reason: string): Promise<void> {
  await api.post(`/lookup/admin/plans/${id}/reject/`, { rejection_reason });
}

export async function archivePlan(id: number): Promise<void> {
  await api.post(`/lookup/admin/plans/${id}/archive/`);
}

export async function getModerationPosts(): Promise<ModerationPost[]> {
  const response = await api.get("/lookup/admin/posts/");
  const data = unwrapEnvelope<ModerationPost[] | { results?: ModerationPost[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function approvePost(id: number): Promise<void> {
  await api.patch(`/lookup/admin/posts/${id}/approve/`);
}

export async function rejectPost(id: number): Promise<void> {
  await api.patch(`/lookup/admin/posts/${id}/reject/`);
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/lookup/admin/posts/${id}/`);
}

export async function getBlogArticles(): Promise<BlogArticle[]> {
  const response = await api.get("/blog/");
  const data = unwrapEnvelope<BlogArticle[] | { results?: BlogArticle[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getBlogArticle(id: number): Promise<BlogArticle> {
  const response = await api.get(`/blog/${id}/`);
  return unwrapEnvelope(response.data);
}

export async function createBlogArticle(payload: Pick<BlogArticle, "title" | "content"> & { cover_image?: string; tags?: string[] }): Promise<void> {
  await api.post("/lookup/admin/blog/", payload);
}

export async function updateBlogArticle(id: number, payload: Partial<BlogArticle>): Promise<void> {
  await api.patch(`/lookup/admin/blog/${id}/`, payload);
}

export async function deleteBlogArticle(id: number): Promise<void> {
  await api.delete(`/lookup/admin/blog/${id}/delete/`);
}

export async function getAdminInquiries(status?: string): Promise<InquiryTicket[]> {
  const response = await api.get("/lookup/admin/inquiries/", { params: { status } });
  const data = unwrapEnvelope<InquiryTicket[] | { results?: InquiryTicket[] }>(response.data);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getInquiryDetail(id: number): Promise<any> {
  const response = await api.get(`/lookup/admin/inquiries/${id}/`);
  return unwrapEnvelope(response.data);
}

export async function banUser(id: number, is_banned: boolean): Promise<void> {
  await api.patch(`/lookup/admin/users/${id}/ban/`, { is_banned });
}

export async function respondToInquiry(id: number, admin_response: string, status: string = "resolved"): Promise<void> {
  await api.patch(`/lookup/admin/inquiries/${id}/respond/`, { admin_response, status });
}
