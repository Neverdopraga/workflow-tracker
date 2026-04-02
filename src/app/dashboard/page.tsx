"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/useRealtime";
import { logActivity, createNotification } from "@/lib/activity";
import { useAuth } from "@/lib/AuthContext";
import type { Task } from "@/lib/types";
import Topbar from "@/components/Topbar";
import StatsCards from "@/components/StatsCards";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import SupervisorGrid from "@/components/SupervisorGrid";
import StatusChart from "@/components/StatusChart";
import PinModal from "@/components/PinModal";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Plus, Download, Upload, Filter } from "lucide-react";


export default function DashboardPage() {
  const { toast } = useToast();
  const { isManager, login } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [connection, setConnection] = useState<"live" | "offline" | "connecting">("connecting");
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSup, setFilterSup] = useState("All");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tr, sr] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("supervisors").select("*").order("name"),
      ]);
      if (tr.error) throw tr.error;
      if (sr.error) throw sr.error;
      setTasks(tr.data || []);
      setSupervisors((sr.data || []).map((s) => s.name));
      setConnection("live");
    } catch { setConnection("offline"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    if (taskModalOpen || detailTask) return; // pause auto-refresh while modal is open
    const i = setInterval(loadData, 30000);
    return () => clearInterval(i);
  }, [loadData, taskModalOpen, detailTask]);

  useRealtime("tasks", useCallback((payload) => {
    if (payload.eventType === "INSERT") setTasks((p) => [payload.new as Task, ...p]);
    else if (payload.eventType === "UPDATE") setTasks((p) => p.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
    else if (payload.eventType === "DELETE") setTasks((p) => p.filter((t) => t.id !== (payload.old as { id: string }).id));
  }, []));

  useEffect(() => {
    const off = () => setConnection("offline");
    const on = () => loadData();
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, [loadData]);

  const filtered = tasks.filter(
    (t) => (filterStatus === "All" || t.status === filterStatus) && (filterSup === "All" || t.supervisor === filterSup)
  );

  const handleStatusChange = async (id: string, status: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: status as Task["status"] } : t)));
    await supabase.from("tasks").update({ status }).eq("id", id);
    toast("Status updated", "success");
    if (task) {
      await logActivity(id, "status_changed", `${task.status} → ${status}`, isManager ? "Manager" : "Supervisor");
      await createNotification(`"${task.task}" status → ${status}`, "info", id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const task = tasks.find((t) => t.id === id);
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
    toast("Task deleted", "success");
    if (task) await createNotification(`Task "${task.task}" deleted`, "warning");
  };

  const handleSave = async (data: Omit<Task, "id" | "created_at">) => {
    if (editingTask) {
      const { data: updated, error } = await supabase.from("tasks").update(data).eq("id", editingTask.id).select().single();
      if (!error && updated) { setTasks((p) => p.map((t) => (t.id === editingTask.id ? updated : t))); toast("Task updated", "success");
        await logActivity(editingTask.id, "updated", `Updated "${data.task}"`, "Manager"); }
      else toast("Update failed", "error");
    } else {
      const { data: created, error } = await supabase.from("tasks").insert(data).select().single();
      if (!error && created) { setTasks((p) => [created, ...p]); toast("Task created", "success");
        await logActivity(created.id, "created", `Created "${data.task}"`, "Manager");
        await createNotification(`New task "${data.task}" → ${data.supervisor}`, "success", created.id); }
      else toast("Creation failed", "error");
    }
    setTaskModalOpen(false); setEditingTask(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ tasks, supervisors, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `workflow-${new Date().toISOString().split("T")[0]}.json`; a.click();
    toast("Exported", "success");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!d.tasks || !d.supervisors) { alert("Invalid file."); return; }
      if (!confirm(`Import ${d.tasks.length} tasks?`)) return;
      for (const name of d.supervisors) { if (!supervisors.includes(name)) await supabase.from("supervisors").upsert({ name }, { onConflict: "name" }); }
      for (const t of d.tasks) { const { id, created_at, updated_at, ...rest } = t; await supabase.from("tasks").insert(rest); }
      await loadData(); toast("Import complete", "success");
    } catch { toast("Import failed", "error"); }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar onLoginClick={() => setPinModalOpen(true)} />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {loading ? <DashboardSkeleton /> : (
          <>
            <StatsCards tasks={tasks} activeFilter={filterStatus} onFilter={setFilterStatus} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900 mr-auto">Tasks <span className="text-gray-400 font-medium ml-2 text-sm">({filtered.length})</span></h2>
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select value={filterSup} onChange={(e) => setFilterSup(e.target.value)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-white text-gray-700 cursor-pointer focus:outline-none">
                      <option value="All">All Supervisors</option>
                      {supervisors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {isManager && (
                    <>
                      <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                        <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span></button>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Import</span>
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} /></label>
                      <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl transition shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> New Task</button>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  {filtered.length ? filtered.map((t) => (
                    <TaskCard key={t.id} task={t} canEdit={isManager} canDelete={isManager} canChangeStatus={true}
                      onStatusChange={handleStatusChange}
                      onEdit={(task) => { setEditingTask(task); setTaskModalOpen(true); }}
                      onDelete={handleDelete} onViewDetail={(task) => setDetailTask(task)} />
                  )) : (
                    <div className="bg-white rounded-2xl border border-border p-12 text-center">
                      <p className="text-3xl mb-3">📭</p><p className="text-sm text-gray-400 font-medium">No tasks found</p></div>
                  )}
                </div>
              </div>
              <div className="space-y-4"><StatusChart tasks={tasks} /></div>
            </div>
            <SupervisorGrid supervisors={supervisors} tasks={tasks} />
          </>
        )}
      </div>

      <TaskModal open={taskModalOpen} task={editingTask} supervisors={supervisors} roleName="Manager"
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }} onSave={handleSave} />
      <TaskDetailModal open={!!detailTask} task={detailTask} onClose={() => setDetailTask(null)} roleName={isManager ? "Manager" : "Supervisor"} />
      <PinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)}
        onSubmit={(pin) => { const ok = login(pin); if (ok) { setPinModalOpen(false); toast("Welcome, Manager!", "success"); } return ok; }} />
    </div>
  );
}
