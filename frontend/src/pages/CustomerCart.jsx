import { useEffect, useState } from "react";
import "./CustomerCart.css";

const API = "https://procurax-o4mh.onrender.com/api";

function CustomerCart({ user, onNavigate }) {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOAD CART
  // =====================================================

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const savedCart =
        JSON.parse(
          localStorage.getItem("customerCart")
        ) || [];

      setCart(Array.isArray(savedCart) ? savedCart : []);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart([]);
    }
  };

  // =====================================================
  // UPDATE CART
  // =====================================================

  const updateCart = (updatedCart) => {
    setCart(updatedCart);

    localStorage.setItem(
      "customerCart",
      JSON.stringify(updatedCart)
    );
  };

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQuantity = (index) => {
    const updatedCart = [...cart];

    const currentQuantity = Number(
      updatedCart[index].cartQuantity || 1
    );

    const availableStock = Number(
      updatedCart[index].quantity || 0
    );

    // Prevent quantity from exceeding stock
    if (
      availableStock > 0 &&
      currentQuantity >= availableStock
    ) {
      setMessage(
        `⚠️ Only ${availableStock} item${
          availableStock !== 1 ? "s" : ""
        } available in stock`
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);

      return;
    }

    updatedCart[index].cartQuantity =
      currentQuantity + 1;

    updateCart(updatedCart);
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQuantity = (index) => {
    const updatedCart = [...cart];

    const currentQuantity = Number(
      updatedCart[index].cartQuantity || 1
    );

    if (currentQuantity <= 1) {
      removeItem(index);
      return;
    }

    updatedCart[index].cartQuantity =
      currentQuantity - 1;

    updateCart(updatedCart);
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (index) => {
    const updatedCart = cart.filter(
      (_, itemIndex) => itemIndex !== index
    );

    updateCart(updatedCart);

    setMessage("🗑️ Item removed from cart");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = () => {
    setCart([]);

    localStorage.removeItem("customerCart");

    setMessage("🛒 Cart cleared");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // =====================================================
  // ITEM TOTAL
  // =====================================================

  const getItemTotal = (item) => {
    const price = Number(
      item.unitPrice || 0
    );

    const quantity = Number(
      item.cartQuantity || 1
    );

    return price * quantity;
  };

  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount = cart.reduce(
    (total, item) =>
      total + getItemTotal(item),
    0
  );

  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems = cart.reduce(
    (total, item) =>
      total +
      Number(item.cartQuantity || 1),
    0
  );

  // =====================================================
  // GENERATE PO NUMBER
  // =====================================================

  const generatePONumber = () => {
    return (
      "PO-" +
      Date.now().toString().slice(-8)
    );
  };

  // =====================================================
  // GET VENDOR ID
  // =====================================================

  const getVendorId = (item) => {
    return (
      item.vendor?._id ||
      item.vendor ||
      item.vendorId
    );
  };

  // =====================================================
  // CHECKOUT
  // =====================================================

  const checkout = async () => {
    if (cart.length === 0) {
      setMessage("❌ Your cart is empty");
      return;
    }

    // -------------------------------------------------
    // CHECK VENDOR
    // -------------------------------------------------

    const vendorIds = cart
      .map((item) => getVendorId(item))
      .filter(Boolean);

    if (vendorIds.length === 0) {
      setMessage(
        "❌ Vendor information is missing from the products."
      );

      return;
    }

    // -------------------------------------------------
    // CURRENT VERSION SUPPORTS ONE VENDOR PER PO
    // -------------------------------------------------

    const firstVendorId = vendorIds[0];

    const differentVendor = vendorIds.some(
      (id) => String(id) !== String(firstVendorId)
    );

    if (differentVendor) {
      setMessage(
        "⚠️ Your cart contains products from different vendors. Please order products from one vendor at a time."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // -------------------------------------------------
      // PREPARE ORDER ITEMS
      // -------------------------------------------------

      const orderItems = cart.map((item) => ({
        productName:
          item.productName,

        itemPhoto:
          item.photo || "",

        quantity: Number(
          item.cartQuantity || 1
        ),

        unitPrice: Number(
          item.unitPrice || 0
        ),
      }));

      // -------------------------------------------------
      // EXPECTED DELIVERY DATE
      // 7 DAYS FROM TODAY
      // -------------------------------------------------

      const deliveryDate = new Date();

      deliveryDate.setDate(
        deliveryDate.getDate() + 7
      );

      const expectedDeliveryDate =
        deliveryDate
          .toISOString()
          .split("T")[0];

      // -------------------------------------------------
      // CREATE PURCHASE ORDER
      // -------------------------------------------------

      const response = await fetch(
        `${API}/purchase-orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            poNumber:
              generatePONumber(),

            vendor:
              firstVendorId,

            expectedDeliveryDate,

            totalAmount,

            notes:
              `Customer order by ${
                user?.name || "Customer"
              }`,

            items: orderItems,
          }),
        }
      );

      const data =
        await response.json();

      // -------------------------------------------------
      // HANDLE ERROR
      // -------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create purchase order"
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      setMessage(
        "✅ Order placed successfully!"
      );

      // Clear cart
      setCart([]);

      localStorage.removeItem(
        "customerCart"
      );

      // Navigate to orders
      setTimeout(() => {
        onNavigate("orders");
      }, 1200);

    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      setMessage(
        "❌ " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customer-cart-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="cart-header">

        <div>
          <span>
            CUSTOMER PORTAL
          </span>

          <h1>
            🛒 My Cart
          </h1>

          <p>
            Review your selected products
            before placing your order.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() =>
            onNavigate("products")
          }
        >
          ← Continue Shopping
        </button>

      </div>


      {/* =================================================
          EMPTY CART
      ================================================= */}

      {cart.length === 0 ? (

        <div className="cart-empty">

          <div className="cart-empty-icon">
            🛒
          </div>

          <h2>
            Your cart is empty
          </h2>

          <p>
            Add some products to your
            cart before checking out.
          </p>

          <button
            className="cart-primary-btn"
            onClick={() =>
              onNavigate("products")
            }
          >
            Browse Products →
          </button>

        </div>

      ) : (

        <div className="cart-layout">

          {/* =================================================
              CART ITEMS
          ================================================= */}

          <section className="cart-items-section">

            <div className="cart-section-title">

              <div>

                <span>
                  YOUR ITEMS
                </span>

                <h2>
                  {cart.length} Product
                  {cart.length !== 1
                    ? "s"
                    : ""}
                </h2>

              </div>

              <button
                className="clear-cart-btn"
                onClick={clearCart}
              >
                Clear Cart
              </button>

            </div>


            <div className="cart-items">

              {cart.map(
                (item, index) => (

                  <div
                    className="cart-item"
                    key={
                      item._id ||
                      item.id ||
                      index
                    }
                  >

                    {/* IMAGE */}

                    <div className="cart-item-image">

                      {item.photo ? (

                        <img
                          src={item.photo}
                          alt={
                            item.productName
                          }
                        />

                      ) : (

                        <span>
                          📦
                        </span>

                      )}

                    </div>


                    {/* DETAILS */}

                    <div className="cart-item-details">

                      <span className="cart-category">
                        {item.category ||
                          "General"}
                      </span>

                      <h3>
                        {item.productName}
                      </h3>

                      <p>
                        ₹
                        {Number(
                          item.unitPrice ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                        {" "} / unit
                      </p>

                      {item.sku && (
                        <small>
                          SKU: {item.sku}
                        </small>
                      )}

                    </div>


                    {/* QUANTITY */}

                    <div className="quantity-control">

                      <button
                        onClick={() =>
                          decreaseQuantity(
                            index
                          )
                        }
                        disabled={loading}
                      >
                        −
                      </button>

                      <strong>
                        {Number(
                          item.cartQuantity ||
                            1
                        )}
                      </strong>

                      <button
                        onClick={() =>
                          increaseQuantity(
                            index
                          )
                        }
                        disabled={loading}
                      >
                        +
                      </button>

                    </div>


                    {/* TOTAL */}

                    <div className="cart-item-total">

                      <strong>
                        ₹
                        {getItemTotal(
                          item
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                        disabled={loading}
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>


          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside className="cart-summary">

            <span>
              ORDER SUMMARY
            </span>

            <h2>
              Checkout
            </h2>


            <div className="summary-row">

              <span>
                Products
              </span>

              <strong>
                {cart.length}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Total Items
              </span>

              <strong>
                {totalItems}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Delivery
              </span>

              <strong>
                7 Days
              </strong>

            </div>


            <div className="summary-divider" />


            <div className="summary-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {totalAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            {/* CHECKOUT */}

            <button
              className="checkout-btn"
              onClick={checkout}
              disabled={loading}
            >
              {loading
                ? "Placing Order..."
                : "Place Order →"}
            </button>


            <p className="checkout-note">
              Your order will be created as
              a Purchase Order and sent
              through the procurement workflow.
            </p>

          </aside>

        </div>

      )}


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (

        <div className="cart-message">
          {message}
        </div>

      )}

    </div>
  );
}

export default CustomerCart;