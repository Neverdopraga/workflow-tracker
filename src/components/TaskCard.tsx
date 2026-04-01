"use client";

import { Calendar, User, Flag, Pencil, Trash2, MapPin, Eye } from "lucide-react";
import type { Task } from "@/lib/types";
import { STATUSES } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (task: Task) => void;
}

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Delayed: "bg-red-50 text-red-700 border-red-200",
};

const priorityStyles = {
  High: "text-red-600",
  Medium: "text-amber-600",
  Low: "text-gray-400",
};

export default function TaskCard({
  task,
  canEdit,
  canDelete,
  canChangeStatus,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetail,
}: TaskCardProps) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = task.status !== "Done" && task.due_date < today;

  return (
    <div
      className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-md ${
        isOverdue
          ? "border-l-4 border-l-red-400 border-t-border border-r-border border-b-border"
          : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {task.task}
            </h3>
            {isOverdue && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Overdue
              </span>
            )}
          </div>
        </div>
        <span
          className={`text-[11px] font-bold px-3 py-1 rounded-full border flex-shrink-0 ${
            statusStyles[task.status]
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {task.supervisor}
        </span>
        <span className={`flex items-center gap-1.5 font-semibold ${priorityStyles[task.priority]}`}>
          <Flag className="w-3.5 h-3.5" />
          {task.priority}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {task.due_date}
        </span>
        {task.location && (
          <span className="flex items-center gap-1.5 text-primary-600">
            <MapPin className="w-3.5 h-3.5" />
            {task.location}
          </span>
        )}
      </div>

      {/* Notes */}
      {task.follow_up && (
        <div className="text-xs text-gray-400 italic bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-border-light">
          {task.follow_up}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {canChangeStatus && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface-secondary text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {onViewDetail && (
          <button
            onClick={() => onViewDetail(task)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
          >
            <Eye className="w-3 h-3" /> Detail
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => onEdit(task)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
