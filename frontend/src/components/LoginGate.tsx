import { useState, type FormEvent } from "react";
import { setCredentials, getCredentials, clearCredentials, api } from "../api";

type Props = {
  children: React.ReactNode;
};

export function LoginGate({ children }: Props) {
  const [authed, setAuthed] = useState<boolean>(() => getCredentials() !== null);
  const [checking, setChecking] = useState<boolean>(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    setCredentials({ user, pass });
    try {
      // Verify credentials with a lightweight request before showing the app.
      await api.itemTypes();
      setAuthed(true);
    } catch (err) {
      clearCredentials();
      setError("Nesprávne meno alebo heslo.");
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "32px 36px",
          minWidth: 320,
          boxShadow: "0 2px 12px rgba(0,0,0,.07)",
        }}
      >
        <h1 style={{ margin: "0 0 4px", fontSize: 22, color: "#111827" }}>ArchiveApp</h1>
        <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 13 }}>
          Prihláste sa na pokračovanie
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>
            <span style={spanStyle}>Používateľ</span>
            <input
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              style={inputStyle}
              autoFocus
              required
            />
          </label>
          <label style={labelStyle}>
            <span style={spanStyle}>Heslo</span>
            <input
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          {error && (
            <div style={{ color: "#b91c1c", fontSize: 13, marginTop: -4 }}>{error}</div>
          )}
          <button type="submit" disabled={checking} style={btnStyle}>
            {checking ? "Overujem…" : "Prihlásiť"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
};
const spanStyle: React.CSSProperties = { fontSize: 13, color: "#374151", fontWeight: 500 };
const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
};
const btnStyle: React.CSSProperties = {
  padding: "10px 0",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
};
