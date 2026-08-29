import React from "react";
import "./Navbar.css";

function Navbar({ user, onLogout }) {
  return (
    <nav className="procura-navbar">

      {/* LOGO + NAME */}
      <div className="procura-brand">
        <img
          src="/procuraX-logo.png"
          alt="ProcuraX Logo"
          className="procura-logo"
        />

        <span className="procura-brand-name">
          ProcuraX
        </span>
      </div>


      {/* USER + LOGOUT */}
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
              {user?.role || "User"}
            </span>
          </div>

        </div>


        <button
          type="button"
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