import { useEffect, useMemo, useState } from "react";
import "./AdminPage.css";

const API = "http://localhost:5000/api";

const PO_FILTERS = [
  "ALL",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SENT",
  "DELIVERED",
  "CLOSED",
];

function AdminPage({ user, onLogout }) {
  // =====================================================
  // STATE
  // =====================================================

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [activeSection, setActiveSection] = useState("overview");

  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [poSearch, setPoSearch] = useState("");

  const [orderFilter, setOrderFilter] = useState("ALL");

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [selectedPO, setSelectedPO] =
    useState(null);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  // =====================================================
  // FETCH ALL DATA
  // =====================================================

  const fetchAllData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchVendors(),
        fetchProducts(),
        fetchPurchaseOrders(),
      ]);
    } catch (error) {
      console.error("Fetch all data error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    window.clearTimeout(showMessage.timer);

    showMessage.timer = window.setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  // =====================================================
  // FETCH VENDORS
  // =====================================================

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API}/vendors`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch vendors"
        );
      }

      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch vendors error:", error);
      setVendors([]);
    }
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch products error:", error);
      setProducts([]);
    }
  };

  // =====================================================
  // FETCH PURCHASE ORDERS
  // =====================================================

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(
        `${API}/purchase-orders`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch purchase orders"
        );
      }

      setPurchaseOrders(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Fetch purchase orders error:",
        error
      );

      setPurchaseOrders([]);
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchVendors(),
        fetchProducts(),
        fetchPurchaseOrders(),
      ]);

      showMessage(
        "Dashboard refreshed successfully.",
        "success"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const statusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // UPDATE VENDOR STATUS
  // =====================================================

  const updateVendorStatus = async (
    vendorId,
    status
  ) => {
    const action =
      status === "APPROVED"
        ? "approve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this vendor?`
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API}/vendors/${vendorId}`,
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

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update vendor"
        );
      }

      showMessage(
        `Vendor ${action}d successfully.`,
        "success"
      );

      await fetchVendors();
    } catch (error) {
      console.error(
        "Vendor status error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot connect to backend.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // APPROVE PURCHASE ORDER
  // =====================================================

  const approvePurchaseOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this Purchase Order?"
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API}/purchase-orders/${orderId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to approve Purchase Order"
        );
      }

      showMessage(
        "Purchase Order approved successfully.",
        "success"
      );

      await fetchPurchaseOrders();
    } catch (error) {
      console.error(
        "Approve PO error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot connect to backend.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // OPEN REJECT MODAL
  // =====================================================

  const openRejectModal = (order) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // =====================================================
  // CLOSE REJECT MODAL
  // =====================================================

  const closeRejectModal = () => {
    if (actionLoading) return;

    setShowRejectModal(false);
    setSelectedOrder(null);
    setRejectionReason("");
  };

  // =====================================================
  // REJECT PURCHASE ORDER
  // =====================================================

  const rejectPurchaseOrder = async () => {
    if (!selectedOrder) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      showMessage(
        "Please provide a rejection reason.",
        "error"
      );
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API}/purchase-orders/${selectedOrder._id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to reject Purchase Order"
        );
      }

      showMessage(
        "Purchase Order rejected successfully.",
        "success"
      );

      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectionReason("");

      await fetchPurchaseOrders();
    } catch (error) {
      console.error(
        "Reject PO error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot connect to backend.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // SEND PO TO VENDOR
  // =====================================================

  const sendPurchaseOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Send this approved Purchase Order to the vendor?"
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API}/purchase-orders/${orderId}/send`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send Purchase Order"
        );
      }

      showMessage(
        "Purchase Order sent to vendor successfully.",
        "success"
      );

      await fetchPurchaseOrders();
    } catch (error) {
      console.error(
        "Send PO error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot connect to backend.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // FILTER VENDORS
  // =====================================================

  const filteredVendors = useMemo(() => {
    const search = vendorSearch
      .trim()
      .toLowerCase();

    if (!search) return vendors;

    return vendors.filter((vendor) =>
      [
        vendor.companyName,
        vendor.contactPerson,
        vendor.email,
        vendor.phone,
        vendor.gstNumber,
        vendor.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        )
    );
  }, [vendors, vendorSearch]);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    const search = productSearch
      .trim()
      .toLowerCase();

    if (!search) return products;

    return products.filter((product) =>
      [
        product.productName,
        product.category,
        product.sku,
        product.description,
        product.vendor?.companyName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        )
    );
  }, [products, productSearch]);

  // =====================================================
  // FILTER PURCHASE ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const search = poSearch
      .trim()
      .toLowerCase();

    return purchaseOrders.filter((order) => {
      const matchesStatus =
        orderFilter === "ALL" ||
        String(order.status).toUpperCase() ===
          orderFilter;

      const matchesSearch =
        !search ||
        [
          order.poNumber,
          order.customer?.name,
          order.customer?.email,
          order.vendor?.companyName,
          order.vendor?.contactPerson,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          );

      return matchesStatus && matchesSearch;
    });
  }, [
    purchaseOrders,
    orderFilter,
    poSearch,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const vendorStatus = (status) =>
      vendors.filter(
        (vendor) =>
          String(vendor.status).toUpperCase() ===
          status
      ).length;

    const poStatus = (status) =>
      purchaseOrders.filter(
        (order) =>
          String(order.status).toUpperCase() ===
          status
      ).length;

    const orderValue = purchaseOrders.reduce(
      (total, order) =>
        total +
        Number(order.totalAmount || 0),
      0
    );

    const pendingValue =
      purchaseOrders
        .filter(
          (order) =>
            String(order.status).toUpperCase() ===
            "PENDING_APPROVAL"
        )
        .reduce(
          (total, order) =>
            total +
            Number(order.totalAmount || 0),
          0
        );

    const deliveredValue =
      purchaseOrders
        .filter(
          (order) =>
            String(order.status).toUpperCase() ===
            "DELIVERED"
        )
        .reduce(
          (total, order) =>
            total +
            Number(order.totalAmount || 0),
          0
        );

    const outOfStock = products.filter(
      (product) =>
        Number(product.quantity || 0) === 0
    ).length;

    return {
      totalVendors: vendors.length,
      approvedVendors: vendorStatus("APPROVED"),
      pendingVendors:
        vendorStatus("PENDING"),
      rejectedVendors:
        vendorStatus("REJECTED"),

      totalProducts: products.length,
      outOfStock,

      totalOrders: purchaseOrders.length,
      pendingOrders:
        poStatus("PENDING_APPROVAL"),
      approvedOrders:
        poStatus("APPROVED"),
      rejectedOrders:
        poStatus("REJECTED"),
      sentOrders: poStatus("SENT"),
      deliveredOrders:
        poStatus("DELIVERED"),
      closedOrders: poStatus("CLOSED"),

      orderValue,
      pendingValue,
      deliveredValue,
    };
  }, [vendors, products, purchaseOrders]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-loading-page">
        <div className="admin-loading-card">
          <div className="admin-loading-logo">
            🛡️
          </div>

          <div className="admin-spinner"></div>

          <h2>
            Loading Admin Dashboard
          </h2>

          <p>
            Fetching vendors, products and
            purchase orders...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="admin-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            🛡️
          </div>

          <div>
            <h1>VMS</h1>
            <span>Admin Portal</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">

          <button
            className={
              activeSection === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveSection("overview")
            }
          >
            <span>📊</span>
            Dashboard
          </button>

          <button
            className={
              activeSection === "vendors"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveSection("vendors")
            }
          >
            <span>🏢</span>
            Vendors

            {stats.pendingVendors > 0 && (
              <b>
                {stats.pendingVendors}
              </b>
            )}
          </button>

          <button
            className={
              activeSection === "products"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveSection("products")
            }
          >
            <span>📦</span>
            Products
          </button>

          <button
            className={
              activeSection === "orders"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveSection("orders")
            }
          >
            <span>🛒</span>
            Purchase Orders

            {stats.pendingOrders > 0 && (
              <b>
                {stats.pendingOrders}
              </b>
            )}
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-info">
            <span>System Status</span>
            <strong>
              <i></i>
              Operational
            </strong>
          </div>

          <button
            className="sidebar-logout"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="admin-main">

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="admin-topbar">

          <div className="topbar-title">
            <span>
              VENDOR MANAGEMENT SYSTEM
            </span>

            <h2>
              {activeSection === "overview" &&
                "Admin Dashboard"}

              {activeSection === "vendors" &&
                "Vendor Management"}

              {activeSection === "products" &&
                "Product Management"}

              {activeSection === "orders" &&
                "Purchase Order Control"}
            </h2>
          </div>

          <div className="topbar-actions">

            <button
              className="topbar-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              {refreshing
                ? "⟳"
                : "↻"}
            </button>

            <div className="topbar-user">

              <div className="topbar-avatar">
                {(user?.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {user?.name ||
                    "Administrator"}
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            className={`admin-toast ${messageType}`}
          >
            <span>
              {messageType === "success"
                ? "✓"
                : "⚠"}
            </span>

            <p>{message}</p>

            <button
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="admin-content">

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeSection === "overview" && (
            <>

              <section className="dashboard-hero">

                <div>
                  <span>
                    ADMINISTRATOR
                  </span>

                  <h1>
                    Welcome back,{" "}
                    {user?.name ||
                      "Admin"}{" "}
                    👋
                  </h1>

                  <p>
                    Manage vendors, monitor
                    products and control the
                    complete purchase order
                    workflow from one place.
                  </p>
                </div>

                <div className="hero-summary">
                  <div className="hero-summary-icon">
                    📈
                  </div>

                  <div>
                    <span>
                      Pending Approval
                    </span>

                    <strong>
                      {stats.pendingOrders}
                    </strong>

                    <small>
                      Purchase orders
                    </small>
                  </div>
                </div>

              </section>

              {/* STATS */}

              <section className="dashboard-stats">

                <div className="dashboard-stat blue">
                  <div className="dashboard-stat-icon">
                    🏢
                  </div>

                  <div>
                    <span>
                      Total Vendors
                    </span>

                    <strong>
                      {stats.totalVendors}
                    </strong>

                    <small>
                      {stats.approvedVendors} approved
                    </small>
                  </div>
                </div>

                <div className="dashboard-stat purple">
                  <div className="dashboard-stat-icon">
                    📦
                  </div>

                  <div>
                    <span>
                      Products
                    </span>

                    <strong>
                      {stats.totalProducts}
                    </strong>

                    <small>
                      {stats.outOfStock} out of stock
                    </small>
                  </div>
                </div>

                <div className="dashboard-stat orange">
                  <div className="dashboard-stat-icon">
                    🛒
                  </div>

                  <div>
                    <span>
                      Purchase Orders
                    </span>

                    <strong>
                      {stats.totalOrders}
                    </strong>

                    <small>
                      {stats.pendingOrders} pending
                    </small>
                  </div>
                </div>

                <div className="dashboard-stat green">
                  <div className="dashboard-stat-icon">
                    💰
                  </div>

                  <div>
                    <span>
                      Total Order Value
                    </span>

                    <strong>
                      {formatCurrency(
                        stats.orderValue
                      )}
                    </strong>

                    <small>
                      All purchase orders
                    </small>
                  </div>
                </div>

              </section>

              {/* QUICK ACTIONS */}

              <section className="quick-actions-section">

                <div className="section-heading">
                  <div>
                    <span>
                      QUICK ACCESS
                    </span>

                    <h2>
                      Manage System
                    </h2>
                  </div>
                </div>

                <div className="quick-actions">

                  <button
                    onClick={() =>
                      setActiveSection(
                        "vendors"
                      )
                    }
                  >
                    <div className="quick-icon blue">
                      🏢
                    </div>

                    <div>
                      <strong>
                        Vendors
                      </strong>

                      <span>
                        Review registrations
                      </span>
                    </div>

                    <b>→</b>
                  </button>

                  <button
                    onClick={() =>
                      setActiveSection(
                        "products"
                      )
                    }
                  >
                    <div className="quick-icon purple">
                      📦
                    </div>

                    <div>
                      <strong>
                        Products
                      </strong>

                      <span>
                        View vendor products
                      </span>
                    </div>

                    <b>→</b>
                  </button>

                  <button
                    onClick={() =>
                      setActiveSection(
                        "orders"
                      )
                    }
                  >
                    <div className="quick-icon orange">
                      🛒
                    </div>

                    <div>
                      <strong>
                        Purchase Orders
                      </strong>

                      <span>
                        Review PO approvals
                      </span>
                    </div>

                    <b>→</b>
                  </button>

                </div>

              </section>

              {/* WORKFLOW */}

              <section className="workflow-section">

                <div className="section-heading">
                  <div>
                    <span>
                      PROCUREMENT WORKFLOW
                    </span>

                    <h2>
                      Purchase Order Lifecycle
                    </h2>

                    <p>
                      Admin approval is the
                      control point before an
                      approved PO reaches the
                      vendor.
                    </p>
                  </div>
                </div>

                <div className="admin-workflow">

                  <div className="workflow-card">
                    <div className="workflow-number">
                      01
                    </div>

                    <div className="workflow-icon">
                      👤
                    </div>

                    <strong>
                      Customer
                    </strong>

                    <span>
                      Places Order
                    </span>
                  </div>

                  <div className="workflow-arrow">
                    →
                  </div>

                  <div className="workflow-card">
                    <div className="workflow-number">
                      02
                    </div>

                    <div className="workflow-icon">
                      🧑‍💼
                    </div>

                    <strong>
                      Procurement Officer
                    </strong>

                    <span>
                      Creates PO
                    </span>
                  </div>

                  <div className="workflow-arrow">
                    →
                  </div>

                  <div className="workflow-card highlight">
                    <div className="workflow-number">
                      03
                    </div>

                    <div className="workflow-icon">
                      🛡️
                    </div>

                    <strong>
                      Admin
                    </strong>

                    <span>
                      Approves / Rejects
                    </span>
                  </div>

                  <div className="workflow-arrow">
                    →
                  </div>

                  <div className="workflow-card">
                    <div className="workflow-number">
                      04
                    </div>

                    <div className="workflow-icon">
                      🏢
                    </div>

                    <strong>
                      Vendor
                    </strong>

                    <span>
                      Receives PO
                    </span>
                  </div>

                  <div className="workflow-arrow">
                    →
                  </div>

                  <div className="workflow-card">
                    <div className="workflow-number">
                      05
                    </div>

                    <div className="workflow-icon">
                      🚚
                    </div>

                    <strong>
                      Delivery
                    </strong>

                    <span>
                      Order Completed
                    </span>
                  </div>

                </div>

              </section>

              {/* RECENT POs */}

              <section className="recent-section">

                <div className="section-heading">

                  <div>
                    <span>
                      RECENT ACTIVITY
                    </span>

                    <h2>
                      Recent Purchase Orders
                    </h2>
                  </div>

                  <button
                    className="outline-action"
                    onClick={() =>
                      setActiveSection(
                        "orders"
                      )
                    }
                  >
                    View All →
                  </button>

                </div>

                {purchaseOrders.length ===
                0 ? (
                  <EmptyState
                    icon="🛒"
                    title="No Purchase Orders"
                    text="Purchase orders created by the Procurement Officer will appear here."
                  />
                ) : (
                  <div className="recent-po-list">

                    {purchaseOrders
                      .slice(0, 5)
                      .map((order) => (
                        <div
                          className="recent-po-item"
                          key={order._id}
                        >
                          <div className="recent-po-icon">
                            📋
                          </div>

                          <div className="recent-po-info">
                            <strong>
                              {order.poNumber ||
                                "Purchase Order"}
                            </strong>

                            <span>
                              {order.vendor
                                ?.companyName ||
                                "Vendor"}{" "}
                              •{" "}
                              {formatDate(
                                order.createdAt
                              )}
                            </span>
                          </div>

                          <span
                            className={`status-badge ${statusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>

                          <strong className="recent-po-amount">
                            {formatCurrency(
                              order.totalAmount
                            )}
                          </strong>
                        </div>
                      ))}

                  </div>
                )}

              </section>

            </>
          )}

          {/* =================================================
              VENDORS
          ================================================= */}

          {activeSection === "vendors" && (
            <section className="management-section">

              <div className="management-header">

                <div>
                  <span>
                    VENDOR MANAGEMENT
                  </span>

                  <h1>
                    Registered Vendors
                  </h1>

                  <p>
                    Review and manage vendors
                    registered in the system.
                  </p>
                </div>

                <div className="management-count">
                  <strong>
                    {vendors.length}
                  </strong>

                  <span>
                    Total Vendors
                  </span>
                </div>

              </div>

              <div className="management-toolbar">

                <div className="search-box">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search company, contact, email..."
                    value={vendorSearch}
                    onChange={(e) =>
                      setVendorSearch(
                        e.target.value
                      )
                    }
                  />

                  {vendorSearch && (
                    <button
                      onClick={() =>
                        setVendorSearch("")
                      }
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  className="toolbar-refresh"
                  onClick={fetchVendors}
                  disabled={actionLoading}
                >
                  ↻ Refresh
                </button>

              </div>

              {filteredVendors.length ===
              0 ? (
                <EmptyState
                  icon="🏢"
                  title="No Vendors Found"
                  text={
                    vendorSearch
                      ? "Try a different search term."
                      : "Vendor registrations will appear here."
                  }
                />
              ) : (
                <div className="data-table-card">

                  <div className="table-scroll">

                    <table className="admin-data-table">

                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Contact</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredVendors.map(
                          (vendor) => (
                            <tr
                              key={
                                vendor._id
                              }
                            >

                              <td>
                                <div className="vendor-table-name">

                                  <div className="vendor-mini-avatar">
                                    {(vendor.companyName ||
                                      "V")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div>
                                    <strong>
                                      {vendor.companyName ||
                                        "Unnamed Company"}
                                    </strong>

                                    <small>
                                      {vendor.gstNumber
                                        ? `GST: ${vendor.gstNumber}`
                                        : "GST not provided"}
                                    </small>
                                  </div>

                                </div>
                              </td>

                              <td>
                                {vendor.contactPerson ||
                                  "—"}
                              </td>

                              <td>
                                {vendor.email ||
                                  "—"}
                              </td>

                              <td>
                                {vendor.phone ||
                                  "—"}
                              </td>

                              <td>
                                {vendor.category ||
                                  "General"}
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${statusClass(
                                    vendor.status
                                  )}`}
                                >
                                  {formatStatus(
                                    vendor.status
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="table-actions">

                                  <button
                                    className="table-approve"
                                    onClick={() =>
                                      updateVendorStatus(
                                        vendor._id,
                                        "APPROVED"
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                  >
                                    ✓
                                    <span>
                                      Approve
                                    </span>
                                  </button>

                                  <button
                                    className="table-reject"
                                    onClick={() =>
                                      updateVendorStatus(
                                        vendor._id,
                                        "REJECTED"
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                  >
                                    ×
                                    <span>
                                      Reject
                                    </span>
                                  </button>

                                </div>
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>
              )}

            </section>
          )}

          {/* =================================================
              PRODUCTS
          ================================================= */}

          {activeSection === "products" && (
            <section className="management-section">

              <div className="management-header">

                <div>
                  <span>
                    PRODUCT MANAGEMENT
                  </span>

                  <h1>
                    Vendor Product Catalog
                  </h1>

                  <p>
                    View products registered by
                    vendors and monitor stock.
                  </p>
                </div>

                <div className="management-count">
                  <strong>
                    {products.length}
                  </strong>

                  <span>
                    Total Products
                  </span>
                </div>

              </div>

              <div className="product-overview-strip">

                <div>
                  <span>
                    Total Products
                  </span>

                  <strong>
                    {stats.totalProducts}
                  </strong>
                </div>

                <div>
                  <span>
                    Active Stock
                  </span>

                  <strong>
                    {stats.totalProducts -
                      stats.outOfStock}
                  </strong>
                </div>

                <div>
                  <span>
                    Out of Stock
                  </span>

                  <strong className="danger-number">
                    {stats.outOfStock}
                  </strong>
                </div>

              </div>

              <div className="management-toolbar">

                <div className="search-box">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search product, SKU, category, vendor..."
                    value={productSearch}
                    onChange={(e) =>
                      setProductSearch(
                        e.target.value
                      )
                    }
                  />

                  {productSearch && (
                    <button
                      onClick={() =>
                        setProductSearch("")
                      }
                    >
                      ×
                    </button>
                  )}
                </div>

              </div>

              {filteredProducts.length ===
              0 ? (
                <EmptyState
                  icon="📦"
                  title="No Products Found"
                  text={
                    productSearch
                      ? "Try a different search term."
                      : "Products registered by vendors will appear here."
                  }
                />
              ) : (
                <div className="admin-products-grid">

                  {filteredProducts.map(
                    (product) => {

                      const stock =
                        Number(
                          product.quantity || 0
                        );

                      return (
                        <div
                          className="admin-product-card"
                          key={product._id}
                        >

                          <div className="admin-product-image">

                            {product.photo ? (
                              <img
                                src={
                                  product.photo
                                }
                                alt={
                                  product.productName ||
                                  "Product"
                                }
                              />
                            ) : (
                              <div className="product-image-placeholder">
                                📦
                              </div>
                            )}

                            <span
                              className={`product-stock-badge ${
                                stock === 0
                                  ? "out"
                                  : "in"
                              }`}
                            >
                              {stock === 0
                                ? "Out of Stock"
                                : "In Stock"}
                            </span>

                          </div>

                          <div className="admin-product-body">

                            <div className="product-category">
                              {product.category ||
                                "General"}
                            </div>

                            <h3>
                              {product.productName ||
                                "Unnamed Product"}
                            </h3>

                            <p>
                              {product.description ||
                                "No description available."}
                            </p>

                            <div className="product-vendor">
                              <span>
                                Vendor
                              </span>

                              <strong>
                                {product.vendor
                                  ?.companyName ||
                                  "Not assigned"}
                              </strong>
                            </div>

                            <div className="admin-product-footer">

                              <div>
                                <span>
                                  Unit Price
                                </span>

                                <strong>
                                  {formatCurrency(
                                    product.unitPrice
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Stock
                                </span>

                                <strong>
                                  {stock}
                                </strong>
                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>
          )}

          {/* =================================================
              PURCHASE ORDERS
          ================================================= */}

          {activeSection === "orders" && (
            <section className="management-section">

              <div className="management-header">

                <div>
                  <span>
                    PROCUREMENT CONTROL
                  </span>

                  <h1>
                    Purchase Orders
                  </h1>

                  <p>
                    Review POs created by the
                    Procurement Officer and
                    approve or reject them.
                  </p>
                </div>

                <div className="management-count orange-count">
                  <strong>
                    {stats.pendingOrders}
                  </strong>

                  <span>
                    Awaiting Approval
                  </span>
                </div>

              </div>

              {/* PO FILTERS */}

              <div className="po-filter-bar">

                {PO_FILTERS.map((filter) => {

                  const count =
                    filter === "ALL"
                      ? stats.totalOrders
                      : filter ===
                        "PENDING_APPROVAL"
                      ? stats.pendingOrders
                      : filter === "APPROVED"
                      ? stats.approvedOrders
                      : filter === "REJECTED"
                      ? stats.rejectedOrders
                      : filter === "SENT"
                      ? stats.sentOrders
                      : filter === "DELIVERED"
                      ? stats.deliveredOrders
                      : stats.closedOrders;

                  return (
                    <button
                      key={filter}
                      className={
                        orderFilter === filter
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setOrderFilter(filter)
                      }
                    >
                      <strong>
                        {count}
                      </strong>

                      <span>
                        {formatStatus(
                          filter
                        )}
                      </span>
                    </button>
                  );
                })}

              </div>

              {/* PO TOOLBAR */}

              <div className="management-toolbar">

                <div className="search-box">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search PO number, customer or vendor..."
                    value={poSearch}
                    onChange={(e) =>
                      setPoSearch(
                        e.target.value
                      )
                    }
                  />

                  {poSearch && (
                    <button
                      onClick={() =>
                        setPoSearch("")
                      }
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="po-value-mini">
                  <span>
                    Pending Value
                  </span>

                  <strong>
                    {formatCurrency(
                      stats.pendingValue
                    )}
                  </strong>
                </div>

              </div>

              {filteredOrders.length ===
              0 ? (
                <EmptyState
                  icon="🛒"
                  title="No Purchase Orders"
                  text={
                    poSearch
                      ? "Try a different search term."
                      : orderFilter ===
                        "PENDING_APPROVAL"
                      ? "There are no POs waiting for approval."
                      : "Purchase orders will appear here."
                  }
                />
              ) : (
                <div className="admin-po-list">

                  {filteredOrders.map(
                    (order) => {

                      const status =
                        String(
                          order.status || ""
                        ).toUpperCase();

                      const isPending =
                        status ===
                        "PENDING_APPROVAL";

                      const isApproved =
                        status === "APPROVED";

                      const isRejected =
                        status === "REJECTED";

                      return (
                        <div
                          className={`admin-po-card ${
                            isPending
                              ? "needs-action"
                              : ""
                          }`}
                          key={order._id}
                        >

                          <div className="po-card-main">

                            <div className="po-card-header">

                              <div>

                                <span>
                                  PURCHASE ORDER
                                </span>

                                <h3>
                                  📋{" "}
                                  {order.poNumber ||
                                    "PO Number"}
                                </h3>

                              </div>

                              <span
                                className={`status-badge large ${statusClass(
                                  order.status
                                )}`}
                              >
                                {formatStatus(
                                  order.status
                                )}
                              </span>

                            </div>

                            <div className="po-card-details">

                              <div>
                                <span>
                                  Customer
                                </span>

                                <strong>
                                  {order.customer
                                    ?.name ||
                                    order.customer
                                      ?.email ||
                                    "Not specified"}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Vendor
                                </span>

                                <strong>
                                  {order.vendor
                                    ?.companyName ||
                                    "Not specified"}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Expected Delivery
                                </span>

                                <strong>
                                  {formatDate(
                                    order.expectedDeliveryDate
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Created
                                </span>

                                <strong>
                                  {formatDate(
                                    order.createdAt
                                  )}
                                </strong>
                              </div>

                            </div>

                            {isRejected &&
                              order.rejectionReason && (
                                <div className="po-rejection-note">

                                  <div>
                                    ❌
                                  </div>

                                  <div>
                                    <strong>
                                      Rejection Reason
                                    </strong>

                                    <p>
                                      {
                                        order.rejectionReason
                                      }
                                    </p>
                                  </div>

                                </div>
                              )}

                          </div>

                          <div className="po-card-side">

                            <span>
                              ORDER VALUE
                            </span>

                            <strong>
                              {formatCurrency(
                                order.totalAmount
                              )}
                            </strong>

                            {/* PENDING */}

                            {isPending && (
                              <div className="po-action-group">

                                <button
                                  className="po-approve"
                                  onClick={() =>
                                    approvePurchaseOrder(
                                      order._id
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  ✓ Approve
                                </button>

                                <button
                                  className="po-reject"
                                  onClick={() =>
                                    openRejectModal(
                                      order
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  × Reject
                                </button>

                              </div>
                            )}

                            {/* APPROVED */}

                            {isApproved && (
                              <div className="approved-action">

                                <div>
                                  <span>
                                    ✓
                                  </span>

                                  Approved
                                </div>

                                <button
                                  className="po-send"
                                  onClick={() =>
                                    sendPurchaseOrder(
                                      order._id
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  📤 Send to Vendor
                                </button>

                              </div>
                            )}

                            {/* REJECTED */}

                            {isRejected && (
                              <div className="rejected-action">
                                ✕ Order Rejected
                              </div>
                            )}

                            {/* SENT */}

                            {status === "SENT" && (
                              <div className="sent-action">
                                📤 Sent to Vendor
                              </div>
                            )}

                            {/* DELIVERED */}

                            {status ===
                              "DELIVERED" && (
                              <div className="delivered-action">
                                ✓ Delivered
                              </div>
                            )}

                            {/* CLOSED */}

                            {status === "CLOSED" && (
                              <div className="closed-action">
                                ✓ Closed
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>
          )}

        </main>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="admin-footer">
          <span>
            © 2026 Vendor Management System
          </span>

          <span>
            Admin Control Panel
          </span>
        </footer>

      </div>

      {/* =================================================
          REJECTION MODAL
      ================================================= */}

      {showRejectModal && (
        <div
          className="reject-overlay"
          onClick={closeRejectModal}
        >

          <div
            className="reject-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="reject-modal-top">

              <div className="reject-icon">
                ×
              </div>

              <div>
                <span>
                  PURCHASE ORDER
                </span>

                <h2>
                  Reject Purchase Order
                </h2>

                <p>
                  Please provide a clear reason
                  for rejecting this order.
                </p>
              </div>

              <button
                className="reject-close"
                onClick={closeRejectModal}
                disabled={actionLoading}
              >
                ×
              </button>

            </div>

            <div className="reject-selected-order">

              <div>
                <span>
                  PO Number
                </span>

                <strong>
                  {selectedOrder?.poNumber ||
                    "Purchase Order"}
                </strong>
              </div>

              <div>
                <span>
                  Order Value
                </span>

                <strong>
                  {formatCurrency(
                    selectedOrder?.totalAmount
                  )}
                </strong>
              </div>

            </div>

            <label
              className="reject-label"
              htmlFor="rejectionReason"
            >
              Rejection Reason
              <b>*</b>
            </label>

            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value
                )
              }
              placeholder="Example: Product quantity exceeds available stock..."
              rows={6}
              maxLength={500}
              autoFocus
            />

            <div className="reject-textarea-footer">

              <span>
                The customer will be able to
                see this reason.
              </span>

              <strong>
                {rejectionReason.length}/500
              </strong>

            </div>

            <div className="reject-modal-actions">

              <button
                className="cancel-reject"
                onClick={closeRejectModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="confirm-reject"
                onClick={rejectPurchaseOrder}
                disabled={
                  actionLoading ||
                  !rejectionReason.trim()
                }
              >
                {actionLoading
                  ? "Rejecting..."
                  : "× Confirm Rejection"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// EMPTY STATE COMPONENT
// =====================================================

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div className="admin-empty-state">

      <div className="admin-empty-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}

export default AdminPage;