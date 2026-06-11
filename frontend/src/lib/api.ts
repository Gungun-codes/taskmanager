import { Task, TaskStatus, User } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const authGoogle = (token: string) =>
  fetchAPI<{ user: User }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

// Users
export const getUsers = () =>
  fetchAPI<{ users: User[] }>("/users").then((r) => r.users);

// Tasks
export const getTasks = () =>
  fetchAPI<{ tasks: Task[] }>("/tasks").then((r) => r.tasks);

export const createTask = (data: {
  title: string;
  description?: string;
  created_by: string;
  assigned_to?: string;
}) =>
  fetchAPI<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.task);

export const updateTask = (id: string, data: { status?: TaskStatus; title?: string; description?: string; assigned_to?: string }) =>
  fetchAPI<{ task: Task }>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }).then((r) => r.task);

export const deleteTask = (id: string) =>
  fetchAPI(`/tasks/${id}`, { method: "DELETE" });
