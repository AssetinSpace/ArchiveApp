import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ItemsPage } from "./pages/ItemsPage";
import { ScanPage } from "./pages/ScanPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { QRAdminPage } from "./pages/QRAdminPage";
import { LoginGate } from "./components/LoginGate";
import { Navbar } from "./components/Navbar";

export function App() {
  return (
    <LoginGate>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<ItemsPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/admin/qr" element={<QRAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </LoginGate>
  );
}
