"use client";
import { useEffect, useState } from "react";
import { User, Task } from "@/types";
import { createTask, getUsers } from "@/lib/api";

interface Props {
  currentUser: User;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function CreateTaskModal({ currentUser, onClose, onCreated }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
    // Trap scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError("");
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        created_by: currentUser.id,
        assigned_to: assignedTo || undefined,
      });
      onCreated(task);
    } catch (e: any) {
      setError(e.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(45,31,14,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fade-up" style={{
        background: "#fff", borderRadius: 20,
        border: "1px solid var(--sand)",
        boxShadow: "0 24px 80px rgba(45,31,14,0.2)",
        width: "100%", maxWidth: 480,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "var(--espresso)", padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)", color: "#f5e6c8",
            fontSize: 18, fontWeight: 600
          }}>
            Create Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#c9b99a", borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 600,
              color: "var(--mocha)", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.5px"
            }}>
              Task Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review Q3 campaign assets"
              style={{
                width: "100%", padding: "10px 14px",
                border: "1.5px solid var(--sand)", borderRadius: 10,
                fontSize: 14, fontFamily: "var(--font-body)",
                color: "var(--espresso)", background: "var(--cream)",
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--caramel)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--sand)")}
              autoFocus
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 600,
              color: "var(--mocha)", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.5px"
            }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context (optional)"
              rows={3}
              style={{
                width: "100%", padding: "10px 14px",
                border: "1.5px solid var(--sand)", borderRadius: 10,
                fontSize: 14, fontFamily: "var(--font-body)",
                color: "var(--espresso)", background: "var(--cream)",
                outline: "none", resize: "vertical",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--caramel)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--sand)")}
            />
          </div>

          {/* Assign to */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 600,
              color: "var(--mocha)", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.5px"
            }}>
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                border: "1.5px solid var(--sand)", borderRadius: 10,
                fontSize: 14, fontFamily: "var(--font-body)",
                color: assignedTo ? "var(--espresso)" : "var(--muted)",
                background: "var(--cream)", outline: "none",
                cursor: "pointer", appearance: "none",
              }}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                  {u.id === currentUser.id ? " — You" : ""}
                </option>
              ))}
            </select>
            {assignedTo && (
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--green)" }}>
                ✓ An email notification will be sent to the assignee
              </p>
            )}
          </div>

          {error && (
            <p style={{
              marginBottom: 16, color: "var(--red)", fontSize: 13,
              background: "#fdf2f2", border: "1px solid #f5c6c6",
              borderRadius: 8, padding: "8px 12px"
            }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14,
                fontFamily: "var(--font-body)", cursor: "pointer",
                background: "none", border: "1px solid var(--sand)",
                color: "var(--muted)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              style={{
                padding: "10px 24px", borderRadius: 10, fontSize: 14,
                fontFamily: "var(--font-body)", cursor: loading ? "not-allowed" : "pointer",
                background: loading || !title.trim() ? "var(--sand)" : "var(--espresso)",
                color: loading || !title.trim() ? "var(--muted)" : "#f5e6c8",
                border: "none", fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
