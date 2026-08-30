import { useState } from "react";

const API = "https://procurax-o4mh.onrender.com/api/auth/login"
function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister
        ? `${API}/auth/register`
        : `${API}/auth/login`;

      const body = isRegister
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Something went wrong"
        );
        return;
      }

      // =========================
      // REGISTER SUCCESS
      // =========================

      if (isRegister) {
        setMessage(
          "✅ Account created successfully! Please login."
        );

        setIsRegister(false);

        setFormData({
          name: "",
          email: formData.email,
          password: "",
          role: "ADMIN",
        });

        return;
      }

      // =========================
      // LOGIN SUCCESS
      // =========================

      localStorage.setItem(
        "vmsToken",
        data.token
      );

      localStorage.setItem(
        "vmsUser",
        JSON.stringify(data.user)
      );

      setMessage("✅ Login successful!");

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (error) {
      console.error("Auth error:", error);

      setMessage(
        "❌ Cannot connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* HEADER */}

        <div className="login-header">
          <h1>🏢 VMS</h1>

          <p>
            Vendor Management System
          </p>
        </div>

        {/* TITLE */}

        <h2>
          {isRegister
            ? "📝 Create Account"
            : "🔐 Login"}
        </h2>

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          {isRegister && (
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          {/* EMAIL */}

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* PASSWORD */}

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* ROLE */}

          {isRegister && (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="ADMIN">
                Admin
              </option>

              <option value="MANAGER">
                Manager
              </option>

              <option value="PROCUREMENT">
                Procurement Officer
              </option>

              <option value="VENDOR">
                Vendor
              </option>

              <option value="CUSTOMER">
                Customer
              </option>
            </select>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
              ? "📝 Create Account"
              : "🔑 Login"}
          </button>

        </form>

        {/* MESSAGE */}

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* SWITCH */}

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >

          {isRegister ? (
            <p>
              Already have an account?{" "}

              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setMessage("");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              New user?{" "}

              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setMessage("");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Create an account
              </button>
            </p>
          )}

        </div>

      </div>
    </div>
  );
}

export default Login;