import { NavLink } from "react-router-dom";

const links: Array<{ to: string; icon: string; label: string }> = [
  { to: "/", icon: "□", label: "Položky" },
  { to: "/scan", icon: "▣", label: "Scan" },
  { to: "/search", icon: "⌕", label: "Hľadať" },
  { to: "/admin/qr", icon: "≡", label: "QR" },
  { to: "/admin/ocr", icon: "T", label: "OCR" },
  { to: "/admin/export", icon: "↓", label: "Export" },
];

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              "navbar-link" + (isActive ? " active" : "")
            }
          >
            <span className="navbar-icon" aria-hidden="true">{link.icon}</span>
            <span className="navbar-label">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
