import { ItemsPage } from "./pages/ItemsPage";
import { LoginGate } from "./components/LoginGate";

export function App() {
  return (
    <LoginGate>
      <div
        style={{
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          maxWidth: 960,
          margin: "0 auto",
          padding: "24px 16px",
          color: "#1f2937",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>ArchiveApp</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Sprint 1 — vytváranie položiek a hierarchia (MVP)
          </p>
        </header>
        <ItemsPage />
      </div>
    </LoginGate>
  );
}
