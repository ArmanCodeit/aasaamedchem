import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SELLER";
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please check credentials.");
        setLoading(false);
        return;
      }

      onLogin(data.user);

      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/seller");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during sign in. Please make sure backend server is running.");
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "ADMIN" | "SELLER") => {
    if (role === "ADMIN") {
      setEmail("admin@aasamedchem.com");
      setPassword("admin123");
    } else {
      setEmail("seller@aasamedchem.com");
      setPassword("seller123");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.brand}>AasaMedChem</h1>
          <p className={styles.subtitle}>Inventory & Order System (MERN)</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. user@aasamedchem.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.demoPanel}>
          <h3 className={styles.demoTitle}>Quick Demo Logins</h3>
          <div className={styles.demoGrid}>
            <button
              onClick={() => handleDemoLogin("ADMIN")}
              className={styles.demoBtn}
              type="button"
            >
              Demo Admin
            </button>
            <button
              onClick={() => handleDemoLogin("SELLER")}
              className={styles.demoBtn}
              type="button"
            >
              Demo Seller
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
