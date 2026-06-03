import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Navigation.module.css";

interface UserProp {
  name: string;
  email: string;
  role: "ADMIN" | "SELLER";
}

export default function Navigation({ user, onLogout }: { user: UserProp; onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        onLogout();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAdmin = user.role === "ADMIN";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className={styles.logo}>AasaMedChem</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted-on-dark)" }}>Inventory & Orders</span>
        </div>
        <span className={styles.sublogo}>MERN</span>
      </div>

      <div className={styles.profile}>
        <span className={styles.profileName}>{user.name}</span>
        <span className={styles.profileEmail}>{user.email}</span>
        <span className={`${styles.roleBadge} ${isAdmin ? styles.roleAdmin : styles.roleSeller}`}>
          {user.role}
        </span>
      </div>

      <nav className={styles.navLinks}>
        {isAdmin ? (
          <>
            <Link
              to="/admin"
              className={`${styles.link} ${pathname === "/admin" ? styles.activeLink : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Catalog Manager
            </Link>
            <Link
              to="/admin/orders"
              className={`${styles.link} ${pathname.startsWith("/admin/orders") ? styles.activeLink : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Order Manager
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/seller"
              className={`${styles.link} ${pathname === "/seller" ? styles.activeLink : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Product Catalog
            </Link>
            <Link
              to="/seller/orders"
              className={`${styles.link} ${pathname.startsWith("/seller/orders") ? styles.activeLink : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              My Quotations
            </Link>
          </>
        )}
      </nav>

      <div className={styles.logoutContainer}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
