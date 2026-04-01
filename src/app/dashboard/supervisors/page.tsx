"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import Topbar from "@/components/Topbar";
import PinModal from "@/components/PinModal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Users } from "lucide-react";
import ManagerOnly from "@/components/ManagerOnly";
const dotColor = { Pending: "bg-amber-400", Done: "bg-emerald-400", Delayed: "bg-red-400" };

export default function SupervisorsPage() {
  const { toast } = useToast();
  const { isManager, login } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [connection, setConnection] = useState<"live" | "offline" | "connecting">("connecting");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [tr, sr] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("supervisors").select("*").order("name"),
      ]);
      if (tr.error) throw tr.error; if (sr.error) throw sr.error;
      setTasks(tr.data || []); setSupervisors((sr.data || []).map((s) => s.name)); setConnection("live");
    } catch { setConnection("offline"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addSupervisor = async () => {
    const name = newName.trim(); if (!name) return;
    if (supervisors.includes(name)) { alert("Already exists."); return; }
    const { error } = await supabase.from("supervisors").insert({ name });
    if (!error) { setSupervisors((p) => [...p, name].sort()); setNewName(""); toast("Supervisor added", "success"); }
    else toast("Failed to add", "error");
  };

  const removeSupervisor = async (name: string) => {
    if (tasks.some((t) => t.supervisor === name) && !confirm(`"${name}" has tasks. Remove anyway?`)) return;
    const { error } = await supabase.from("supervisors").delete().eq("name", name);
    if (!error) { setSupervisors((p) => p.filter((s) => s !== name)); toast("Removed", "success"); }
  };

  return (
    <ManagerOnly>
    <div className="flex flex-col min-h-screen">
      <Topbar onLoginClick={() => setPinModalOpen(true)} />

      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Supervisors</h1>
          <p className="text-sm text-gray-400">{supervisors.length} supervisors</p>
        </div>

        {isManager && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Add New Supervisor</label>
            <div className="flex gap-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSupervisor()}
                placeholder="Enter supervisor name..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
              <button onClick={addSupervisor}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl transition">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        )}

        {supervisors.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisors.map((sup) => {
              const supTasks = tasks.filter((t) => t.supervisor === sup);
              const initials = sup.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={sup} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{sup}</p>
                        <p className="text-xs text-gray-400">{supTasks.length} task{supTasks.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    {isManager && (
                      <button onClick={() => removeSupervisor(sup)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  {supTasks.length > 0 ? (
                    <div className="space-y-2 bg-surface-secondary rounded-xl p-3">
                      {STATUSES.filter((s) => supTasks.some((t) => t.status === s)).map((s) => (
                        <div key={s} className="flex items-center gap-2.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${dotColor[s]}`} />
                          <span className="text-gray-500">{s}</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s === "Pending" ? "bg-amber-400" : s === "Done" ? "bg-emerald-400" : "bg-red-400"}`}
                              style={{ width: `${(supTasks.filter((t) => t.status === s).length / supTasks.length) * 100}%` }} />
                          </div>
                          <span className="font-bold text-gray-700 min-w-[20px] text-right">{supTasks.filter((t) => t.status === s).length}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400 italic">No tasks assigned</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No supervisors yet</p>
          </div>
        )}
      </div>

      <PinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)}
        onSubmit={(pin) => { const ok = login(pin); if (ok) { setPinModalOpen(false); toast("Welcome, Manager!", "success"); } return ok; }} />
    </div>
    </ManagerOnly>
  );
}
