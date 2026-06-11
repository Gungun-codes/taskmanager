from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


# ─── AUTH ───────────────────────────────────────────────────────────────────

@app.route("/auth/google", methods=["POST"])
def google_auth():
    """Verify Google OAuth token and upsert user in Supabase."""
    token = request.json.get("token")
    if not token:
        return jsonify({"error": "Token required"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )

        user_data = {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "avatar": idinfo.get("picture", ""),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Upsert user
        result = supabase.table("users").upsert(
            user_data, on_conflict="google_id"
        ).execute()

        user = result.data[0]
        return jsonify({"user": user}), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401


@app.route("/auth/me", methods=["GET"])
def get_me():
    """Get user by google_id from query param."""
    google_id = request.args.get("google_id")
    if not google_id:
        return jsonify({"error": "google_id required"}), 400

    result = supabase.table("users").select("*").eq("google_id", google_id).execute()
    if not result.data:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": result.data[0]}), 200


# ─── USERS ──────────────────────────────────────────────────────────────────

@app.route("/users", methods=["GET"])
def list_users():
    """List all users (for task assignment dropdown)."""
    result = supabase.table("users").select("id, name, email, avatar").execute()
    return jsonify({"users": result.data}), 200


# ─── TASKS ──────────────────────────────────────────────────────────────────

@app.route("/tasks", methods=["GET"])
def list_tasks():
    """Get all tasks with creator and assignee info."""
    result = (
        supabase.table("tasks")
        .select("*, creator:created_by(id, name, email, avatar), assignee:assigned_to(id, name, email, avatar)")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify({"tasks": result.data}), 200


@app.route("/tasks", methods=["POST"])
def create_task():
    """Create a new task and send email notification to assignee."""
    data = request.json
    required = ["title", "created_by"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    task_data = {
        "title": data["title"],
        "description": data.get("description", ""),
        "status": "pending",
        "created_by": data["created_by"],
        "assigned_to": data.get("assigned_to"),
        "created_at": datetime.utcnow().isoformat()
    }

    result = supabase.table("tasks").insert(task_data).execute()
    task = result.data[0]

    # Send email if task is assigned
    if task.get("assigned_to"):
        assignee = supabase.table("users").select("email, name").eq("id", task["assigned_to"]).execute()
        creator = supabase.table("users").select("name").eq("id", task["created_by"]).execute()

        if assignee.data and creator.data:
            send_task_email(
                to_email=assignee.data[0]["email"],
                to_name=assignee.data[0]["name"],
                task_title=task["title"],
                task_description=task.get("description", ""),
                creator_name=creator.data[0]["name"],
                event_type="created"
            )

    return jsonify({"task": task}), 201


@app.route("/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id):
    """Update task status. Sends email on completion."""
    data = request.json
    allowed = ["title", "description", "status", "assigned_to"]
    update_data = {k: v for k, v in data.items() if k in allowed}

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
    task = result.data[0]

    # Send completion email
    if update_data.get("status") == "completed" and task.get("assigned_to"):
        assignee = supabase.table("users").select("email, name").eq("id", task["assigned_to"]).execute()
        creator = supabase.table("users").select("name").eq("id", task["created_by"]).execute()

        if assignee.data and creator.data:
            send_task_email(
                to_email=assignee.data[0]["email"],
                to_name=assignee.data[0]["name"],
                task_title=task["title"],
                task_description=task.get("description", ""),
                creator_name=creator.data[0]["name"],
                event_type="completed"
            )

    return jsonify({"task": task}), 200


@app.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task."""
    supabase.table("tasks").delete().eq("id", task_id).execute()
    return jsonify({"message": "Task deleted"}), 200


# ─── EMAIL ──────────────────────────────────────────────────────────────────

def send_task_email(to_email, to_name, task_title, task_description, creator_name, event_type):
    """Send Gmail notification for task created or completed."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("Gmail not configured — skipping email")
        return

    subject = (
        f"New task assigned: {task_title}"
        if event_type == "created"
        else f"Task completed: {task_title}"
    )

    body_html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #fafaf8; border-radius: 12px; overflow: hidden; border: 1px solid #e8e0d0;">
      <div style="background: #2d2416; padding: 32px; text-align: center;">
        <h1 style="color: #f5e6c8; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">
          {'📋 New Task Assigned' if event_type == 'created' else '✅ Task Completed'}
        </h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #4a3f2f; font-size: 16px; margin: 0 0 20px;">Hi {to_name},</p>
        <p style="color: #6b5c45; font-size: 15px; margin: 0 0 24px;">
          {'<strong>' + creator_name + '</strong> has assigned you a new task.' if event_type == 'created' else 'A task you were assigned to has been marked as complete.'}
        </p>
        <div style="background: #fff; border: 1px solid #e8e0d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #2d2416; font-size: 18px; font-weight: 600; margin: 0 0 8px;">{task_title}</p>
          {f'<p style="color: #8a7560; font-size: 14px; margin: 0;">{task_description}</p>' if task_description else ''}
        </div>
        <p style="color: #a09080; font-size: 13px; margin: 0;">— Team Hairdrama Task Manager</p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Email error: {e}")


# ─── HEALTH ─────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "hairdrama-backend"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
