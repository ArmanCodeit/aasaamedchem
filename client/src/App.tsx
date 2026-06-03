import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SellerCatalog from "./pages/SellerCatalog";
import SellerOrders from "./pages/SellerOrders";
import AdminCatalog from "./pages/AdminCatalog";
import AdminOrders from "./pages/AdminOrders";
import Navigation from "./components/Navigation";
import "./App.css";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SELLER";
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize: restore user session from cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/self", {
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2>Verifying session...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              user.role === "ADMIN" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/seller" replace />
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Seller Routes Layout */}
        <Route
          path="/seller"
          element={
            user && user.role === "SELLER" ? (
              <div className="dashboard-container" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Navigation user={user} onLogout={handleLogout} />
                <main className="main-content">
                  <SellerCatalog />
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/seller/orders"
          element={
            user && user.role === "SELLER" ? (
              <div className="dashboard-container" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Navigation user={user} onLogout={handleLogout} />
                <main className="main-content">
                  <SellerOrders />
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes Layout */}
        <Route
          path="/admin"
          element={
            user && user.role === "ADMIN" ? (
              <div className="dashboard-container" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Navigation user={user} onLogout={handleLogout} />
                <main className="main-content">
                  <AdminCatalog />
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/orders"
          element={
            user && user.role === "ADMIN" ? (
              <div className="dashboard-container" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Navigation user={user} onLogout={handleLogout} />
                <main className="main-content">
                  <AdminOrders />
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback Catch-all Route */}
        <Route
          path="*"
          element={
            user ? (
              user.role === "ADMIN" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/seller" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
