import { useEffect, useState } from "react";
import "./ManagerPage.css";

const API = "https://procurax-o4mh.onrender.com/api";

const PO_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "DELIVERED",
  "CLOSED",
];

function ManagerPage({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH VENDORS
  // =====================================================

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API}/vendors`);
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setVendors(data);
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

      if (response.ok && Array.isArray(data)) {
        setPurchaseOrders(data);
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

      if (response.ok && Array.isArray(data)) {
        setPerformance(data);
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
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchVendors(),
        fetchPurchaseOrders(),
        fetchPerformance(),
        fetchDashboardStats(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

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
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchPurchaseOrders();
        await fetchDashboardStats();
      } else {
        alert(data.message || "Failed to update PO status");
      }
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "status-draft";

      case "PENDING_APPROVAL":
        return "status-pending";

      case "APPROVED":
        return "status-approved";

      case "SENT":
        return "status-sent";

      case "DELIVERED":
        return "status-delivered";

      case "CLOSED":
        return "status-closed";

      default:
        return "";
    }
  };

  const getNextStatus = (status) => {
    const index = PO_STATUSES.indexOf(status);

    if (index === -1 || index >= PO_STATUSES.length - 1) {
      return null;
    }

    return PO_STATUSES[index + 1];
  };

  // =====================================================
  // COUNTS
  // =====================================================

  const totalVendors =
    dashboardStats?.vendors?.total || vendors.length;

  const approvedVendors =
    dashboardStats?.vendors?.approved ||
    vendors.filter((v) => v.status === "APPROVED").length;

  const pendingVendors =
    dashboardStats?.vendors?.pending ||
    vendors.filter(
      (v) =>
        v.status === "PENDING" ||
        v.status === "UNDER_REVIEW"
    ).length;

  const totalPOs =
    dashboardStats?.purchaseOrders?.total ||
    purchaseOrders.length;

  const deliveredPOs =
    dashboardStats?.purchaseOrders?.delivered ||
    purchaseOrders.filter(
      (po) => po.status === "DELIVERED"
    ).length;

  const totalPOValue =
    dashboardStats?.totalPOValue ||
    purchaseOrders.reduce(
      (total, po) => total + Number(po.totalAmount || 0),
      0
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Manager Dashboard...</h3>
        <p>Please wait while we fetch your data.</p>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD PAGE
  // =====================================================

  const DashboardPage = () => (
    <>
      <div className="page-heading">
        <div>
          <h1>Manager Dashboard</h1>
          <p>
            Monitor vendors, purchase orders and supplier
            performance.
          </p>
        </div>
      </div>

      {/* STAT CARDS */}

      <div className="manager-stats">

        <div className="manager-stat-card">
          <div className="stat-icon purple">👥</div>

          <div>
            <p>Total Vendors</p>
            <h2>{totalVendors}</h2>
            <span>Registered vendors</span>
          </div>
        </div>

        <div className="manager-stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <p>Approved Vendors</p>
            <h2>{approvedVendors}</h2>
            <span>Active suppliers</span>
          </div>
        </div>

        <div className="manager-stat-card">
          <div className="stat-icon orange">⏳</div>

          <div>
            <p>Pending Vendors</p>
            <h2>{pendingVendors}</h2>
            <span>Awaiting approval</span>
          </div>
        </div>

        <div className="manager-stat-card">
          <div className="stat-icon blue">📦</div>

          <div>
            <p>Total Purchase Orders</p>
            <h2>{totalPOs}</h2>
            <span>All purchase orders</span>
          </div>
        </div>

      </div>

      <div className="manager-stats">

        <div className="manager-stat-card">
          <div className="stat-icon green">🚚</div>

          <div>
            <p>Delivered POs</p>
            <h2>{deliveredPOs}</h2>
            <span>Successfully delivered</span>
          </div>
        </div>

        <div className="manager-stat-card">
          <div className="stat-icon purple">₹</div>

          <div>
            <p>Total PO Value</p>
            <h2>
              ₹{Number(totalPOValue).toLocaleString("en-IN")}
            </h2>
            <span>Total order value</span>
          </div>
        </div>

      </div>

      {/* RECENT PURCHASE ORDERS */}

      <div className="manager-panel">

        <div className="panel-header">
          <div>
            <h2>📦 Recent Purchase Orders</h2>
            <p>Monitor the latest procurement activities.</p>
          </div>

          <button
            className="view-all-btn"
            onClick={() => setActivePage("purchase-orders")}
          >
            View All →
          </button>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>No Purchase Orders</h3>
            <p>No purchase orders have been created yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">

            <table className="manager-table">

              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {purchaseOrders.slice(0, 6).map((po) => (
                  <tr key={po._id}>

                    <td>
                      <strong>{po.poNumber}</strong>
                    </td>

                    <td>
                      {po.vendor?.companyName || "Unknown"}
                    </td>

                    <td>
                      ₹
                      {Number(
                        po.totalAmount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      {po.expectedDeliveryDate
                        ? new Date(
                            po.expectedDeliveryDate
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          po.status
                        )}`}
                      >
                        {formatStatus(po.status)}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* PERFORMANCE OVERVIEW */}

      <div className="manager-panel">

        <div className="panel-header">

          <div>
            <h2>⭐ Vendor Performance</h2>
            <p>
              Quick overview of supplier performance.
            </p>
          </div>

          <button
            className="view-all-btn"
            onClick={() => setActivePage("performance")}
          >
            View Performance →
          </button>

        </div>

        {performance.length === 0 ? (
          <div className="empty-state">
            <div>⭐</div>
            <h3>No Performance Records</h3>
            <p>
              Vendor performance records will appear here.
            </p>
          </div>
        ) : (
          <div className="performance-grid">

            {performance.slice(0, 4).map((record) => (

              <div
                className="performance-mini-card"
                key={record._id}
              >

                <div className="performance-top">

                  <div className="vendor-avatar">
                    {(record.vendor?.companyName ||
                      "V")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>
                      {record.vendor?.companyName ||
                        "Vendor"}
                    </h3>

                    <p>Overall Performance</p>
                  </div>

                </div>

                <div className="score-circle">
                  {record.overallScore || 0}%
                </div>

                <div className="score-row">

                  <span>
                    Delivery
                    <strong>
                      {record.deliveryScore || 0}%
                    </strong>
                  </span>

                  <span>
                    Quality
                    <strong>
                      {record.qualityScore || 0}%
                    </strong>
                  </span>

                  <span>
                    Compliance
                    <strong>
                      {record.complianceScore || 0}%
                    </strong>
                  </span>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </>
  );

  // =====================================================
  // PURCHASE ORDERS PAGE
  // =====================================================

  const PurchaseOrdersPage = () => (
    <>
      <div className="page-heading">

        <div>
          <h1>Purchase Orders</h1>
          <p>
            Monitor and manage purchase order lifecycle.
          </p>
        </div>

        <div className="heading-count">
          {purchaseOrders.length} Orders
        </div>

      </div>

      <div className="manager-panel">

        {purchaseOrders.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>No Purchase Orders Found</h3>
            <p>
              Purchase orders will appear here once created.
            </p>
          </div>
        ) : (

          <div className="po-list">

            {purchaseOrders.map((po) => {

              const nextStatus =
                getNextStatus(po.status);

              const currentIndex =
                PO_STATUSES.indexOf(po.status);

              return (

                <div
                  className="manager-po-card"
                  key={po._id}
                >

                  <div className="po-main">

                    <div className="po-title-row">

                      <div>
                        <span className="po-label">
                          PURCHASE ORDER
                        </span>

                        <h2>{po.poNumber}</h2>
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          po.status
                        )}`}
                      >
                        {formatStatus(po.status)}
                      </span>

                    </div>

                    <div className="po-info-grid">

                      <div>
                        <span>Vendor</span>
                        <strong>
                          {po.vendor?.companyName ||
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>Total Amount</span>
                        <strong>
                          ₹
                          {Number(
                            po.totalAmount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Expected Delivery</span>
                        <strong>
                          {po.expectedDeliveryDate
                            ? new Date(
                                po.expectedDeliveryDate
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </strong>
                      </div>

                    </div>

                    {/* LIFECYCLE */}

                    <div className="po-lifecycle">

                      {PO_STATUSES.map(
                        (status, index) => (

                          <div
                            className={`lifecycle-step ${
                              index <= currentIndex
                                ? "completed"
                                : ""
                            } ${
                              index === currentIndex
                                ? "active"
                                : ""
                            }`}
                            key={status}
                          >

                            <div className="lifecycle-dot">
                              {index < currentIndex
                                ? "✓"
                                : index + 1}
                            </div>

                            <span>
                              {formatStatus(status)}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                    {nextStatus && (
                      <button
                        className="next-status-btn"
                        onClick={() =>
                          updatePOStatus(
                            po._id,
                            nextStatus
                          )
                        }
                      >
                        Move to{" "}
                        {formatStatus(nextStatus)}
                        {" →"}
                      </button>
                    )}

                    {!nextStatus && (
                      <div className="completed-message">
                        ✓ Purchase order lifecycle completed
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>
    </>
  );

  // =====================================================
  // PERFORMANCE PAGE
  // =====================================================

  const PerformancePage = () => (
    <>
      <div className="page-heading">

        <div>
          <h1>Vendor Performance</h1>
          <p>
            Evaluate and monitor supplier performance.
          </p>
        </div>

        <div className="heading-count">
          {performance.length} Records
        </div>

      </div>

      {performance.length === 0 ? (

        <div className="manager-panel">

          <div className="empty-state">
            <div>⭐</div>
            <h3>No Performance Records</h3>
            <p>
              Performance records have not been added yet.
            </p>
          </div>

        </div>

      ) : (

        <div className="performance-page-grid">

          {performance.map((record) => (

            <div
              className="performance-card"
              key={record._id}
            >

              <div className="performance-card-header">

                <div className="vendor-avatar large">
                  {(record.vendor?.companyName ||
                    "V")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2>
                    {record.vendor?.companyName ||
                      "Vendor"}
                  </h2>

                  <p>Vendor Performance Scorecard</p>
                </div>

              </div>

              <div className="overall-score">

                <div className="score-number">
                  {record.overallScore || 0}%
                </div>

                <div>
                  <strong>Overall Score</strong>
                  <p>
                    Overall supplier performance
                  </p>
                </div>

              </div>

              <div className="metric">

                <div className="metric-label">
                  <span>Delivery</span>
                  <strong>
                    {record.deliveryScore || 0}%
                  </strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${record.deliveryScore || 0}%`,
                    }}
                  ></div>
                </div>

              </div>

              <div className="metric">

                <div className="metric-label">
                  <span>Quality</span>
                  <strong>
                    {record.qualityScore || 0}%
                  </strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${record.qualityScore || 0}%`,
                    }}
                  ></div>
                </div>

              </div>

              <div className="metric">

                <div className="metric-label">
                  <span>Compliance</span>
                  <strong>
                    {record.complianceScore || 0}%
                  </strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${record.complianceScore || 0}%`,
                    }}
                  ></div>
                </div>

              </div>

              <div className="performance-details">

                <div>
                  <span>Total Orders</span>
                  <strong>
                    {record.totalOrders || 0}
                  </strong>
                </div>

                <div>
                  <span>On-time Orders</span>
                  <strong>
                    {record.onTimeOrders || 0}
                  </strong>
                </div>

                <div>
                  <span>Quality Issues</span>
                  <strong>
                    {record.qualityIssues || 0}
                  </strong>
                </div>

              </div>

              {record.remarks && (
                <div className="remarks-box">
                  <strong>Remarks</strong>
                  <p>{record.remarks}</p>
                </div>
              )}

            </div>

          ))}

        </div>

      )}
    </>
  );

  // =====================================================
  // PROFILE PAGE
  // =====================================================

  const ProfilePage = () => (
    <>
      <div className="page-heading">

        <div>
          <h1>My Profile</h1>
          <p>Manager account information.</p>
        </div>

      </div>

      <div className="profile-card">

        <div className="profile-avatar">
          {(user?.name || "M")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="profile-info">

          <h2>
            {user?.name || "Manager"}
          </h2>

          <span className="role-pill">
            👨‍💼 MANAGER
          </span>

          <div className="profile-details">

            <div>
              <span>Name</span>
              <strong>
                {user?.name || "-"}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {user?.email || "-"}
              </strong>
            </div>

            <div>
              <span>Role</span>
              <strong>Manager</strong>
            </div>

          </div>

        </div>

      </div>
    </>
  );

  // =====================================================
  // PAGE CONTENT
  // =====================================================

  const renderPage = () => {

    switch (activePage) {

      case "dashboard":
        return <DashboardPage />;

      case "purchase-orders":
        return <PurchaseOrdersPage />;

      case "performance":
        return <PerformancePage />;

      case "profile":
        return <ProfilePage />;

      default:
        return <DashboardPage />;
    }
  };

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="manager-layout">

      {/* SIDEBAR */}

      <aside className="manager-sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            V
          </div>

          <div>
            <h2>VendorMS</h2>
            <span>Management System</span>
          </div>

        </div>

        <div className="sidebar-role">
          <span>LOGGED IN AS</span>
          <strong>👨‍💼 Manager</strong>
        </div>

        <nav className="manager-nav">

          <button
            className={
              activePage === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            <span>📊</span>
            Dashboard
          </button>

          <button
            className={
              activePage === "purchase-orders"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("purchase-orders")
            }
          >
            <span>📦</span>
            Purchase Orders
          </button>

          <button
            className={
              activePage === "performance"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("performance")
            }
          >
            <span>⭐</span>
            Vendor Performance
          </button>

          <button
            className={
              activePage === "profile"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("profile")
            }
          >
            <span>👤</span>
            My Profile
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="small-avatar">
              {(user?.name || "M")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || "Manager"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            <span>🚪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="manager-main">

        <header className="manager-topbar">

          <div>
            <span className="breadcrumb">
              Vendor Management System
            </span>

            <span className="breadcrumb-arrow">
              /
            </span>

            <strong>
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "purchase-orders" &&
                "Purchase Orders"}

              {activePage === "performance" &&
                "Vendor Performance"}

              {activePage === "profile" &&
                "My Profile"}
            </strong>
          </div>

          <div className="topbar-user">

            <div className="topbar-avatar">
              {(user?.name || "M")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || "Manager"}
              </strong>

              <span>Manager</span>
            </div>

          </div>

        </header>

        <div className="manager-content">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}

export default ManagerPage;