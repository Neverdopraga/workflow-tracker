export interface Task {
  id: string;
  task: string;
  supervisor: string;
  priority: "High" | "Medium" | "Low";
  due_date: string;
  status: "Pending" | "Done" | "Delayed";
  follow_up: string | null;
  location: string | null;
  location_gps: string | null;
  created_by: string;
  created_at: string;
}

export interface Supervisor {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  related_task_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author: string;
  message: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string | null;
  action: string;
  details: string | null;
  actor: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  name: string;
  pin: string;
  permissions: string[];
  created_at: string;
}

export type Role = "admin" | "manager" | "supervisor";

export interface LeaveRequest {
  id: string;
  employee_name: string;
  leave_type: "Casual" | "Sick" | "Earned" | "Compensatory" | "Other";
  from_date: string;
  to_date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approved_by: string | null;
  created_at: string;
}

export const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Compensatory", "Other"] as const;
export const LEAVE_STATUSES = ["Pending", "Approved", "Rejected"] as const;

export const STATUSES = ["Pending", "Done", "Delayed"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  supervisor: "Supervisor",
};

export function hasPermission(permissions: string[], action: string): boolean {
  return permissions.includes("all") || permissions.includes(action);
}
