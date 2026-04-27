import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [navAuth, setNavAuth] = useState({
    label: "Login",
    link: "/login",
    role: null
  });

  useEffect(() => {
    const userToken = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    const userRole = localStorage.getItem("userRole");

    if (adminToken && userRole === "admin") {
      setNavAuth({
        label: "Admin Panel",
        link: "/admin/user",
        role: "admin"
      });
    } else if (userToken) {
      setNavAuth({
        label: "My Account",
        link: "/profile",
        role: "user"
      });
    } else {
      setNavAuth({
        label: "Login",
        link: "/login",
        role: null
      });
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("userRole");
    
    setNavAuth({ label: "Login", link: "/login", role: null });
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="/disney-logo.png" alt="Disney" />
        </Link>
      </div>

      <ul className="navbar-links">
        {/* User menu */}
        {navAuth.role !== "admin" && (
          <>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/booking">Booking</Link></li>
            <li><Link to="/shop">Shop</Link></li>
          </>
        )}

        {/* separator chỉ hiện khi KHÔNG phải admin */}
        {navAuth.role !== "admin" && <li className="separator" />}

        {/* auth */}
        <li className="auth-group">
          <Link to={navAuth.link} className="auth-link">
            {navAuth.label}
          </Link>

          {navAuth.role === "admin" && (
            <>
              <span className="auth-divider">|</span>

              <button
                onClick={handleLogout}
                className="auth-link logout-btn"
              >
                Logout
              </button>
            </>
          )}
        </li>
      </ul>
    </nav>
  );
}