import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ItemsPage } from "./pages/ItemsPage";
import { ScanPage } from "./pages/ScanPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { QRAdminPage } from "./pages/QRAdminPage";
import { OCRAdminPage } from "./pages/OCRAdminPage";
import { SearchPage } from "./pages/SearchPage";
import { BoxContentsPage } from "./pages/BoxContentsPage";
import { ExportPage } from "./pages/ExportPage";
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
            <Route path="/search" element={<SearchPage />} />
            <Route path="/box/:qrCode" element={<BoxContentsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/admin/qr" element={<QRAdminPage />} />
            <Route path="/admin/ocr" element={<OCRAdminPage />} />
            <Route path="/admin/export" element={<ExportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </LoginGate>
  );
}
