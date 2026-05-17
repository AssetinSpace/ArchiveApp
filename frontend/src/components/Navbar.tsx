import { NavLink } from "react-router-dom";

type IconName = "items" | "scan" | "qr" | "ocr" | "export";

const links: Array<{ to: string; icon: IconName; label: string }> = [
  { to: "/", icon: "items", label: "Položky" },
  { to: "/scan", icon: "scan", label: "Scan" },
  { to: "/admin/qr", icon: "qr", label: "QR" },
  { to: "/admin/ocr", icon: "ocr", label: "OCR" },
  { to: "/admin/export", icon: "export", label: "Export" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "items":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case "scan":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" />
          <rect x="13" y="4" width="7" height="7" />
          <rect x="4" y="13" width="7" height="7" />
          <path d="M13 13h3v3h-3zM19 13v3M16 19h3v-3" />
        </svg>
      );
    case "ocr":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 7h10M12 7v10" />
        </svg>
      );
    case "export":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 4v10M8 10l4 4 4-4" />
          <path d="M5 18h14" />
        </svg>
      );
  }
}

export function Navbar() {
  return (
    <nav className="navbar" aria-label="Hlavná navigácia">
      <div className="navbar-brand">
        <img src="/assetin-logo.png" alt="assetin" className="navbar-logo" />
      </div>

      <div className="navbar-nav">
        <div className="navbar-nav-inner">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                "navbar-link" + (isActive ? " active" : "")
              }
            >
              <span className="navbar-icon">
                <NavIcon name={link.icon} />
              </span>
              <span className="navbar-label">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="navbar-tail" aria-hidden="true" />
    </nav>
  );
}
