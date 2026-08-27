import { useState } from "react";

const API = "http://localhost:5000/api";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
      const response = await fetch(
        `${API}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: "ADMIN",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "✅ User created successfully! You can now login."
        );

        setFormData({
          name: "",
          email: "",
          password: "",
        });
      } else {
        setMessage(
          `❌ ${data.message || "Registration failed"}`
        );
      }
    } catch (error) {
      console.error("Register error:", error);

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

        <div className="login-header">
          <h1>🏢 VMS</h1>
          <p>Vendor Management System</p>
        </div>

        <h2>👤 Create Admin User</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            minLength="6"
            required
          />

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "👤 Create User"}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default Register;