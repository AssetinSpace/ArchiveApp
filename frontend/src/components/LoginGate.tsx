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
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <img
            src="/assetin-logo.png"
            alt="assetin"
            className="login-logo"
          />
          <h1 className="login-title">
            <span className="login-title-dark">archive</span>
            <span className="login-title-accent">app</span>
          </h1>
          <p className="login-subtitle">Prihláste sa na pokračovanie</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-label">
            <span>Používateľ</span>
            <input
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="login-input"
              autoFocus
              required
            />
          </label>
          <label className="login-label">
            <span>Heslo</span>
            <input
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="login-input"
              required
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button
            type="submit"
            disabled={checking}
            className="btn-primary login-submit"
          >
            {checking ? "Overujem…" : "Prihlásiť"}
          </button>
        </form>
      </div>
    </div>
  );
}
