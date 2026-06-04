import { api } from "@/lib/api";

export type TicketCategory = "technical" | "inquiry" | "billing" | "feature_request";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketResponse = {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  unread_by_user: boolean;
  unread_by_admin: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type MessageResponse = {
  id: string;
  body: string;
  is_admin_message: boolean;
  sender_name: string | null;
  created_at: string;
};

export type TicketDetailResponse = {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  unread_by_user: boolean;
  created_at: string;
  updated_at: string;
  messages: MessageResponse[];
};

export type AdminTicketResponse = {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  unread_by_admin: boolean;
  user_email: string;
  user_name: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

// ── User API ─────────────────────────────────────────────────────────────────

export function createTicket(category: TicketCategory, subject: string, body: string) {
  return api.post<TicketResponse>("/support/tickets", { category, subject, body });
}

export function getMyTickets(page = 1) {
  return api.get<TicketResponse[]>(`/support/tickets?page=${page}`);
}

export function getTicket(ticketId: string) {
  return api.get<TicketDetailResponse>(`/support/tickets/${ticketId}`);
}

export function sendMessage(ticketId: string, body: string) {
  return api.post<MessageResponse>(`/support/tickets/${ticketId}/messages`, { body });
}

export function getUnreadCount() {
  return api.get<{ count: number }>("/support/unread-count");
}

export function markTicketRead(ticketId: string) {
  return api.post<void>(`/support/tickets/${ticketId}/read`);
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export function adminGetTickets(params?: { status?: string; category?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return api.get<AdminTicketResponse[]>(`/admin/support/tickets${query ? `?${query}` : ""}`);
}

export function adminGetTicket(ticketId: string) {
  return api.get<TicketDetailResponse>(`/admin/support/tickets/${ticketId}`);
}

export function adminReply(ticketId: string, body: string) {
  return api.post<MessageResponse>(`/admin/support/tickets/${ticketId}/messages`, { body });
}

export function adminUpdateStatus(ticketId: string, status: TicketStatus) {
  return api.patch<AdminTicketResponse>(`/admin/support/tickets/${ticketId}/status`, { status });
}

export function adminGetUnreadCount() {
  return api.get<{ count: number }>("/admin/support/unread-count");
}
