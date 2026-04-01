"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/useRealtime";
import { logActivity, createNotification } from "@/lib/activity";
import { useAuth } from "@/lib/AuthContext";
import type { Task } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import Topbar from "@/components/Topbar";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import PinModal from "@/components/PinModal";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Plus, Filter, Search } from "lucide-react";

export default function TasksPage() {
  const { toast } = useToast();
  const { isManager, login } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [connection, setConnection] = useState<"live" | "offline" | "connecting">("connecting");
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSup, setFilterSup] = useState("All");
  const [search, setSearch] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tr, sr] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("supervisors").select("*").order("name"),
      ]);
      if (tr.error) throw tr.error; if (sr.error) throw sr.error;
      setTasks(tr.data || []); setSupervisors((sr.data || []).map((s) => s.name)); setConnection("live");
    } catch { setConnection("offline"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); const i = setInterval(loadData, 30000); return () => clearInterval(i); }, [loadData]);

  useRealtime("tasks", useCallback((payload) => {
    if (payload.eventType === "INSERT") setTasks((p) => [payload.new as Task, ...p]);
    else if (payload.eventType === "UPDATE") setTasks((p) => p.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
    else if (payload.eventType === "DELETE") setTasks((p) => p.filter((t) => t.id !== (payload.old as { id: string }).id));
  }, []));

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "All" && t.status !== filterStatus) return false;
    if (filterSup !== "All" && t.supervisor !== filterSup) return false;
    if (search && !t.task.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (id: string, status: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: status as Task["status"] } : t)));
    await supabase.from("tasks").update({ status }).eq("id", id);
    toast("Status updated", "success");
    if (task) { await logActivity(id, "status_changed", `${task.status} → ${status}`, isManager ? "Manager" : "Supervisor");
      await createNotification(`"${task.task}" status → ${status}`, "info", id); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id); toast("Task deleted", "success");
  };

  const handleSave = async (data: Omit<Task, "id" | "created_at">) => {
    if (editingTask) {
      const { data: updated, error } = await supabase.from("tasks").update(data).eq("id", editingTask.id).select().single();
      if (!error && updated) { setTasks((p) => p.map((t) => (t.id === editingTask.id ? updated : t))); toast("Task updated", "success"); }
    } else {
      const { data: created, error } = await supabase.from("tasks").insert(data).select().single();
      if (!error && created) { setTasks((p) => [created, ...p]); toast("Task created", "success");
        await logActivity(created.id, "created", `Created "${data.task}"`, "Manager");
        await createNotification(`New task "${data.task}" → ${data.supervisor}`, "success", created.id); }
      else if (error) { toast(`Creation failed: ${error.message}`, "error"); }
    }
    setTaskModalOpen(false); setEditingTask(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar onLoginClick={() => setPinModalOpen(true)} />
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-sm text-gray-400">{tasks.length} total</p></div>
          {isManager && (
            <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl transition shadow-sm">
              <Plus className="w-4 h-4" /> New Task</button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-white rounded-2xl border border-border p-3 sm:p-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
          </div>
          <div className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-white cursor-pointer focus:outline-none">
              <option value="All">All Status</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <select value={filterSup} onChange={(e) => setFilterSup(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-white cursor-pointer focus:outline-none">
            <option value="All">All Supervisors</option>{supervisors.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <span className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="space-y-3">
          {loading ? [...Array(3)].map((_, i) => <TaskCardSkeleton key={i} />) :
            filtered.length ? filtered.map((t) => (
              <TaskCard key={t.id} task={t} canEdit={isManager} canDelete={isManager} canChangeStatus={true}
                onStatusChange={handleStatusChange} onEdit={(task) => { setEditingTask(task); setTaskModalOpen(true); }}
                onDelete={handleDelete} onViewDetail={(task) => setDetailTask(task)} />
            )) : (
              <div className="bg-white rounded-2xl border border-border p-16 text-center">
                <p className="text-4xl mb-3">📭</p><p className="text-sm text-gray-400 font-medium">No tasks found</p></div>
            )}
        </div>
      </div>
      <TaskModal open={taskModalOpen} task={editingTask} supervisors={supervisors} roleName="Manager"
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }} onSave={handleSave} />
      <TaskDetailModal open={!!detailTask} task={detailTask} onClose={() => setDetailTask(null)} roleName={isManager ? "Manager" : "Supervisor"} />
      <PinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)}
        onSubmit={(pin) => { const ok = login(pin); if (ok) { setPinModalOpen(false); toast("Welcome, Manager!", "success"); } return ok; }} />
    </div>
  );
}
