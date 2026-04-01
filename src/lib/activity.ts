import { supabase } from "./supabase";

export async function logActivity(
  taskId: string | null,
  action: string,
  details: string,
  actor: string = "Admin"
) {
  await supabase.from("activity_log").insert({
    task_id: taskId,
    action,
    details,
    actor,
  });
}

export async function createNotification(
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
  relatedTaskId: string | null = null
) {
  await supabase.from("notifications").insert({
    message,
    type,
    related_task_id: relatedTaskId,
  });
}
