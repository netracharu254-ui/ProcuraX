import { useEffect, useMemo, useState } from "react";
import "./VendorPage.css";

const API = "http://localhost:5000/api";

// =====================================================
// STATUS HELPERS
// =====================================================

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const statusClass = (status) => {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");
};

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};


// =====================================================
// COMPONENT
// =====================================================

function VendorPage({ user, onLogout }) {

  // =====================================================
  // MAIN DATA
  // =====================================================

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [activeTab, setActiveTab] = useState("dashboard");

  // =====================================================
  // PO MODAL
  // =====================================================

  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // =====================================================
  // VENDOR REGISTRATION
  // =====================================================

  const [vendorForm, setVendorForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    notes: "",
  });

  const [registeringVendor, setRegisteringVendor] =
    useState(false);

  // =====================================================
  // PRODUCT REGISTRATION
  // =====================================================

  const [productForm, setProductForm] = useState({
    productName: "",
    category: "",
    description: "",
    sku: "",
    quantity: "",
    unitPrice: "",
    photo: "",
  });

  const [registeringProduct, setRegisteringProduct] =
    useState(false);

  // =====================================================
  // PRODUCT EDIT / STOCK
  // =====================================================

  const [editingProductId, setEditingProductId] =
    useState(null);

  const [stockValue, setStockValue] = useState("");

  // =====================================================
  // GET VENDOR ID
  // =====================================================

  const vendorId = useMemo(() => {
    return (
      user?.vendorId ||
      user?.vendor?._id ||
      user?.vendor?._id?.toString() ||
      (typeof user?.vendor === "string"
        ? user.vendor
        : "") ||
      user?._id ||
      ""
    );
  }, [user]);

  // =====================================================
  // DISPLAY NAME
  // =====================================================

  const displayName =
    user?.name ||
    user?.contactPerson ||
    user?.companyName ||
    "Vendor";

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
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

      if (response.ok && Array.isArray(data)) {
        setVendors(data);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error("Fetch Vendors Error:", error);
      setVendors([]);
    }
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {

      // If vendor ID exists, fetch only this vendor's products
      if (vendorId) {

        const response = await fetch(
          `${API}/products/vendor/${vendorId}`
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setProducts(data);
          return;
        }
      }

      // Fallback
      const response = await fetch(`${API}/products`);

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }

    } catch (error) {
      console.error("Fetch Products Error:", error);
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

      if (response.ok && Array.isArray(data)) {
        setPurchaseOrders(data);
      } else {
        setPurchaseOrders([]);
      }

    } catch (error) {
      console.error(
        "Fetch Purchase Orders Error:",
        error
      );

      setPurchaseOrders([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadAllData();
  }, [vendorId]);

  const loadAllData = async () => {
    setLoading(true);

    await Promise.all([
      fetchVendors(),
      fetchProducts(),
      fetchPurchaseOrders(),
    ]);

    setLoading(false);
  };

  // =====================================================
  // CURRENT VENDOR
  // =====================================================

  const currentVendor = useMemo(() => {

    if (!vendors.length) {
      return null;
    }

    // Match vendor ID
    const byId = vendors.find(
      (vendor) =>
        String(vendor._id) === String(vendorId)
    );

    if (byId) {
      return byId;
    }

    // Match email
    const byEmail = vendors.find(
      (vendor) =>
        user?.email &&
        vendor?.email?.toLowerCase() ===
          user.email.toLowerCase()
    );

    if (byEmail) {
      return byEmail;
    }

    // Match company
    const byCompany = vendors.find(
      (vendor) =>
        user?.companyName &&
        vendor?.companyName?.toLowerCase() ===
          user.companyName.toLowerCase()
    );

    return byCompany || null;

  }, [vendors, vendorId, user]);

  // =====================================================
  // EFFECTIVE VENDOR ID
  // =====================================================

  const effectiveVendorId =
    currentVendor?._id || vendorId || "";

  // =====================================================
  // VENDOR PURCHASE ORDERS
  // =====================================================

  const vendorOrders = useMemo(() => {

    if (!purchaseOrders.length) {
      return [];
    }

    // Match ID
    const byId = purchaseOrders.filter((order) => {

      const orderVendorId =
        order?.vendor?._id ||
        order?.vendor;

      return (
        orderVendorId &&
        String(orderVendorId) ===
          String(effectiveVendorId)
      );
    });

    if (byId.length > 0) {
      return byId;
    }

    // Match email
    if (currentVendor?.email) {

      const byEmail =
        purchaseOrders.filter(
          (order) =>
            order?.vendor?.email?.toLowerCase() ===
            currentVendor.email.toLowerCase()
        );

      if (byEmail.length > 0) {
        return byEmail;
      }
    }

    // Match company
    if (currentVendor?.companyName) {

      return purchaseOrders.filter(
        (order) =>
          order?.vendor?.companyName
            ?.toLowerCase() ===
          currentVendor.companyName.toLowerCase()
      );
    }

    return [];

  }, [
    purchaseOrders,
    effectiveVendorId,
    currentVendor,
  ]);

  // =====================================================
  // ORDER STATISTICS
  // =====================================================

  const totalOrders = vendorOrders.length;

  const pendingOrders = vendorOrders.filter(
    (order) =>
      order.status === "PENDING_APPROVAL"
  ).length;

  const approvedOrders = vendorOrders.filter(
    (order) =>
      order.status === "APPROVED"
  ).length;

  const sentOrders = vendorOrders.filter(
    (order) =>
      order.status === "SENT"
  ).length;

  const deliveredOrders = vendorOrders.filter(
    (order) =>
      order.status === "DELIVERED"
  ).length;

  const closedOrders = vendorOrders.filter(
    (order) =>
      order.status === "CLOSED"
  ).length;

  const rejectedOrders = vendorOrders.filter(
    (order) =>
      order.status === "REJECTED"
  ).length;

  const totalOrderValue = vendorOrders.reduce(
    (total, order) =>
      total + Number(order?.totalAmount || 0),
    0
  );

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {

    setRefreshing(true);

    await Promise.all([
      fetchVendors(),
      fetchProducts(),
      fetchPurchaseOrders(),
    ]);

    setRefreshing(false);

    showMessage(
      "Dashboard refreshed successfully.",
      "success"
    );
  };

  // =====================================================
  // VENDOR FORM CHANGE
  // =====================================================

  const handleVendorChange = (e) => {

    const { name, value } = e.target;

    setVendorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // REGISTER VENDOR
  // =====================================================

  const handleVendorRegistration = async (e) => {

    e.preventDefault();

    if (
      !vendorForm.companyName.trim() ||
      !vendorForm.contactPerson.trim() ||
      !vendorForm.email.trim() ||
      !vendorForm.phone.trim()
    ) {

      showMessage(
        "Please fill all required vendor fields.",
        "error"
      );

      return;
    }

    setRegisteringVendor(true);

    try {

      const response = await fetch(
        `${API}/vendors`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            companyName:
              vendorForm.companyName.trim(),

            contactPerson:
              vendorForm.contactPerson.trim(),

            email:
              vendorForm.email.trim().toLowerCase(),

            phone:
              vendorForm.phone.trim(),

            address:
              vendorForm.address.trim(),

            category:
              vendorForm.category.trim(),

            notes:
              vendorForm.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Vendor registration failed."
        );
      }

      showMessage(
        "Vendor registered successfully!",
        "success"
      );

      // Update vendor list
      await fetchVendors();

      // Reset form
      setVendorForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        category: "",
        notes: "",
      });

      // Go to profile
      setActiveTab("profile");

    } catch (error) {

      console.error(
        "Vendor Registration Error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to register vendor.",
        "error"
      );

    } finally {

      setRegisteringVendor(false);
    }
  };

  // =====================================================
  // PRODUCT FORM CHANGE
  // =====================================================

  const handleProductChange = (e) => {

    const { name, value } = e.target;

    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // REGISTER PRODUCT
  // =====================================================

  const handleProductRegistration = async (e) => {

    e.preventDefault();

    if (!effectiveVendorId) {

      showMessage(
        "Please register a vendor before adding products.",
        "error"
      );

      setActiveTab("registration");

      return;
    }

    if (
      !productForm.productName.trim() ||
      !productForm.category.trim() ||
      productForm.quantity === "" ||
      productForm.unitPrice === ""
    ) {

      showMessage(
        "Please fill product name, category, quantity and unit price.",
        "error"
      );

      return;
    }

    const quantity =
      Number(productForm.quantity);

    const unitPrice =
      Number(productForm.unitPrice);

    if (
      Number.isNaN(quantity) ||
      quantity < 0
    ) {

      showMessage(
        "Quantity must be a valid non-negative number.",
        "error"
      );

      return;
    }

    if (
      Number.isNaN(unitPrice) ||
      unitPrice < 0
    ) {

      showMessage(
        "Unit price must be a valid non-negative number.",
        "error"
      );

      return;
    }

    setRegisteringProduct(true);

    try {

      const response = await fetch(
        `${API}/products`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            productName:
              productForm.productName.trim(),

            category:
              productForm.category.trim(),

            description:
              productForm.description.trim(),

            sku:
              productForm.sku.trim(),

            quantity,

            unitPrice,

            vendor: effectiveVendorId,

            photo:
              productForm.photo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Product registration failed."
        );
      }

      showMessage(
        "Product registered successfully!",
        "success"
      );

      // Reset form
      setProductForm({
        productName: "",
        category: "",
        description: "",
        sku: "",
        quantity: "",
        unitPrice: "",
        photo: "",
      });

      // Refresh products
      await fetchProducts();

      setActiveTab("products");

    } catch (error) {

      console.error(
        "Product Registration Error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to register product.",
        "error"
      );

    } finally {

      setRegisteringProduct(false);
    }
  };

  // =====================================================
  // UPDATE STOCK
  // =====================================================

  const handleStockUpdate = async (productId) => {

    const quantity = Number(stockValue);

    if (
      Number.isNaN(quantity) ||
      quantity < 0
    ) {

      showMessage(
        "Enter a valid stock quantity.",
        "error"
      );

      return;
    }

    try {

      const response = await fetch(
        `${API}/products/${productId}/stock`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to update stock."
        );
      }

      showMessage(
        "Product stock updated successfully.",
        "success"
      );

      setEditingProductId(null);
      setStockValue("");

      await fetchProducts();

    } catch (error) {

      console.error(
        "Stock Update Error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to update stock.",
        "error"
      );
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDeleteProduct = async (productId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {

      const response = await fetch(
        `${API}/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to delete product."
        );
      }

      showMessage(
        "Product deleted successfully.",
        "success"
      );

      await fetchProducts();

    } catch (error) {

      console.error(
        "Delete Product Error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to delete product.",
        "error"
      );
    }
  };

  // =====================================================
  // FETCH PO DETAILS
  // =====================================================

  const fetchPODetails = async (id) => {

    setSelectedPO(id);
    setDetailsLoading(true);
    setPoDetails(null);

    try {

      const response = await fetch(
        `${API}/purchase-orders/${id}`
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to fetch purchase order details."
        );
      }

      setPoDetails(data);

    } catch (error) {

      console.error(
        "PO Details Error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot load purchase order details.",
        "error"
      );

      setSelectedPO(null);

    } finally {

      setDetailsLoading(false);
    }
  };

  // =====================================================
  // CLOSE PO MODAL
  // =====================================================

  const closePOModal = () => {

    setSelectedPO(null);
    setPoDetails(null);
    setDetailsLoading(false);
  };

  // =====================================================
  // MARK PO DELIVERED
  // =====================================================

  const markAsDelivered = async (id) => {

    const confirmed = window.confirm(
      "Are you sure this purchase order has been delivered?"
    );

    if (!confirmed) {
      return;
    }

    try {

      const response = await fetch(
        `${API}/purchase-orders/${id}/deliver`,
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
          "Failed to update delivery status."
        );
      }

      showMessage(
        "Purchase Order marked as delivered.",
        "success"
      );

      await fetchPurchaseOrders();

      if (selectedPO === id) {
        await fetchPODetails(id);
      }

    } catch (error) {

      console.error(
        "Delivery Update Error:",
        error
      );

      showMessage(
        error.message ||
          "Cannot connect to backend.",
        "error"
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("vmsToken");
    localStorage.removeItem("vmsUser");

    window.location.reload();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="vendor-loading">

        <div className="vendor-loading-spinner"></div>

        <h2>
          Loading Vendor Dashboard...
        </h2>

        <p>
          Please wait while we fetch your
          latest information.
        </p>

      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="vendor-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="vendor-header">

        <div className="vendor-brand">

          <div className="vendor-brand-icon">
            🏢
          </div>

          <div>
            <h1>
              VMS Vendor Portal
            </h1>

            <p>
              Vendor Management System
            </p>
          </div>

        </div>

        <div className="vendor-header-right">

          <div className="vendor-user">

            <div className="vendor-avatar">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="vendor-user-info">

              <strong>
                {displayName}
              </strong>

              <span>
                {user?.email ||
                  currentVendor?.email ||
                  "Vendor Account"}
              </span>

            </div>

          </div>

          <button
            className="vendor-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="vendor-nav">

        <button
          className={
            activeTab === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("dashboard")
          }
        >
          📊 Dashboard
        </button>

        <button
          className={
            activeTab === "registration"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("registration")
          }
        >
          📝 Vendor Registration
        </button>

        <button
          className={
            activeTab === "product-registration"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "product-registration"
            )
          }
        >
          ➕ Product Registration
        </button>

        <button
          className={
            activeTab === "products"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("products")
          }
        >
          📦 My Products
        </button>

        <button
          className={
            activeTab === "orders"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("orders")
          }
        >
          🛒 PO Status
        </button>

        <button
          className={
            activeTab === "profile"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("profile")
          }
        >
          👤 Company Profile
        </button>

      </nav>


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (

        <div
          className={`vendor-message ${messageType}`}
        >

          <span>
            {messageType === "success"
              ? "✓"
              : "!"}
          </span>

          {message}

        </div>

      )}


      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="vendor-content">


        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="vendor-welcome">

          <div>

            <span className="welcome-label">
              VENDOR PORTAL
            </span>

            <h2>
              Welcome back, {displayName} 👋
            </h2>

            <p>
              Manage your company, products
              and purchase orders from one
              place.
            </p>

          </div>

          <button
            className="vendor-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "⟳ Refreshing..."
              : "↻ Refresh"}
          </button>

        </section>


        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activeTab === "dashboard" && (

          <>

            {/* STATISTICS */}

            <section className="vendor-stats">

              <div className="vendor-stat-card blue">

                <div className="stat-icon">
                  🛒
                </div>

                <div>
                  <span>
                    Total Orders
                  </span>

                  <strong>
                    {totalOrders}
                  </strong>
                </div>

              </div>


              <div className="vendor-stat-card orange">

                <div className="stat-icon">
                  ⏳
                </div>

                <div>
                  <span>
                    Pending Approval
                  </span>

                  <strong>
                    {pendingOrders}
                  </strong>
                </div>

              </div>


              <div className="vendor-stat-card purple">

                <div className="stat-icon">
                  📤
                </div>

                <div>
                  <span>
                    Sent Orders
                  </span>

                  <strong>
                    {sentOrders}
                  </strong>
                </div>

              </div>


              <div className="vendor-stat-card green">

                <div className="stat-icon">
                  🚚
                </div>

                <div>
                  <span>
                    Delivered
                  </span>

                  <strong>
                    {deliveredOrders}
                  </strong>
                </div>

              </div>


              <div className="vendor-stat-card teal">

                <div className="stat-icon">
                  💰
                </div>

                <div>
                  <span>
                    Order Value
                  </span>

                  <strong>
                    {formatCurrency(
                      totalOrderValue
                    )}
                  </strong>
                </div>

              </div>

            </section>


            {/* QUICK ACTIONS */}

            <section className="vendor-section">

              <div className="section-heading">

                <div>

                  <span>
                    QUICK ACTIONS
                  </span>

                  <h2>
                    Vendor Management
                  </h2>

                  <p>
                    Quickly access your vendor
                    registration, products and
                    purchase orders.
                  </p>

                </div>

              </div>


              <div className="quick-actions">

                <button
                  className="quick-action-card"
                  onClick={() =>
                    setActiveTab(
                      "registration"
                    )
                  }
                >
                  <span>
                    📝
                  </span>

                  <strong>
                    Vendor Registration
                  </strong>

                  <small>
                    Register company details
                  </small>
                </button>


                <button
                  className="quick-action-card"
                  onClick={() =>
                    setActiveTab(
                      "product-registration"
                    )
                  }
                >
                  <span>
                    📦
                  </span>

                  <strong>
                    Register Product
                  </strong>

                  <small>
                    Add your products
                  </small>
                </button>


                <button
                  className="quick-action-card"
                  onClick={() =>
                    setActiveTab("products")
                  }
                >
                  <span>
                    🏷️
                  </span>

                  <strong>
                    My Products
                  </strong>

                  <small>
                    Manage your catalog
                  </small>
                </button>


                <button
                  className="quick-action-card"
                  onClick={() =>
                    setActiveTab("orders")
                  }
                >
                  <span>
                    🛒
                  </span>

                  <strong>
                    PO Status
                  </strong>

                  <small>
                    Track purchase orders
                  </small>
                </button>

              </div>

            </section>


            {/* WORKFLOW */}

            <section className="vendor-section">

              <div className="section-heading">

                <div>

                  <span>
                    ORDER WORKFLOW
                  </span>

                  <h2>
                    🔄 Purchase Order Lifecycle
                  </h2>

                  <p>
                    Customer order → Procurement
                    Officer creates PO → Manager
                    approves → Vendor receives →
                    Delivery.
                  </p>

                </div>

              </div>


              <div className="workflow">

                <div className="workflow-step">

                  <div className="workflow-number">
                    1
                  </div>

                  <strong>
                    Customer
                  </strong>

                  <span>
                    Places Order
                  </span>

                </div>


                <div className="workflow-line">
                  →
                </div>


                <div className="workflow-step">

                  <div className="workflow-number">
                    2
                  </div>

                  <strong>
                    Procurement Officer
                  </strong>

                  <span>
                    Creates PO
                  </span>

                </div>


                <div className="workflow-line">
                  →
                </div>


                <div className="workflow-step">

                  <div className="workflow-number">
                    3
                  </div>

                  <strong>
                    Manager
                  </strong>

                  <span>
                    Approves PO
                  </span>

                </div>


                <div className="workflow-line">
                  →
                </div>


                <div className="workflow-step">

                  <div className="workflow-number">
                    4
                  </div>

                  <strong>
                    Vendor
                  </strong>

                  <span>
                    Receives PO
                  </span>

                </div>


                <div className="workflow-line">
                  →
                </div>


                <div className="workflow-step">

                  <div className="workflow-number">
                    5
                  </div>

                  <strong>
                    Delivery
                  </strong>

                  <span>
                    Complete Order
                  </span>

                </div>

              </div>

            </section>


            {/* RECENT ORDERS */}

            <section className="vendor-section">

              <div className="section-heading">

                <div>

                  <span>
                    RECENT ACTIVITY
                  </span>

                  <h2>
                    🛒 Recent Purchase Orders
                  </h2>

                </div>

                <button
                  className="section-action"
                  onClick={() =>
                    setActiveTab("orders")
                  }
                >
                  View All →
                </button>

              </div>


              {vendorOrders.length === 0 ? (

                <div className="vendor-empty">

                  <div className="empty-icon">
                    🛒
                  </div>

                  <h3>
                    No Purchase Orders Yet
                  </h3>

                  <p>
                    Purchase orders assigned
                    to your company will appear
                    here.
                  </p>

                </div>

              ) : (

                <div className="recent-orders">

                  {vendorOrders
                    .slice(0, 5)
                    .map((order) => (

                      <div
                        className="recent-order"
                        key={order._id}
                      >

                        <div className="order-icon">
                          📋
                        </div>

                        <div className="order-info">

                          <strong>
                            {order.poNumber ||
                              "Purchase Order"}
                          </strong>

                          <span>
                            {formatDate(
                              order.createdAt
                            )}
                          </span>

                        </div>

                        <div className="order-value">

                          <strong>
                            {formatCurrency(
                              order.totalAmount
                            )}
                          </strong>

                          <span
                            className={`status-badge ${statusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>

                        </div>

                        <button
                          className="view-btn"
                          onClick={() =>
                            fetchPODetails(
                              order._id
                            )
                          }
                        >
                          View
                        </button>

                      </div>

                    ))}

                </div>

              )}

            </section>

          </>
        )}


        {/* =================================================
            VENDOR REGISTRATION
        ================================================= */}

        {activeTab === "registration" && (

          <section className="vendor-section">

            <div className="section-heading">

              <div>

                <span>
                  ONBOARDING
                </span>

                <h2>
                  📝 Vendor Registration
                </h2>

                <p>
                  Register your company with
                  the Vendor Management System.
                </p>

              </div>

            </div>


            <form
              className="vendor-form"
              onSubmit={
                handleVendorRegistration
              }
            >

              <div className="form-section-title">
                🏢 Company Information
              </div>


              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Company Name *
                  </label>

                  <input
                    type="text"
                    name="companyName"
                    value={
                      vendorForm.companyName
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Enter company name"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Contact Person *
                  </label>

                  <input
                    type="text"
                    name="contactPerson"
                    value={
                      vendorForm.contactPerson
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Enter contact person"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      vendorForm.email
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="company@example.com"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Phone *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      vendorForm.phone
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Enter phone number"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Business Category
                  </label>

                  <input
                    type="text"
                    name="category"
                    value={
                      vendorForm.category
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Electronics, Hardware, etc."
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={
                      vendorForm.address
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Enter complete company address"
                    rows="3"
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Additional Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      vendorForm.notes
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Any additional information..."
                    rows="3"
                  />

                </div>

              </div>


              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setVendorForm({
                      companyName: "",
                      contactPerson: "",
                      email: "",
                      phone: "",
                      address: "",
                      category: "",
                      notes: "",
                    })
                  }
                >
                  Clear
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                  disabled={registeringVendor}
                >
                  {registeringVendor
                    ? "Registering..."
                    : "✓ Register Vendor"}
                </button>

              </div>

            </form>

          </section>
        )}


        {/* =================================================
            PRODUCT REGISTRATION
        ================================================= */}

        {activeTab === "product-registration" && (

          <section className="vendor-section">

            <div className="section-heading">

              <div>

                <span>
                  PRODUCT MANAGEMENT
                </span>

                <h2>
                  📦 Product Registration
                </h2>

                <p>
                  Register products belonging to
                  your vendor company.
                </p>

              </div>

            </div>


            {!effectiveVendorId ? (

              <div className="vendor-empty">

                <div className="empty-icon">
                  🏢
                </div>

                <h3>
                  Vendor Registration Required
                </h3>

                <p>
                  Please register your company
                  before adding products.
                </p>

                <button
                  className="primary-btn"
                  onClick={() =>
                    setActiveTab(
                      "registration"
                    )
                  }
                >
                  Register Vendor
                </button>

              </div>

            ) : (

              <form
                className="vendor-form"
                onSubmit={
                  handleProductRegistration
                }
              >

                <div className="form-section-title">
                  📦 Product Information
                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Product Name *
                    </label>

                    <input
                      type="text"
                      name="productName"
                      value={
                        productForm.productName
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter product name"
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Category *
                    </label>

                    <input
                      type="text"
                      name="category"
                      value={
                        productForm.category
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter category"
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      SKU
                    </label>

                    <input
                      type="text"
                      name="sku"
                      value={
                        productForm.sku
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter unique SKU"
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Quantity *
                    </label>

                    <input
                      type="number"
                      name="quantity"
                      value={
                        productForm.quantity
                      }
                      onChange={
                        handleProductChange
                      }
                      min="0"
                      placeholder="0"
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Unit Price (₹) *
                    </label>

                    <input
                      type="number"
                      name="unitPrice"
                      value={
                        productForm.unitPrice
                      }
                      onChange={
                        handleProductChange
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Product Photo URL
                    </label>

                    <input
                      type="text"
                      name="photo"
                      value={
                        productForm.photo
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="https://..."
                    />

                  </div>


                  <div className="form-group full-width">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        productForm.description
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Describe your product..."
                      rows="4"
                    />

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      setProductForm({
                        productName: "",
                        category: "",
                        description: "",
                        sku: "",
                        quantity: "",
                        unitPrice: "",
                        photo: "",
                      })
                    }
                  >
                    Clear
                  </button>


                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={registeringProduct}
                  >
                    {registeringProduct
                      ? "Registering..."
                      : "✓ Register Product"}
                  </button>

                </div>

              </form>

            )}

          </section>
        )}


        {/* =================================================
            MY PRODUCTS
        ================================================= */}

        {activeTab === "products" && (

          <section className="vendor-section">

            <div className="section-heading">

              <div>

                <span>
                  MY PRODUCT CATALOG
                </span>

                <h2>
                  📦 My Products
                </h2>

                <p>
                  Products registered under your
                  vendor company.
                </p>

              </div>

              <button
                className="primary-btn"
                onClick={() =>
                  setActiveTab(
                    "product-registration"
                  )
                }
              >
                + Add Product
              </button>

            </div>


            {products.length === 0 ? (

              <div className="vendor-empty">

                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  No Products Registered
                </h3>

                <p>
                  Register your first product
                  to start building your catalog.
                </p>

                <button
                  className="primary-btn"
                  onClick={() =>
                    setActiveTab(
                      "product-registration"
                    )
                  }
                >
                  + Register Product
                </button>

              </div>

            ) : (

              <div className="product-grid">

                {products.map((product) => (

                  <div
                    className="vendor-product-card"
                    key={product._id}
                  >

                    <div className="product-image">

                      {product.photo ? (

                        <img
                          src={product.photo}
                          alt={
                            product.productName ||
                            "Product"
                          }
                        />

                      ) : (

                        <div className="product-placeholder">
                          📦
                        </div>

                      )}

                    </div>


                    <div className="product-content">

                      <div className="product-top-row">

                        <span className="product-category">
                          {product.category ||
                            "General"}
                        </span>

                        <span
                          className={`status-badge ${statusClass(
                            product.status
                          )}`}
                        >
                          {formatStatus(
                            product.status
                          )}
                        </span>

                      </div>


                      <h3>
                        {product.productName ||
                          "Unnamed Product"}
                      </h3>


                      {product.sku && (

                        <span className="product-sku">
                          SKU: {product.sku}
                        </span>

                      )}


                      <p>
                        {product.description ||
                          "No description available."}
                      </p>


                      <div className="product-footer">

                        <strong>
                          {formatCurrency(
                            product.unitPrice
                          )}
                        </strong>

                        <span>
                          Stock:{" "}
                          {product.quantity || 0}
                        </span>

                      </div>


                      {editingProductId ===
                      product._id ? (

                        <div className="stock-editor">

                          <input
                            type="number"
                            min="0"
                            value={stockValue}
                            onChange={(e) =>
                              setStockValue(
                                e.target.value
                              )
                            }
                            placeholder="New stock"
                          />

                          <button
                            className="primary-btn small"
                            onClick={() =>
                              handleStockUpdate(
                                product._id
                              )
                            }
                          >
                            Save
                          </button>

                          <button
                            className="secondary-btn small"
                            onClick={() => {
                              setEditingProductId(
                                null
                              );
                              setStockValue("");
                            }}
                          >
                            Cancel
                          </button>

                        </div>

                      ) : (

                        <div className="product-actions">

                          <button
                            className="secondary-btn small"
                            onClick={() => {
                              setEditingProductId(
                                product._id
                              );

                              setStockValue(
                                product.quantity || 0
                              );
                            }}
                          >
                            ✏️ Update Stock
                          </button>

                          <button
                            className="danger-btn small"
                            onClick={() =>
                              handleDeleteProduct(
                                product._id
                              )
                            }
                          >
                            🗑 Delete
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}


        {/* =================================================
            PURCHASE ORDER STATUS
        ================================================= */}

        {activeTab === "orders" && (

          <section className="vendor-section">

            <div className="section-heading">

              <div>

                <span>
                  PROCUREMENT
                </span>

                <h2>
                  🛒 Purchase Order Status
                </h2>

                <p>
                  Track purchase orders assigned
                  to your company.
                </p>

              </div>

            </div>


            {/* PO SUMMARY */}

            <div className="po-summary">

              <div>
                <span>
                  Total
                </span>

                <strong>
                  {totalOrders}
                </strong>
              </div>


              <div>
                <span>
                  Pending
                </span>

                <strong>
                  {pendingOrders}
                </strong>
              </div>


              <div>
                <span>
                  Approved
                </span>

                <strong>
                  {approvedOrders}
                </strong>
              </div>


              <div>
                <span>
                  Sent
                </span>

                <strong>
                  {sentOrders}
                </strong>
              </div>


              <div>
                <span>
                  Delivered
                </span>

                <strong>
                  {deliveredOrders}
                </strong>
              </div>


              <div>
                <span>
                  Closed
                </span>

                <strong>
                  {closedOrders}
                </strong>
              </div>

            </div>


            {vendorOrders.length === 0 ? (

              <div className="vendor-empty">

                <div className="empty-icon">
                  🛒
                </div>

                <h3>
                  No Purchase Orders
                </h3>

                <p>
                  Purchase orders sent to your
                  company will appear here after
                  the approval process.
                </p>

              </div>

            ) : (

              <div className="orders-grid">

                {vendorOrders.map((order) => {

                  const canDeliver =
                    order.status === "SENT";

                  return (

                    <div
                      className="vendor-order-card"
                      key={order._id}
                    >

                      <div className="order-card-top">

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
                          className={`status-badge ${statusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(
                            order.status
                          )}
                        </span>

                      </div>


                      <div className="order-card-body">

                        <div className="order-detail">

                          <span>
                            Customer
                          </span>

                          <strong>
                            {order.customer
                              ?.name ||
                              order.customer
                                ?.companyName ||
                              "Customer"}
                          </strong>

                        </div>


                        <div className="order-detail">

                          <span>
                            Order Value
                          </span>

                          <strong>
                            {formatCurrency(
                              order.totalAmount
                            )}
                          </strong>

                        </div>


                        <div className="order-detail">

                          <span>
                            Expected Delivery
                          </span>

                          <strong>
                            {formatDate(
                              order.expectedDeliveryDate
                            )}
                          </strong>

                        </div>


                        <div className="order-detail">

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


                      {order.rejectionReason && (

                        <div className="rejection-note">

                          <strong>
                            Admin / Manager Note
                          </strong>

                          <p>
                            {
                              order.rejectionReason
                            }
                          </p>

                        </div>

                      )}


                      <div className="order-card-actions">

                        <button
                          className="secondary-btn"
                          onClick={() =>
                            fetchPODetails(
                              order._id
                            )
                          }
                        >
                          👁 View Details
                        </button>


                        {canDeliver && (

                          <button
                            className="deliver-btn"
                            onClick={() =>
                              markAsDelivered(
                                order._id
                              )
                            }
                          >
                            ✓ Mark Delivered
                          </button>

                        )}

                      </div>

                    </div>

                  );
                })}

              </div>

            )}

          </section>
        )}


        {/* =================================================
            COMPANY PROFILE
        ================================================= */}

        {activeTab === "profile" && (

          <section className="vendor-section">

            <div className="section-heading">

              <div>

                <span>
                  COMPANY INFORMATION
                </span>

                <h2>
                  👤 Company Profile
                </h2>

                <p>
                  Your registered vendor
                  information.
                </p>

              </div>

              <button
                className="secondary-btn"
                onClick={() =>
                  setActiveTab(
                    "registration"
                  )
                }
              >
                Edit / Register
              </button>

            </div>


            {currentVendor ? (

              <div className="profile-card">

                <div className="profile-top">

                  <div className="profile-company-icon">
                    🏢
                  </div>

                  <div>

                    <span>
                      REGISTERED VENDOR
                    </span>

                    <h2>
                      {currentVendor.companyName ||
                        "Vendor Company"}
                    </h2>

                    <span
                      className={`status-badge ${statusClass(
                        currentVendor.status
                      )}`}
                    >
                      {formatStatus(
                        currentVendor.status
                      )}
                    </span>

                  </div>

                </div>


                <div className="profile-grid">

                  <div className="profile-field">

                    <span>
                      Contact Person
                    </span>

                    <strong>
                      {currentVendor.contactPerson ||
                        "—"}
                    </strong>

                  </div>


                  <div className="profile-field">

                    <span>
                      Email
                    </span>

                    <strong>
                      {currentVendor.email ||
                        "—"}
                    </strong>

                  </div>


                  <div className="profile-field">

                    <span>
                      Phone
                    </span>

                    <strong>
                      {currentVendor.phone ||
                        "—"}
                    </strong>

                  </div>


                  <div className="profile-field">

                    <span>
                      Category
                    </span>

                    <strong>
                      {currentVendor.category ||
                        "—"}
                    </strong>

                  </div>


                  <div className="profile-field full">

                    <span>
                      Address
                    </span>

                    <strong>
                      {currentVendor.address ||
                        "Address not available"}
                    </strong>

                  </div>


                  <div className="profile-field full">

                    <span>
                      Notes
                    </span>

                    <strong>
                      {currentVendor.notes ||
                        "No additional notes"}
                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <div className="vendor-empty">

                <div className="empty-icon">
                  🏢
                </div>

                <h3>
                  Vendor Not Registered
                </h3>

                <p>
                  Register your company to
                  create products and receive
                  purchase orders.
                </p>

                <button
                  className="primary-btn"
                  onClick={() =>
                    setActiveTab(
                      "registration"
                    )
                  }
                >
                  Register Vendor
                </button>

              </div>

            )}

          </section>
        )}

      </main>


      {/* =================================================
          PO DETAILS MODAL
      ================================================= */}

      {selectedPO && (

        <div
          className="modal-overlay"
          onClick={closePOModal}
        >

          <div
            className="po-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span>
                  PURCHASE ORDER DETAILS
                </span>

                <h2>
                  📋{" "}
                  {poDetails?.purchaseOrder
                    ?.poNumber ||
                    "Purchase Order"}
                </h2>

              </div>


              <button
                className="modal-close"
                onClick={closePOModal}
              >
                ✕
              </button>

            </div>


            {detailsLoading ? (

              <div className="modal-loading">

                <div className="vendor-loading-spinner"></div>

                <p>
                  Loading order details...
                </p>

              </div>

            ) : poDetails ? (

              <>

                <div className="modal-status-row">

                  <span>
                    Current Status
                  </span>

                  <span
                    className={`status-badge ${statusClass(
                      poDetails.purchaseOrder
                        ?.status
                    )}`}
                  >
                    {formatStatus(
                      poDetails.purchaseOrder
                        ?.status
                    )}
                  </span>

                </div>


                <div className="modal-info-grid">

                  <div>

                    <span>
                      Customer
                    </span>

                    <strong>
                      {poDetails.purchaseOrder
                        ?.customer?.name ||
                        poDetails.purchaseOrder
                          ?.customer
                          ?.companyName ||
                        "Customer"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Vendor
                    </span>

                    <strong>
                      {poDetails.purchaseOrder
                        ?.vendor?.companyName ||
                        "Vendor"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Expected Delivery
                    </span>

                    <strong>
                      {formatDate(
                        poDetails.purchaseOrder
                          ?.expectedDeliveryDate
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Total Amount
                    </span>

                    <strong>
                      {formatCurrency(
                        poDetails.purchaseOrder
                          ?.totalAmount
                      )}
                    </strong>

                  </div>

                </div>


                {poDetails.purchaseOrder
                  ?.notes && (

                  <div className="modal-notes">

                    <strong>
                      Notes
                    </strong>

                    <p>
                      {
                        poDetails.purchaseOrder
                          .notes
                      }
                    </p>

                  </div>

                )}


                {poDetails.purchaseOrder
                  ?.rejectionReason && (

                  <div className="rejection-note">

                    <strong>
                      Rejection / Admin Reason
                    </strong>

                    <p>
                      {
                        poDetails.purchaseOrder
                          .rejectionReason
                      }
                    </p>

                  </div>

                )}


                <div className="modal-items">

                  <h3>
                    🛒 Order Items
                  </h3>


                  {poDetails.items &&
                  poDetails.items.length > 0 ? (

                    <div className="items-table-wrapper">

                      <table className="items-table">

                        <thead>

                          <tr>

                            <th>
                              Product
                            </th>

                            <th>
                              Quantity
                            </th>

                            <th>
                              Unit Price
                            </th>

                            <th>
                              Total
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {poDetails.items.map(
                            (item) => (

                              <tr
                                key={item._id}
                              >

                                <td>
                                  {item.productName ||
                                    "Product"}
                                </td>

                                <td>
                                  {item.quantity ||
                                    0}
                                </td>

                                <td>
                                  {formatCurrency(
                                    item.unitPrice
                                  )}
                                </td>

                                <td>
                                  {formatCurrency(
                                    item.totalPrice
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <p>
                      No items available.
                    </p>

                  )}

                </div>


                {poDetails.purchaseOrder
                  ?.status === "SENT" && (

                  <div className="modal-footer">

                    <button
                      className="deliver-btn large"
                      onClick={() =>
                        markAsDelivered(
                          selectedPO
                        )
                      }
                    >
                      ✓ Mark Order as Delivered
                    </button>

                  </div>

                )}

              </>

            ) : (

              <div className="vendor-empty">

                <p>
                  Unable to load purchase
                  order details.
                </p>

              </div>

            )}

          </div>

        </div>

      )}


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="vendor-footer">

        <div>

          <strong>
            VMS
          </strong>

          <span>
            Vendor Management System
          </span>

        </div>

        <span>
          © 2026 Vendor Management System
        </span>

      </footer>

    </div>
  );
}

export default VendorPage;