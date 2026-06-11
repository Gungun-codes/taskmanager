"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTasks, updateTask, deleteTask } from "@/lib/api";
import { Task, TaskStatus } from "@/types";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";
import Avatar from "@/components/Avatar";

const STATUS_COLS: { key: TaskStatus; label: string; emoji: string }[] = [
  { key: "pending", label: "To Do", emoji: "📋" },
  { key: "in_progress", label: "In Progress", emoji: "⚡" },
  { key: "completed", label: "Completed", emoji: "✅" },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "assigned">("all");

  useEffect(() => {
    if (!user) { router.replace("/"); return; }
    loadTasks();
  }, [user]);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
    try {
      await updateTask(taskId, { status });
    } catch {
      loadTasks(); // revert on error
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch {
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "mine") return t.created_by === user?.id;
    if (filter === "assigned") return t.assigned_to === user?.id;
    return true;
  });

  const byStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <header style={{
        background: "var(--espresso)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>✂️</span>
          <h1 style={{
            fontFamily: "var(--font-display)",
            color: "#f5e6c8", fontSize: 20, fontWeight: 600,
            letterSpacing: "-0.3px"
          }}>
            Hairdrama Tasks
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 10, padding: "8px 18px",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            + New Task
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar user={user} size={32} />
            <button
              onClick={logout}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#c9b99a",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                padding: "6px 12px", fontSize: 13, cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: "24px" }}>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["all", "mine", "assigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 13,
                fontFamily: "var(--font-body)", cursor: "pointer",
                fontWeight: filter === f ? 600 : 400,
                background: filter === f ? "var(--espresso)" : "#fff",
                color: filter === f ? "#f5e6c8" : "var(--muted)",
                border: `1px solid ${filter === f ? "var(--espresso)" : "var(--sand)"}`,
                transition: "all 0.15s",
              }}
            >
              {f === "all" ? "All Tasks" : f === "mine" ? "Created by me" : "Assigned to me"}
            </button>
          ))}

          <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13, lineHeight: "32px" }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Kanban columns */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--muted)" }}>
            <div style={{
              width: 32, height: 32, border: "2px solid var(--sand)",
              borderTopColor: "var(--espresso)", borderRadius: "50%",
              animation: "spin 0.7s linear infinite", margin: "0 auto 16px"
            }} />
            Loading tasks...
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "start",
          }}>
            {STATUS_COLS.map(({ key, label, emoji }) => (
              <div key={key}>
                {/* Column header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 12, padding: "0 4px"
                }}>
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: 16,
                    fontWeight: 600, color: "var(--espresso)",
                  }}>
                    {label}
                  </h2>
                  <span style={{
                    marginLeft: "auto",
                    background: "var(--sand)", color: "var(--mocha)",
                    borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                  }}>
                    {byStatus(key).length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {byStatus(key).length === 0 ? (
                    <div style={{
                      background: "#fff", border: "1.5px dashed var(--sand)",
                      borderRadius: 12, padding: "28px 16px", textAlign: "center",
                      color: "var(--muted)", fontSize: 13
                    }}>
                      No tasks here
                    </div>
                  ) : (
                    byStatus(key).map((task, i) => (
                      <div
                        key={task.id}
                        className="slide-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <TaskCard
                          task={task}
                          currentUserId={user.id}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          currentUser={user}
          onClose={() => setShowCreate(false)}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
