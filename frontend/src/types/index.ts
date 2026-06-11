export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  creator?: User;
  assignee?: User | null;
}
