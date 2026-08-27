import { useEffect, useState } from "react";
import Login from "./Login";

import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";

const API = "http://localhost:5000/api";

const PO_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "DELIVERED",
  "CLOSED",
];

function App() {
  // =====================================================
  // LOGIN
  // =====================================================

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vmsUser");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to read saved user:", error);
      return null;
    }
  });

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("vmsToken");
    localStorage.removeItem("vmsUser");
    setUser(null);
  };

  // =====================================================
  // VENDOR
  // =====================================================

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    gstCertificate: "",
    businessRegistration: "",
    isoCertificate: "",
  });

  const [vendors, setVendors] = useState([]);
  const [message, setMessage] = useState("");

  // =====================================================
  // PURCHASE ORDER
  // =====================================================

  const [poData, setPoData] = useState({
    poNumber: "",
    vendor: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [poItems, setPoItems] = useState([
    {
      productName: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poMessage, setPoMessage] = useState("");

  // =====================================================
  // PO DETAILS
  // =====================================================

  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPoDetails] = useState(null);

  // =====================================================
  // VENDOR PERFORMANCE
  // =====================================================

  const [performance, setPerformance] = useState([]);

  const [performanceForm, setPerformanceForm] = useState({
    vendor: "",
    deliveryScore: "",
    qualityScore: "",
    complianceScore: "",
    totalOrders: "",
    onTimeOrders: "",
    qualityIssues: "",
    remarks: "",
  });

  const [performanceMessage, setPerformanceMessage] = useState("");

  // =====================================================
  // DASHBOARD
  // =====================================================

  const [dashboardStats, setDashboardStats] = useState(null);

  // =====================================================
  // FETCH VENDORS
  // =====================================================

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API}/vendors`);
      const data = await response.json();

      if (response.ok) {
        setVendors(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch vendors:", data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  // =====================================================
  // FETCH PURCHASE ORDERS
  // =====================================================

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${API}/purchase-orders`);
      const data = await response.json();

      if (response.ok) {
        setPurchaseOrders(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch purchase orders:", data);
      }
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
    }
  };

  // =====================================================
  // FETCH PERFORMANCE
  // =====================================================

  const fetchPerformance = async () => {
    try {
      const response = await fetch(`${API}/vendor-performance`);
      const data = await response.json();

      if (response.ok) {
        setPerformance(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch performance:", data);
      }
    } catch (error) {
      console.error("Failed to fetch performance:", error);
    }
  };

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API}/dashboard/stats`);
      const data = await response.json();

      if (response.ok) {
        setDashboardStats(data);
      } else {
        console.error("Failed to fetch dashboard:", data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchVendors();
    fetchPurchaseOrders();
    fetchPerformance();
    fetchDashboardStats();
  }, [user]);

  // =====================================================
  // VENDOR FORM
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // REGISTER VENDOR
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          gstNumber: formData.gstNumber,
          address: formData.address,
          documents: {
            gstCertificate: formData.gstCertificate,
            businessRegistration: formData.businessRegistration,
            isoCertificate: formData.isoCertificate,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Vendor registered successfully!");

        setFormData({
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          gstNumber: "",
          address: "",
          gstCertificate: "",
          businessRegistration: "",
          isoCertificate: "",
        });

        await fetchVendors();
        await fetchDashboardStats();
      } else {
        setMessage(data.message || "❌ Registration failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Cannot connect to backend");
    }
  };

  // =====================================================
  // UPDATE VENDOR STATUS
  // =====================================================

  const updateVendorStatus = async (id, status) => {
    try {
      const response = await fetch(`${API}/vendors/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchVendors();
        await fetchDashboardStats();
      } else {
        alert(data.message || "Failed to update vendor status");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Cannot connect to backend");
    }
  };

  // =====================================================
  // PO FORM
  // =====================================================

  const handlePoChange = (e) => {
    const { name, value } = e.target;

    setPoData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // PO ITEM CHANGE
  // =====================================================

  const handleItemChange = (index, field, value) => {
    setPoItems((previous) =>
      previous.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =====================================================
  // ADD PO ITEM
  // =====================================================

  const addPoItem = () => {
    setPoItems((previous) => [
      ...previous,
      {
        productName: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  // =====================================================
  // REMOVE PO ITEM
  // =====================================================

  const removePoItem = (index) => {
    if (poItems.length === 1) {
      return;
    }

    setPoItems((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // =====================================================
  // CALCULATE TOTAL
  // =====================================================

  const calculateTotal = () => {
    return poItems.reduce((total, item) => {
      return (
        total +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0)
      );
    }, 0);
  };

  // =====================================================
  // CREATE PURCHASE ORDER
  // =====================================================

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setPoMessage("");

    try {
      const response = await fetch(`${API}/purchase-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poNumber: poData.poNumber,
          vendor: poData.vendor,
          expectedDeliveryDate: poData.expectedDeliveryDate,
          totalAmount: calculateTotal(),
          notes: poData.notes,
          items: poItems.map((item) => ({
            productName: item.productName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPoMessage(
          "✅ Purchase Order created successfully!"
        );

        setPoData({
          poNumber: "",
          vendor: "",
          expectedDeliveryDate: "",
          notes: "",
        });

        setPoItems([
          {
            productName: "",
            quantity: 1,
            unitPrice: 0,
          },
        ]);

        await fetchPurchaseOrders();
        await fetchDashboardStats();
      } else {
        setPoMessage(
          data.message || "❌ Failed to create PO"
        );
      }
    } catch (error) {
      console.error(error);
      setPoMessage("❌ Cannot connect to backend");
    }
  };

  // =====================================================
  // PO DETAILS
  // =====================================================

  const fetchPODetails = async (id) => {
    try {
      const response = await fetch(
        `${API}/purchase-orders/${id}`
      );

      const data = await response.json();

      if (response.ok) {
        setPoDetails(data);
        setSelectedPO(id);
      } else {
        alert(
          data.message || "Failed to fetch PO details"
        );
      }
    } catch (error) {
      console.error(error);
      alert("❌ Cannot connect to backend");
    }
  };

  // =====================================================
  // UPDATE PO STATUS
  // =====================================================

  const updatePOStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/purchase-orders/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchPurchaseOrders();
        await fetchDashboardStats();

        if (selectedPO === id) {
          await fetchPODetails(id);
        }
      } else {
        alert(
          data.message || "Failed to update PO status"
        );
      }
    } catch (error) {
      console.error(error);
      alert("❌ Cannot connect to backend");
    }
  };

  // =====================================================
  // PO STATUS HELPERS
  // =====================================================

  const getNextStatus = (status) => {
    const index = PO_STATUSES.indexOf(status);

    if (
      index === -1 ||
      index >= PO_STATUSES.length - 1
    ) {
      return null;
    }

    return PO_STATUSES[index + 1];
  };

  const getStatusIndex = (status) => {
    return PO_STATUSES.indexOf(status);
  };

  const formatStatus = (status) => {
    if (!status) {
      return "";
    }

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =====================================================
  // PERFORMANCE FORM
  // =====================================================

  const handlePerformanceChange = (e) => {
    const { name, value } = e.target;

    setPerformanceForm((previous) => ({
      ...previous,
      [name]:
        name === "remarks" || name === "vendor"
          ? value
          : value === ""
          ? ""
          : Number(value),
    }));
  };

  // =====================================================
  // PERFORMANCE SCORE
  // =====================================================

  const calculatePerformanceScore = () => {
    const delivery = Number(
      performanceForm.deliveryScore || 0
    );

    const quality = Number(
      performanceForm.qualityScore || 0
    );

    const compliance = Number(
      performanceForm.complianceScore || 0
    );

    return Math.round(
      (delivery + quality + compliance) / 3
    );
  };

  // =====================================================
  // SAVE PERFORMANCE
  // =====================================================

  const savePerformance = async (e) => {
    e.preventDefault();
    setPerformanceMessage("");

    if (!performanceForm.vendor) {
      setPerformanceMessage(
        "❌ Please select a vendor"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API}/vendor-performance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...performanceForm,
            deliveryScore: Number(
              performanceForm.deliveryScore || 0
            ),
            qualityScore: Number(
              performanceForm.qualityScore || 0
            ),
            complianceScore: Number(
              performanceForm.complianceScore || 0
            ),
            totalOrders: Number(
              performanceForm.totalOrders || 0
            ),
            onTimeOrders: Number(
              performanceForm.onTimeOrders || 0
            ),
            qualityIssues: Number(
              performanceForm.qualityIssues || 0
            ),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPerformanceMessage(
          "✅ Vendor performance saved successfully!"
        );

        setPerformanceForm({
          vendor: "",
          deliveryScore: "",
          qualityScore: "",
          complianceScore: "",
          totalOrders: "",
          onTimeOrders: "",
          qualityIssues: "",
          remarks: "",
        });

        await fetchPerformance();
      } else {
        setPerformanceMessage(
          data.message ||
            "❌ Failed to save performance"
        );
      }
    } catch (error) {
      console.error(error);

      setPerformanceMessage(
        "❌ Cannot connect to backend"
      );
    }
  };

  // =====================================================
  // CHART DATA
  // =====================================================

  const vendorChartData = dashboardStats
    ? [
        {
          name: "Approved",
          value: Number(
            dashboardStats?.vendors?.approved || 0
          ),
        },
        {
          name: "Pending",
          value: Number(
            dashboardStats?.vendors?.pending || 0
          ),
        },
        {
          name: "Rejected",
          value: Number(
            dashboardStats?.vendors?.rejected || 0
          ),
        },
      ]
    : [];

  const poChartData = dashboardStats
    ? [
        {
          name: "Draft",
          value: Number(
            dashboardStats?.purchaseOrders?.draft || 0
          ),
        },
        {
          name: "Pending",
          value: Number(
            dashboardStats?.purchaseOrders
              ?.pendingApproval || 0
          ),
        },
        {
          name: "Approved",
          value: Number(
            dashboardStats?.purchaseOrders?.approved || 0
          ),
        },
        {
          name: "Sent",
          value: Number(
            dashboardStats?.purchaseOrders?.sent || 0
          ),
        },
        {
          name: "Delivered",
          value: Number(
            dashboardStats?.purchaseOrders?.delivered || 0
          ),
        },
        {
          name: "Closed",
          value: Number(
            dashboardStats?.purchaseOrders?.closed || 0
          ),
        },
      ]
    : [];

  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="container">

      {/* HEADER */}

      <header className="header">
        <h1>🏢 Vendor Management System</h1>

        <p>
          Procurement & Vendor Management Portal
        </p>

        <div style={{ marginTop: "15px" }}>
          <span>
            Welcome,{" "}
            {user.name || user.email || "User"}
          </span>

          <button
            className="reject-btn"
            style={{ marginLeft: "15px" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* DASHBOARD */}

      <section className="section">
        <h2>📊 Dashboard</h2>

        {!dashboardStats ? (
          <p>Loading dashboard...</p>
        ) : (
          <>
            <div className="vendor-grid">

              <div className="vendor-card">
                <h3>👥 Total Vendors</h3>
                <h1>
                  {dashboardStats?.vendors?.total || 0}
                </h1>
              </div>

              <div className="vendor-card">
                <h3>✅ Approved Vendors</h3>
                <h1>
                  {dashboardStats?.vendors?.approved || 0}
                </h1>
              </div>

              <div className="vendor-card">
                <h3>⏳ Pending Vendors</h3>
                <h1>
                  {dashboardStats?.vendors?.pending || 0}
                </h1>
              </div>

              <div className="vendor-card">
                <h3>📦 Total Purchase Orders</h3>
                <h1>
                  {dashboardStats?.purchaseOrders?.total || 0}
                </h1>
              </div>

            </div>

            <div
              className="vendor-grid"
              style={{ marginTop: "20px" }}
            >

              <div className="vendor-card">
                <h3>📝 Draft POs</h3>
                <h2>
                  {dashboardStats?.purchaseOrders?.draft || 0}
                </h2>
              </div>

              <div className="vendor-card">
                <h3>👍 Approved POs</h3>
                <h2>
                  {dashboardStats?.purchaseOrders?.approved || 0}
                </h2>
              </div>

              <div className="vendor-card">
                <h3>🚚 Delivered POs</h3>
                <h2>
                  {dashboardStats?.purchaseOrders?.delivered || 0}
                </h2>
              </div>

              <div className="vendor-card">
                <h3>💰 Total PO Value</h3>
                <h2>
                  ₹
                  {Number(
                    dashboardStats?.totalPOValue || 0
                  ).toLocaleString("en-IN")}
                </h2>
              </div>

            </div>

            {/* CHARTS */}

            <div className="chart-grid">

              <div className="chart-card">
                <h3>👥 Vendor Status</h3>

                {vendorChartData.some(
                  (item) => item.value > 0
                ) ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <PieChart>

                      <Pie
                        data={vendorChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      />

                      <Tooltip />
                      <Legend />

                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No vendor data available.</p>
                )}
              </div>

              <div className="chart-card">
                <h3>📦 Purchase Order Status</h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart data={poChartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      name="Purchase Orders"
                    />

                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* VENDOR SUMMARY */}

            <div
              className="vendor-card"
              style={{ marginTop: "20px" }}
            >
              <h3>👥 Vendor Status Summary</h3>

              <p>
                🟢 Approved:{" "}
                {dashboardStats?.vendors?.approved || 0}
              </p>

              <p>
                🟡 Pending:{" "}
                {dashboardStats?.vendors?.pending || 0}
              </p>

              <p>
                🔴 Rejected:{" "}
                {dashboardStats?.vendors?.rejected || 0}
              </p>
            </div>

            {/* PO SUMMARY */}

            <div
              className="vendor-card"
              style={{ marginTop: "20px" }}
            >
              <h3>📦 Purchase Order Summary</h3>

              <p>
                📝 Draft:{" "}
                {dashboardStats?.purchaseOrders?.draft || 0}
              </p>

              <p>
                ⏳ Pending Approval:{" "}
                {dashboardStats?.purchaseOrders
                  ?.pendingApproval || 0}
              </p>

              <p>
                👍 Approved:{" "}
                {dashboardStats?.purchaseOrders?.approved || 0}
              </p>

              <p>
                📤 Sent:{" "}
                {dashboardStats?.purchaseOrders?.sent || 0}
              </p>

              <p>
                🚚 Delivered:{" "}
                {dashboardStats?.purchaseOrders?.delivered || 0}
              </p>

              <p>
                ✅ Closed:{" "}
                {dashboardStats?.purchaseOrders?.closed || 0}
              </p>
            </div>
          </>
        )}
      </section>

      {/* VENDOR REGISTRATION */}

      <section className="section">
        <h2>🏢 Vendor Registration</h2>

        <form
          onSubmit={handleSubmit}
          className="form-grid"
        >

          <input
            name="companyName"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={handleChange}
            required
          />

          <input
            name="contactPerson"
            placeholder="Contact Person"
            value={formData.contactPerson}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <input
            name="gstNumber"
            placeholder="GST Number"
            value={formData.gstNumber}
            onChange={handleChange}
            required
          />

          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="full-width"
            required
          />

          <input
            name="gstCertificate"
            placeholder="GST Certificate"
            value={formData.gstCertificate}
            onChange={handleChange}
          />

          <input
            name="businessRegistration"
            placeholder="Business Registration"
            value={formData.businessRegistration}
            onChange={handleChange}
          />

          <input
            name="isoCertificate"
            placeholder="ISO Certificate"
            value={formData.isoCertificate}
            onChange={handleChange}
          />

          <button
            className="submit-btn"
            type="submit"
          >
            Submit Application
          </button>

        </form>

        {message && (
          <p className="message">{message}</p>
        )}
      </section>

      {/* VENDOR APPROVAL */}

      <section className="section">
        <h2>👨‍💼 Vendor Approval Queue</h2>

        {vendors.length === 0 ? (
          <p>No vendors found.</p>
        ) : (
          <div className="vendor-grid">

            {vendors.map((vendor) => (
              <div
                className="vendor-card"
                key={vendor._id}
              >

                <h3>{vendor.companyName}</h3>

                <p>
                  Contact: {vendor.contactPerson}
                </p>

                <p>
                  Email: {vendor.email}
                </p>

                <p>
                  GST: {vendor.gstNumber}
                </p>

                <p>
                  Status:{" "}
                  <strong>{vendor.status}</strong>
                </p>

                {vendor.status !== "APPROVED" && (
                  <button
                    className="approve-btn"
                    onClick={() =>
                      updateVendorStatus(
                        vendor._id,
                        "APPROVED"
                      )
                    }
                  >
                    ✓ Approve
                  </button>
                )}

                {vendor.status !== "REJECTED" && (
                  <button
                    className="reject-btn"
                    onClick={() =>
                      updateVendorStatus(
                        vendor._id,
                        "REJECTED"
                      )
                    }
                  >
                    ✕ Reject
                  </button>
                )}

              </div>
            ))}

          </div>
        )}
      </section>

      {/* CREATE PURCHASE ORDER */}

      <section className="section">
        <h2>📦 Create Purchase Order</h2>

        <form onSubmit={handleCreatePO}>

          <div className="form-grid">

            <input
              name="poNumber"
              placeholder="PO Number"
              value={poData.poNumber}
              onChange={handlePoChange}
              required
            />

            <select
              name="vendor"
              value={poData.vendor}
              onChange={handlePoChange}
              required
            >

              <option value="">
                Select Approved Vendor
              </option>

              {vendors
                .filter(
                  (vendor) =>
                    vendor.status === "APPROVED"
                )
                .map((vendor) => (
                  <option
                    key={vendor._id}
                    value={vendor._id}
                  >
                    {vendor.companyName}
                  </option>
                ))}

            </select>

            <input
              type="date"
              name="expectedDeliveryDate"
              value={poData.expectedDeliveryDate}
              onChange={handlePoChange}
              required
            />

          </div>

          <h3>🛒 Items</h3>

          {poItems.map((item, index) => (
            <div
              className="form-grid"
              key={index}
            >

              <input
                placeholder="Product Name"
                value={item.productName}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "productName",
                    e.target.value
                  )
                }
                required
              />

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "quantity",
                    e.target.value
                  )
                }
                required
              />

              <input
                type="number"
                min="0"
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "unitPrice",
                    e.target.value
                  )
                }
                required
              />

              <button
                type="button"
                className="reject-btn"
                onClick={() =>
                  removePoItem(index)
                }
              >
                Remove
              </button>

            </div>
          ))}

          <button
            type="button"
            className="submit-btn"
            onClick={addPoItem}
          >
            + Add Item
          </button>

          <h3>
            Total Amount: ₹
            {calculateTotal().toLocaleString("en-IN")}
          </h3>

          <textarea
            name="notes"
            placeholder="Notes"
            value={poData.notes}
            onChange={handlePoChange}
          />

          <button
            className="submit-btn"
            type="submit"
          >
            📦 Create Purchase Order
          </button>

        </form>

        {poMessage && (
          <p className="message">{poMessage}</p>
        )}
      </section>

      {/* PURCHASE ORDER LIFECYCLE */}

      <section className="section">
        <h2>🔄 Purchase Order Lifecycle</h2>

        {purchaseOrders.length === 0 ? (
          <p>No Purchase Orders found.</p>
        ) : (
          purchaseOrders.map((po) => {

            const currentIndex =
              getStatusIndex(po.status);

            const nextStatus =
              getNextStatus(po.status);

            return (
              <div
                className="po-card"
                key={po._id}
              >

                <h3
                  onClick={() =>
                    fetchPODetails(po._id)
                  }
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  📋 {po.poNumber}
                </h3>

                <p>
                  Vendor:{" "}
                  {po.vendor?.companyName || "Unknown"}
                </p>

                <p>
                  Total: ₹
                  {Number(
                    po.totalAmount || 0
                  ).toLocaleString("en-IN")}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    margin: "20px 0",
                  }}
                >

                  {PO_STATUSES.map(
                    (status, index) => (
                      <div
                        key={status}
                        className={
                          index === currentIndex
                            ? "po-status current"
                            : index < currentIndex
                            ? "po-status completed"
                            : "po-status"
                        }
                      >
                        {index < currentIndex
                          ? "✓ "
                          : ""}
                        {formatStatus(status)}
                      </div>
                    )
                  )}

                </div>

                <p>
                  <strong>Current Status:</strong>{" "}
                  {formatStatus(po.status)}
                </p>

                {nextStatus && (
                  <button
                    className="submit-btn"
                    onClick={() =>
                      updatePOStatus(
                        po._id,
                        nextStatus
                      )
                    }
                  >
                    Move to{" "}
                    {formatStatus(nextStatus)} →
                  </button>
                )}

              </div>
            );
          })
        )}
      </section>

      {/* PO DETAILS */}

      {selectedPO && poDetails && (
        <section className="section">

          <h2>📋 Purchase Order Details</h2>

          <button
            className="reject-btn"
            onClick={() => {
              setSelectedPO(null);
              setPoDetails(null);
            }}
          >
            ✕ Close
          </button>

          <hr />

          <h3>PO Information</h3>

          <p>
            <strong>PO Number:</strong>{" "}
            {poDetails.purchaseOrder?.poNumber}
          </p>

          <p>
            <strong>Vendor:</strong>{" "}
            {poDetails.purchaseOrder?.vendor
              ?.companyName || "Unknown"}
          </p>

          <p>
            <strong>Contact:</strong>{" "}
            {poDetails.purchaseOrder?.vendor
              ?.contactPerson || "-"}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {poDetails.purchaseOrder?.vendor
              ?.email || "-"}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {formatStatus(
              poDetails.purchaseOrder?.status
            )}
          </p>

          <p>
            <strong>Total:</strong>{" "}
            ₹
            {Number(
              poDetails.purchaseOrder?.totalAmount || 0
            ).toLocaleString("en-IN")}
          </p>

          <h3>🛒 Order Items</h3>

          {poDetails.items &&
          poDetails.items.length > 0 ? (
            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>

                {poDetails.items.map((item) => (
                  <tr key={item._id}>

                    <td>
                      {item.productName}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.unitPrice || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.totalPrice || 0
                      ).toLocaleString("en-IN")}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          ) : (
            <p>No items found.</p>
          )}

        </section>
      )}

      {/* VENDOR PERFORMANCE */}

      <section className="section">

        <h2>📊 Vendor Performance Scorecard</h2>

        <p>
          Evaluate vendors based on delivery,
          quality and compliance.
        </p>

        <form
          onSubmit={savePerformance}
          className="form-grid"
        >

          <select
            name="vendor"
            value={performanceForm.vendor}
            onChange={handlePerformanceChange}
            required
          >

            <option value="">
              Select Vendor
            </option>

            {vendors.map((vendor) => (
              <option
                key={vendor._id}
                value={vendor._id}
              >
                {vendor.companyName}
              </option>
            ))}

          </select>

          <input
            type="number"
            min="0"
            max="100"
            name="deliveryScore"
            placeholder="Enter Delivery Score"
            value={performanceForm.deliveryScore}
            onChange={handlePerformanceChange}
            required
          />

          <input
            type="number"
            min="0"
            max="100"
            name="qualityScore"
            placeholder="Enter Quality Score"
            value={performanceForm.qualityScore}
            onChange={handlePerformanceChange}
            required
          />

          <input
            type="number"
            min="0"
            max="100"
            name="complianceScore"
            placeholder="Enter Compliance Score"
            value={performanceForm.complianceScore}
            onChange={handlePerformanceChange}
            required
          />

          <input
            type="number"
            min="0"
            name="totalOrders"
            placeholder="Enter Total Orders"
            value={performanceForm.totalOrders}
            onChange={handlePerformanceChange}
            required
          />

          <input
            type="number"
            min="0"
            name="onTimeOrders"
            placeholder="Enter On-time Orders"
            value={performanceForm.onTimeOrders}
            onChange={handlePerformanceChange}
            required
          />

          <input
            type="number"
            min="0"
            name="qualityIssues"
            placeholder="Enter Quality Issues"
            value={performanceForm.qualityIssues}
            onChange={handlePerformanceChange}
            required
          />

          <textarea
            name="remarks"
            placeholder="Enter Remarks"
            value={performanceForm.remarks}
            onChange={handlePerformanceChange}
            className="full-width"
          />

          <div className="full-width">

            <h3>
              Overall Score:{" "}
              {calculatePerformanceScore()}%
            </h3>

          </div>

          <button
            type="submit"
            className="submit-btn"
          >
            💾 Save Performance
          </button>

        </form>

        {performanceMessage && (
          <p className="message">
            {performanceMessage}
          </p>
        )}

        <div
          className="vendor-grid"
          style={{ marginTop: "30px" }}
        >

          {performance.length === 0 ? (
            <p>No performance records yet.</p>
          ) : (
            performance.map((record) => (
              <div
                className="vendor-card"
                key={record._id}
              >

                <h3>
                  {record.vendor?.companyName ||
                    "Vendor"}
                </h3>

                <p>
                  📦 Delivery Score:{" "}
                  <strong>
                    {record.deliveryScore}%
                  </strong>
                </p>

                <p>
                  ⭐ Quality Score:{" "}
                  <strong>
                    {record.qualityScore}%
                  </strong>
                </p>

                <p>
                  📄 Compliance Score:{" "}
                  <strong>
                    {record.complianceScore}%
                  </strong>
                </p>

                <hr />

                <h2>
                  🏆 {record.overallScore}%
                </h2>

                <p>
                  Overall Performance
                </p>

                <p>
                  Total Orders:{" "}
                  {record.totalOrders}
                </p>

                <p>
                  On-time Orders:{" "}
                  {record.onTimeOrders}
                </p>

                <p>
                  Quality Issues:{" "}
                  {record.qualityIssues}
                </p>

                {record.remarks && (
                  <p>
                    <strong>Remarks:</strong>{" "}
                    {record.remarks}
                  </p>
                )}

              </div>
            ))
          )}

        </div>

      </section>

    </div>
  );
}

export default App;