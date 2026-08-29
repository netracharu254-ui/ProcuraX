import { useState } from "react";
import "./App.css";

// ==========================================
// NAVBAR
// ==========================================

import Navbar from "./components/Navbar";

// ==========================================
// ADMIN / STAFF PAGES
// ==========================================

import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import ProcurementPage from "./pages/ProcurementPage";
import VendorPage from "./pages/VendorPage";

// ==========================================
// CUSTOMER PAGES
// ==========================================

import CustomerPage from "./pages/CustomerPage";
import ProductCatalog from "./pages/ProductCatalog";
import CustomerCart from "./pages/CustomerCart";

// ==========================================
// LOGIN
// ==========================================

import Login from "./Login";


function App() {

  // ==========================================
  // LOGGED-IN USER
  // ==========================================

  const [user, setUser] = useState(() => {

    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {

      return JSON.parse(savedUser);

    } catch (error) {

      console.error(
        "Invalid user data:",
        error
      );

      localStorage.removeItem("user");

      return null;
    }

  });


  // ==========================================
  // CUSTOMER NAVIGATION
  // ==========================================

  const [customerPage, setCustomerPage] =
    useState("dashboard");


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = (loggedInUser) => {

    console.log(
      "Logged in user:",
      loggedInUser
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    // Always start customer at dashboard
    setCustomerPage("dashboard");
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    localStorage.removeItem("user");

    setUser(null);

    setCustomerPage("dashboard");
  };


  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  if (!user) {

    return (
      <Login
        onLogin={handleLogin}
      />
    );

  }


  // ==========================================
  // GET USER ROLE
  // ==========================================

  const role = String(
    user.role ||
    user.userRole ||
    user.type ||
    ""
  )
    .trim()
    .toLowerCase();


  console.log(
    "Current User:",
    user
  );

  console.log(
    "Current Role:",
    role
  );


  // ==========================================
  // ADMIN
  // ==========================================

  if (
    role === "admin" ||
    role === "administrator"
  ) {

    return (
      <>

        <Navbar
          user={user}
          onLogout={handleLogout}
        />

        <AdminPage
          user={user}
          onLogout={handleLogout}
        />

      </>
    );

  }


  // ==========================================
  // MANAGER
  // ==========================================

  if (role === "manager") {

    return (
      <>

        <Navbar
          user={user}
          onLogout={handleLogout}
        />

        <ManagerPage
          user={user}
          onLogout={handleLogout}
        />

      </>
    );

  }


  // ==========================================
  // PROCUREMENT
  // ==========================================

  if (
    role === "procurement" ||
    role === "procurement officer" ||
    role === "procurement_officer"
  ) {

    return (
      <>

        <Navbar
          user={user}
          onLogout={handleLogout}
        />

        <ProcurementPage
          user={user}
          onLogout={handleLogout}
        />

      </>
    );

  }


  // ==========================================
  // VENDOR
  // ==========================================

  if (
    role === "vendor" ||
    role === "supplier"
  ) {

    return (
      <>

        <Navbar
          user={user}
          onLogout={handleLogout}
        />

        <VendorPage
          user={user}
          onLogout={handleLogout}
        />

      </>
    );

  }


  // ==========================================
  // CUSTOMER
  // ==========================================

  if (
    role === "customer" ||
    role === "client"
  ) {


    // ========================================
    // CUSTOMER DASHBOARD
    // ========================================

    if (
      customerPage === "dashboard"
    ) {

      return (
        <CustomerPage
          user={user}
          onLogout={handleLogout}
          onNavigate={setCustomerPage}
        />
      );

    }


    // ========================================
    // PRODUCT CATALOG
    // ========================================

    if (
      customerPage === "products"
    ) {

      return (
        <ProductCatalog
          user={user}
          onNavigate={setCustomerPage}
        />
      );

    }


    // ========================================
    // CUSTOMER CART
    // ========================================

    if (
      customerPage === "cart"
    ) {

      return (
        <CustomerCart
          user={user}
          onNavigate={setCustomerPage}
        />
      );

    }


    // ========================================
    // CUSTOMER ORDERS
    // ========================================

    if (
      customerPage === "orders"
    ) {

      return (
        <CustomerPage
          user={user}
          onLogout={handleLogout}
          onNavigate={setCustomerPage}
        />
      );

    }


    // ========================================
    // DEFAULT CUSTOMER PAGE
    // ========================================

    return (
      <CustomerPage
        user={user}
        onLogout={handleLogout}
        onNavigate={setCustomerPage}
      />
    );

  }


  // ==========================================
  // UNKNOWN / INVALID ROLE
  // ==========================================

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >

      <div
        style={{
          background: "#ffffff",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.08)",
          maxWidth: "500px",
          width: "100%",
        }}
      >

        {/* ICON */}

        <div
          style={{
            fontSize: "50px",
            marginBottom: "15px",
          }}
        >
          ⚠️
        </div>


        {/* TITLE */}

        <h2
          style={{
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Invalid User Role
        </h2>


        {/* MESSAGE */}

        <p
          style={{
            color: "#6b7280",
            marginBottom: "20px",
          }}
        >
          Your account role is not recognised
          by the Vendor Management System.
        </p>


        {/* ROLE */}

        <p
          style={{
            background: "#f3f4f6",
            padding: "12px",
            borderRadius: "10px",
            fontFamily: "monospace",
          }}
        >
          Role:{" "}
          {user.role || "Not defined"}
        </p>


        {/* LOGOUT */}

        <button
          onClick={handleLogout}
          style={{
            marginTop: "15px",
            padding: "12px 22px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Back to Login
        </button>

      </div>

    </div>

  );

}


export default App;