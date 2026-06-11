"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authGoogle } from "@/lib/api";

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 280,
      });
    };

    if (window.google) initGoogle();
    else {
      const interval = setInterval(() => {
        if (window.google) { initGoogle(); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleCredential(response: { credential: string }) {
    setLoading(true);
    setError("");
    try {
      const { user } = await authGoogle(response.credential);
      setUser(user);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      {/* Decorative background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 80% 60% at 20% 10%, #e8d5b840 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, #c49a6c20 0%, transparent 60%)"
      }} />

      <div className="fade-up" style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 440,
        margin: "0 16px",
      }}>
        {/* Card */}
        <div style={{
          background: "#fff",
          border: "1px solid var(--sand)",
          borderRadius: 20,
          padding: "48px 40px",
          boxShadow: "0 8px 40px rgba(45,31,14,0.08), 0 2px 8px rgba(45,31,14,0.04)",
        }}>
          {/* Logo mark */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "var(--espresso)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 26,
            }}>
              ✂️
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 28,
              fontWeight: 600, color: "var(--espresso)",
              letterSpacing: "-0.5px", marginBottom: 6,
            }}>
              Hairdrama
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
              Task management for the team
            </p>
          </div>

          {/* Divider */}
          <div style={{
            height: 1, background: "var(--sand)",
            margin: "0 -40px 28px", opacity: 0.6
          }} />

          <p style={{
            color: "var(--mocha)", fontSize: 15, fontWeight: 500,
            marginBottom: 20, textAlign: "center"
          }}>
            Sign in to continue
          </p>

          {/* Google button container */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {loading ? (
              <div style={{
                width: 24, height: 24, border: "2px solid var(--sand)",
                borderTopColor: "var(--espresso)", borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
            ) : (
              <div ref={btnRef} />
            )}
          </div>

          {error && (
            <p style={{
              marginTop: 16, color: "var(--red)", fontSize: 13,
              textAlign: "center", background: "#fdf2f2",
              border: "1px solid #f5c6c6", borderRadius: 8, padding: "8px 12px"
            }}>
              {error}
            </p>
          )}

          <p style={{
            marginTop: 28, color: "var(--muted)", fontSize: 12,
            textAlign: "center", lineHeight: 1.6
          }}>
            By signing in, you agree to collaborate responsibly.<br />
            This app is for Hairdrama team members.
          </p>
        </div>
      </div>
    </main>
  );
}
