import { useEffect, useState } from "react";
import "./ProcurementPage.css";

const API = "http://https://procurax-o4mh.onrender.com/api";

const PO_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "DELIVERED",
  "CLOSED",
];

const EMPTY_ITEM = {
  productName: "",
  quantity: 1,
  unitPrice: 0,
  photo: "",
};

function ProcurementPage({ user, onLogout }) {
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [creatingPO, setCreatingPO] = useState(false);

  const [poData, setPoData] = useState({
    poNumber: "",
    vendor: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [poItems, setPoItems] = useState([
    { ...EMPTY_ITEM },
  ]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchVendors();
    fetchPurchaseOrders();
  }, []);

  // =========================================================
  // FETCH VENDORS
  // =========================================================

  const fetchVendors = async () => {
    setLoadingVendors(true);

    try {
      const response = await fetch(`${API}/vendors`);
      const data = await response.json();

      if (response.ok) {
        setVendors(Array.isArray(data) ? data : []);
      } else {
        console.error(data.message || "Failed to fetch vendors");
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoadingVendors(false);
    }
  };

  // =========================================================
  // FETCH PURCHASE ORDERS
  // =========================================================

  const fetchPurchaseOrders = async () => {
    setLoadingPOs(true);

    try {
      const response = await fetch(`${API}/purchase-orders`);
      const data = await response.json();

      if (response.ok) {
        setPurchaseOrders(Array.isArray(data) ? data : []);
      } else {
        console.error(
          data.message || "Failed to fetch purchase orders"
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch purchase orders:",
        error
      );
    } finally {
      setLoadingPOs(false);
    }
  };

  // =========================================================
  // IMAGE TO BASE64
  // =========================================================

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error("Failed to read image"));
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // PO FORM CHANGE
  // =========================================================

  const handlePoChange = (e) => {
    const { name, value } = e.target;

    setPoData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // ITEM CHANGE
  // =========================================================

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

  // =========================================================
  // ITEM PHOTO
  // =========================================================

  const handleItemPhotoChange = async (index, e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      const base64 = await convertImageToBase64(file);

      setPoItems((previous) =>
        previous.map((item, i) =>
          i === index
            ? {
                ...item,
                photo: base64,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to upload image.");
    }
  };

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addPoItem = () => {
    setPoItems((previous) => [
      ...previous,
      { ...EMPTY_ITEM },
    ]);
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removePoItem = (index) => {
    if (poItems.length === 1) {
      return;
    }

    setPoItems((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // =========================================================
  // CALCULATE TOTAL
  // =========================================================

  const calculateTotal = () => {
    return poItems.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;

      return total + quantity * unitPrice;
    }, 0);
  };

  // =========================================================
  // CREATE PURCHASE ORDER
  // =========================================================

  const handleCreatePO = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!poData.poNumber.trim()) {
      setMessage("Please enter a PO number.");
      setMessageType("error");
      return;
    }

    if (!poData.vendor) {
      setMessage("Please select a vendor.");
      setMessageType("error");
      return;
    }

    if (!poData.expectedDeliveryDate) {
      setMessage(
        "Please select an expected delivery date."
      );
      setMessageType("error");
      return;
    }

    const invalidItem = poItems.some(
      (item) =>
        !item.productName.trim() ||
        Number(item.quantity) <= 0 ||
        Number(item.unitPrice) < 0
    );

    if (invalidItem) {
      setMessage(
        "Please enter valid details for all order items."
      );
      setMessageType("error");
      return;
    }

    setCreatingPO(true);

    try {
      const response = await fetch(
        `${API}/purchase-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            poNumber: poData.poNumber.trim(),
            vendor: poData.vendor,
            expectedDeliveryDate:
              poData.expectedDeliveryDate,
            totalAmount: calculateTotal(),
            notes: poData.notes.trim(),

            items: poItems.map((item) => ({
              productName: item.productName.trim(),
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              photo: item.photo,
            })),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Purchase Order created successfully!"
        );
        setMessageType("success");

        setPoData({
          poNumber: "",
          vendor: "",
          expectedDeliveryDate: "",
          notes: "",
        });

        setPoItems([
          { ...EMPTY_ITEM },
        ]);

        await fetchPurchaseOrders();
      } else {
        setMessage(
          data.message ||
            "Failed to create Purchase Order."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("Create PO error:", error);

      setMessage(
        "Cannot connect to backend. Make sure the server is running."
      );
      setMessageType("error");
    } finally {
      setCreatingPO(false);
    }
  };

  // =========================================================
  // FETCH PO DETAILS
  // =========================================================

  const fetchPODetails = async (id) => {
    setLoadingDetails(true);

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
          data.message ||
            "Failed to fetch PO details."
        );
      }
    } catch (error) {
      console.error("PO details error:", error);
      alert("Cannot connect to backend.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setSelectedPO(null);
    setPoDetails(null);
  };

  // =========================================================
  // UPDATE PO STATUS
  // =========================================================

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

        if (selectedPO === id) {
          await fetchPODetails(id);
        }
      } else {
        alert(
          data.message ||
            "Failed to update PO status."
        );
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Cannot connect to backend.");
    }
  };

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const getStatusIndex = (status) => {
    return PO_STATUSES.indexOf(status);
  };

  const getNextStatus = (status) => {
    const index = getStatusIndex(status);

    if (
      index === -1 ||
      index >= PO_STATUSES.length - 1
    ) {
      return null;
    }

    return PO_STATUSES[index + 1];
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const approvedVendors = vendors.filter(
    (vendor) =>
      vendor.status === "APPROVED" ||
      vendor.status === "ACTIVE"
  );

  const totalPOValue = purchaseOrders.reduce(
    (total, po) =>
      total + Number(po.totalAmount || 0),
    0
  );

  const deliveredPOs = purchaseOrders.filter(
    (po) => po.status === "DELIVERED"
  ).length;

  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === "PENDING_APPROVAL"
  ).length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="procurement-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="procurement-header">

        <div>
          <h1>📦 Procurement Dashboard</h1>

          <p>
            Create and manage purchase orders
          </p>
        </div>

        <div className="procurement-user">

          <div>
            <strong>
              {user?.name ||
                user?.email ||
                "Procurement Officer"}
            </strong>

            <span>
              Procurement Officer
            </span>
          </div>

          <button
            className="procurement-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="procurement-stats">

        <div className="procurement-stat-card">
          <div className="stat-icon">🏢</div>

          <div>
            <span>Approved Vendors</span>
            <h2>
              {loadingVendors
                ? "..."
                : approvedVendors.length}
            </h2>
          </div>
        </div>

        <div className="procurement-stat-card">
          <div className="stat-icon">📋</div>

          <div>
            <span>Total Purchase Orders</span>
            <h2>
              {loadingPOs
                ? "..."
                : purchaseOrders.length}
            </h2>
          </div>
        </div>

        <div className="procurement-stat-card">
          <div className="stat-icon">⏳</div>

          <div>
            <span>Pending Orders</span>
            <h2>{pendingPOs}</h2>
          </div>
        </div>

        <div className="procurement-stat-card">
          <div className="stat-icon">💰</div>

          <div>
            <span>Total PO Value</span>

            <h2>
              ₹
              {totalPOValue.toLocaleString(
                "en-IN"
              )}
            </h2>
          </div>
        </div>

      </div>

      {/* =====================================================
          CREATE PURCHASE ORDER
      ===================================================== */}

      <section className="procurement-card">

        <div className="section-title">

          <div>
            <h2>
              ➕ Create Purchase Order
            </h2>

            <p>
              Create a new purchase order for
              an approved vendor.
            </p>
          </div>

        </div>

        <form
          onSubmit={handleCreatePO}
          className="procurement-form"
        >

          {/* BASIC PO DETAILS */}

          <div className="form-row">

            <div className="field">

              <label htmlFor="poNumber">
                PO Number
              </label>

              <input
                id="poNumber"
                name="poNumber"
                placeholder="Example: PO-2026-001"
                value={poData.poNumber}
                onChange={handlePoChange}
                required
              />

            </div>

            <div className="field">

              <label htmlFor="vendor">
                Vendor
              </label>

              <select
                id="vendor"
                name="vendor"
                value={poData.vendor}
                onChange={handlePoChange}
                required
              >

                <option value="">
                  Select Approved Vendor
                </option>

                {approvedVendors.map(
                  (vendor) => (
                    <option
                      key={vendor._id}
                      value={vendor._id}
                    >
                      {vendor.companyName}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="field">

              <label htmlFor="expectedDeliveryDate">
                Expected Delivery Date
              </label>

              <input
                id="expectedDeliveryDate"
                type="date"
                name="expectedDeliveryDate"
                value={
                  poData.expectedDeliveryDate
                }
                onChange={handlePoChange}
                required
              />

            </div>

          </div>

          {/* =================================================
              ORDER ITEMS
          ================================================= */}

          <div className="items-header">

            <div>
              <h3>🛒 Order Items</h3>

              <p>
                Add products required for this
                purchase order.
              </p>
            </div>

            <button
              type="button"
              className="add-item-btn"
              onClick={addPoItem}
            >
              + Add Item
            </button>

          </div>

          {poItems.map((item, index) => (

            <div
              className="po-item"
              key={index}
            >

              <div className="item-number">
                {index + 1}
              </div>

              <div className="item-fields">

                <div className="field">

                  <label>
                    Product Name
                  </label>

                  <input
                    placeholder="Product name"
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

                </div>

                <div className="field">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
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

                </div>

                <div className="field">

                  <label>
                    Unit Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
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

                </div>

                <div className="field">

                  <label>
                    Product Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleItemPhotoChange(
                        index,
                        e
                      )
                    }
                  />

                </div>

                {item.photo && (
                  <div className="item-preview">

                    <img
                      src={item.photo}
                      alt={
                        item.productName ||
                        "Product"
                      }
                    />

                  </div>
                )}

              </div>

              {poItems.length > 1 && (
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() =>
                    removePoItem(index)
                  }
                  aria-label="Remove item"
                >
                  ✕
                </button>
              )}

            </div>

          ))}

          {/* =================================================
              NOTES + TOTAL
          ================================================= */}

          <div className="form-bottom">

            <div className="field notes-field">

              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Add purchase order notes..."
                value={poData.notes}
                onChange={handlePoChange}
                rows="4"
              />

            </div>

            <div className="total-box">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {calculateTotal().toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

          {/* CREATE */}

          <button
            className="create-po-btn"
            type="submit"
            disabled={creatingPO}
          >
            {creatingPO
              ? "Creating Purchase Order..."
              : "📦 Create Purchase Order"}
          </button>

        </form>

        {message && (
          <div
            className={`procurement-message ${messageType}`}
          >
            {messageType === "success"
              ? "✅ "
              : "⚠️ "}
            {message}
          </div>
        )}

      </section>

      {/* =====================================================
          PURCHASE ORDER LIST
      ===================================================== */}

      <section className="procurement-card">

        <div className="section-title">

          <div>
            <h2>
              📋 Purchase Orders
            </h2>

            <p>
              Track and update your purchase
              order lifecycle.
            </p>
          </div>

          <div className="mini-stat">
            🚚 Delivered:
            <strong>{deliveredPOs}</strong>
          </div>

        </div>

        {loadingPOs ? (

          <div className="empty-state">
            <div>⏳</div>

            <h3>
              Loading Purchase Orders...
            </h3>
          </div>

        ) : purchaseOrders.length === 0 ? (

          <div className="empty-state">

            <div>📭</div>

            <h3>
              No Purchase Orders
            </h3>

            <p>
              Create your first purchase order
              above.
            </p>

          </div>

        ) : (

          <div className="po-list">

            {purchaseOrders.map((po) => {

              const currentIndex =
                getStatusIndex(po.status);

              const nextStatus =
                getNextStatus(po.status);

              return (
                <div
                  className="po-list-card"
                  key={po._id}
                >

                  {/* MAIN INFO */}

                  <div className="po-main-info">

                    <button
                      className="po-number-btn"
                      onClick={() =>
                        fetchPODetails(
                          po._id
                        )
                      }
                    >
                      📋 {po.poNumber}
                    </button>

                    <h3>
                      {po.vendor
                        ?.companyName ||
                        "Unknown Vendor"}
                    </h3>

                    <p>
                      Created Purchase Order
                    </p>

                  </div>

                  {/* AMOUNT */}

                  <div className="po-amount">

                    <span>
                      Total Amount
                    </span>

                    <strong>
                      ₹
                      {Number(
                        po.totalAmount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  {/* STATUS */}

                  <div className="po-status-area">

                    <span
                      className={`status-badge ${
                        po.status
                          ?.toLowerCase()
                          .replace(
                            /_/g,
                            "-"
                          ) || ""
                      }`}
                    >
                      {formatStatus(
                        po.status
                      )}
                    </span>

                    <div className="status-progress">

                      {PO_STATUSES.map(
                        (
                          status,
                          index
                        ) => (

                          <div
                            key={status}
                            className={
                              index <
                              currentIndex
                                ? "progress-step completed"
                                : index ===
                                  currentIndex
                                ? "progress-step current"
                                : "progress-step"
                            }
                            title={formatStatus(
                              status
                            )}
                          >
                            {index <
                            currentIndex
                              ? "✓"
                              : index + 1}
                          </div>

                        )
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="po-actions">

                    <button
                      className="view-po-btn"
                      onClick={() =>
                        fetchPODetails(
                          po._id
                        )
                      }
                    >
                      View Details
                    </button>

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
                        {formatStatus(
                          nextStatus
                        )}{" "}
                        →
                      </button>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>

      {/* =====================================================
          PO DETAILS MODAL
      ===================================================== */}

      {selectedPO && (

        <div
          className="modal-overlay"
          onClick={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="po-modal">

            <div className="modal-header">

              <div>
                <h2>
                  📋 Purchase Order Details
                </h2>

                <p>
                  {poDetails
                    ?.purchaseOrder
                    ?.poNumber || "Loading..."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>

            </div>

            {loadingDetails ||
            !poDetails ? (

              <div className="modal-loading">
                <div>⏳</div>
                <p>
                  Loading purchase order
                  details...
                </p>
              </div>

            ) : (

              <div className="modal-content">

                <div className="details-grid">

                  <div>
                    <span>Vendor</span>

                    <strong>
                      {poDetails
                        .purchaseOrder
                        ?.vendor
                        ?.companyName || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Contact Person
                    </span>

                    <strong>
                      {poDetails
                        .purchaseOrder
                        ?.vendor
                        ?.contactPerson || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>
                      {poDetails
                        .purchaseOrder
                        ?.vendor
                        ?.email || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {formatStatus(
                        poDetails
                          .purchaseOrder
                          ?.status
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expected Delivery
                    </span>

                    <strong>
                      {poDetails
                        .purchaseOrder
                        ?.expectedDeliveryDate
                        ? new Date(
                            poDetails
                              .purchaseOrder
                              .expectedDeliveryDate
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Total Amount</span>

                    <strong>
                      ₹
                      {Number(
                        poDetails
                          .purchaseOrder
                          ?.totalAmount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <h3>
                  🛒 Order Items
                </h3>

                {poDetails.items?.length > 0 ? (

                  <div className="details-items">

                    {poDetails.items.map(
                      (item) => {

                        const itemTotal =
                          Number(
                            item.totalPrice ??
                              Number(
                                item.quantity
                              ) *
                                Number(
                                  item.unitPrice
                                )
                          );

                        return (
                          <div
                            className="detail-item"
                            key={item._id}
                          >

                            {item.photo ? (

                              <img
                                src={item.photo}
                                alt={
                                  item.productName
                                }
                              />

                            ) : (

                              <div className="no-photo">
                                📦
                              </div>

                            )}

                            <div>

                              <strong>
                                {
                                  item.productName
                                }
                              </strong>

                              <p>
                                Quantity:{" "}
                                {item.quantity}
                              </p>

                              <p>
                                Unit Price: ₹
                                {Number(
                                  item.unitPrice ||
                                    0
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              <p>
                                Total: ₹
                                {itemTotal.toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                ) : (

                  <p>
                    No items found.
                  </p>

                )}

                {poDetails
                  .purchaseOrder
                  ?.notes && (

                  <div className="modal-notes">

                    <span>Notes</span>

                    <p>
                      {
                        poDetails
                          .purchaseOrder
                          .notes
                      }
                    </p>

                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default ProcurementPage;