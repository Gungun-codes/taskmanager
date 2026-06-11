"use client";
import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import Avatar from "./Avatar";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

interface Props {
  task: Task;
  currentUserId: string;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, currentUserId, onStatusChange, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const canDelete = task.created_by === currentUserId;
  const date = new Date(task.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short"
  });

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--sand)",
      borderRadius: 14,
      padding: "16px",
      boxShadow: "0 2px 8px rgba(45,31,14,0.05)",
      position: "relative",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(45,31,14,0.1)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(45,31,14,0.05)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Status badge */}
      <span className={`badge-${task.status}`} style={{
        fontSize: 11, fontWeight: 600, borderRadius: 6,
        padding: "3px 8px", textTransform: "uppercase",
        letterSpacing: "0.5px", display: "inline-block", marginBottom: 10,
      }}>
        {task.status.replace("_", " ")}
      </span>

      {/* Title */}
      <p style={{
        fontFamily: "var(--font-display)", fontSize: 15,
        fontWeight: 600, color: "var(--espresso)",
        lineHeight: 1.4, marginBottom: task.description ? 6 : 12,
        textDecoration: task.status === "completed" ? "line-through" : "none",
        opacity: task.status === "completed" ? 0.6 : 1,
      }}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: 13, color: "var(--muted)", lineHeight: 1.5,
          marginBottom: 12,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          overflow: "hidden",
        }}>
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Assignee */}
        {task.assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar user={task.assignee} size={22} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {task.assignee.name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Unassigned</span>
        )}

        <span style={{ fontSize: 12, color: "var(--sand)", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{date}</span>

        {/* Actions */}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: "none", border: "1px solid var(--sand)",
              borderRadius: 6, padding: "4px 8px", cursor: "pointer",
              color: "var(--muted)", fontSize: 14, lineHeight: 1,
            }}
          >
            ···
          </button>

          {showMenu && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)",
              background: "#fff", border: "1px solid var(--sand)",
              borderRadius: 10, boxShadow: "0 8px 24px rgba(45,31,14,0.12)",
              minWidth: 160, zIndex: 100, overflow: "hidden",
            }}
              onMouseLeave={() => setShowMenu(false)}
            >
              <p style={{
                fontSize: 11, color: "var(--muted)", padding: "10px 14px 4px",
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px"
              }}>
                Move to
              </p>
              {STATUS_OPTIONS.filter((s) => s.value !== task.status).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onStatusChange(task.id, opt.value); setShowMenu(false); }}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "10px 14px", border: "none",
                    background: "none", cursor: "pointer",
                    fontSize: 13, color: "var(--espresso)",
                    fontFamily: "var(--font-body)",
                    transition: "background 0.1s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--warm-white)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                >
                  {opt.label}
                </button>
              ))}

              {canDelete && (
                <>
                  <div style={{ height: 1, background: "var(--sand)", margin: "4px 0" }} />
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "10px 14px", border: "none",
                      background: "none", cursor: "pointer",
                      fontSize: 13, color: "var(--red)",
                      fontFamily: "var(--font-body)",
                      transition: "background 0.1s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#fdf2f2")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Delete task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
