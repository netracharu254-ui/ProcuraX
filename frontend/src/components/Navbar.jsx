import React from "react";
import "./Navbar.css";

function Navbar({ user, onLogout }) {
  return (
    <nav className="procura-navbar">

      {/* BRAND */}
      <div className="procura-brand">
        <span className="procura-brand-name">
          ProcuraX
        </span>
      </div>

      {/* NAVIGATION */}
      <div className="procura-nav-links">

        <a href="/dashboard" className="procura-nav-link">
          <span>⌂</span>
          Dashboard
        </a>

        <a href="/vendors" className="procura-nav-link">
          <span>🏢</span>
          Vendors
        </a>

        <a href="/procurement" className="procura-nav-link">
          <span>📦</span>
          Procurement
        </a>

        <a href="/purchase-orders" className="procura-nav-link">
          <span>📋</span>
          Purchase Orders
        </a>

      </div>

      {/* USER SECTION */}
      <div className="procura-user-section">

        <div className="procura-user-info">

          <div className="procura-user-avatar">
            {(user?.name || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="procura-user-details">

            <strong>
              {user?.name || user?.email || "User"}
            </strong>

            <span>
              {user?.role || "Procurement Officer"}
            </span>

          </div>

        </div>

        <button
          className="procura-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;