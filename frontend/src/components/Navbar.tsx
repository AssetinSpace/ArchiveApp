import { NavLink } from "react-router-dom";

const links: Array<{ to: string; icon: string; label: string }> = [
  { to: "/", icon: "□", label: "Položky" },
  { to: "/scan", icon: "▣", label: "Scan" },
  { to: "/admin/qr", icon: "≡", label: "QR" },
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
