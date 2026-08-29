import { useEffect, useMemo, useState } from "react";
import "./CustomerPage.css";

const API = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function CustomerPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customerCart")) || [];
    } catch {
      return [];
    }
  });

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [notification, setNotification] = useState(null);

  // =====================================================
  // GET CUSTOMER ID
  // =====================================================

  const customerId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.user?._id ||
    user?.user?.id;

  // =====================================================
  // FETCH DATA
  // =====================================================

  useEffect(() => {
    fetchProducts();

    if (customerId) {
      fetchOrders();
    } else {
      setLoadingOrders(false);
      console.warn("Customer ID not found:", user);
    }
  }, [customerId]);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await fetch(`${API}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);

      showNotification(
        "Unable to load products",
        "error"
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =====================================================
  // FETCH CUSTOMER ORDERS
  // =====================================================

  const fetchOrders = async () => {
    if (!customerId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    try {
      setLoadingOrders(true);

      const response = await fetch(
        `${API}/purchase-orders/customer/${customerId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch customer orders"
        );
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to fetch customer orders:",
        error
      );

      showNotification(
        "Unable to load your orders",
        "error"
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  // =====================================================
  // NOTIFICATION
  // =====================================================

  const showNotification = (
    message,
    type = "success"
  ) => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  // =====================================================
  // IMAGE URL HELPER
  // =====================================================

  const getImageUrl = (photo) => {
    if (!photo) return "";

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    if (photo.startsWith("/")) {
      return `${SERVER_URL}${photo}`;
    }

    return `${SERVER_URL}/${photo}`;
  };

  // =====================================================
  // CART HELPERS
  // =====================================================

  const saveCart = (updatedCart) => {
    localStorage.setItem(
      "customerCart",
      JSON.stringify(updatedCart)
    );

    setCart(updatedCart);
  };

  const getCartQuantity = (productId) => {
    const item = cart.find(
      (cartItem) =>
        cartItem._id === productId
    );

    return item
      ? Number(item.quantity || 1)
      : 0;
  };

  const totalCartItems = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.unitPrice || 0) *
        Number(item.quantity || 1),
    0
  );

  // =====================================================
  // GET PRODUCT STOCK
  // =====================================================

  const getProductStock = (productId) => {
    const product = products.find(
      (item) => item._id === productId
    );

    if (!product) return 0;

    return Number(product.quantity || 0);
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (product) => {
    const stock = Number(
      product.quantity || 0
    );

    if (stock <= 0) {
      showNotification(
        "Product is out of stock",
        "error"
      );
      return;
    }

    const existingProduct = cart.find(
      (item) =>
        item._id === product._id
    );

    let updatedCart;

    if (existingProduct) {
      const currentQuantity =
        Number(
          existingProduct.quantity || 1
        );

      if (currentQuantity >= stock) {
        showNotification(
          "No more stock available",
          "error"
        );
        return;
      }

      updatedCart = cart.map((item) =>
        item._id === product._id
          ? {
              ...item,
              quantity:
                currentQuantity + 1,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    saveCart(updatedCart);

    showNotification(
      `${product.productName} added to cart`
    );
  };

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQuantity = (productId) => {
    const currentItem = cart.find(
      (item) =>
        item._id === productId
    );

    if (!currentItem) return;

    const stock =
      getProductStock(productId);

    const currentQuantity =
      Number(
        currentItem.quantity || 1
      );

    if (
      stock > 0 &&
      currentQuantity >= stock
    ) {
      showNotification(
        "No more stock available",
        "error"
      );
      return;
    }

    const updatedCart = cart.map(
      (item) =>
        item._id === productId
          ? {
              ...item,
              quantity:
                currentQuantity + 1,
            }
          : item
    );

    saveCart(updatedCart);
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQuantity = (productId) => {
    const currentItem = cart.find(
      (item) =>
        item._id === productId
    );

    if (!currentItem) return;

    const currentQuantity =
      Number(
        currentItem.quantity || 1
      );

    if (currentQuantity <= 1) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(
      (item) =>
        item._id === productId
          ? {
              ...item,
              quantity:
                currentQuantity - 1,
            }
          : item
    );

    saveCart(updatedCart);
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (productId) => {
    const item = cart.find(
      (cartItem) =>
        cartItem._id === productId
    );

    const updatedCart = cart.filter(
      (cartItem) =>
        cartItem._id !== productId
    );

    saveCart(updatedCart);

    if (item) {
      showNotification(
        `${item.productName} removed from cart`,
        "info"
      );
    }
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = () => {
    localStorage.removeItem(
      "customerCart"
    );

    setCart([]);

    showNotification(
      "Cart cleared",
      "info"
    );
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) => {
        const productName =
          product.productName?.toLowerCase() ||
          "";

        const productCategory =
          product.category?.toLowerCase() ||
          "";

        const searchValue =
          search.toLowerCase().trim();

        const matchesSearch =
          productName.includes(
            searchValue
          ) ||
          productCategory.includes(
            searchValue
          );

        const matchesCategory =
          category === "All" ||
          product.category === category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );
  }, [
    products,
    search,
    category,
  ]);

  // =====================================================
  // STATUS FORMATTER
  // =====================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    const normalized =
      String(status || "")
        .toLowerCase()
        .replace(
          /[\s-]/g,
          "_"
        );

    if (
      normalized.includes(
        "approved"
      ) ||
      normalized.includes(
        "completed"
      ) ||
      normalized.includes(
        "delivered"
      ) ||
      normalized.includes(
        "closed"
      )
    ) {
      return "status-success";
    }

    if (
      normalized.includes(
        "pending"
      ) ||
      normalized.includes(
        "processing"
      ) ||
      normalized.includes(
        "review"
      ) ||
      normalized.includes(
        "sent"
      )
    ) {
      return "status-warning";
    }

    if (
      normalized.includes(
        "rejected"
      ) ||
      normalized.includes(
        "cancelled"
      ) ||
      normalized.includes(
        "failed"
      )
    ) {
      return "status-danger";
    }

    return "status-neutral";
  };

  // =====================================================
  // PRODUCT IMAGE
  // =====================================================

  const ProductImage = ({
    product,
  }) => {
    if (!product.photo) {
      return null;
    }

    return (
      <img
        src={getImageUrl(
          product.photo
        )}
        alt={
          product.productName
        }
        onError={(e) => {
          e.currentTarget.style.display =
            "none";

          if (
            e.currentTarget
              .nextElementSibling
          ) {
            e.currentTarget.nextElementSibling.style.display =
              "flex";
          }
        }}
      />
    );
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const Dashboard = () => (
    <div className="customer-page-content">

      {/* HERO */}

      <section className="customer-hero">
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span className="hero-dot"></span>
            SMART PROCUREMENT
          </div>

          <h2>
            Everything you need,
            <br />
            <span>
              all in one place.
            </span>
          </h2>

          <p>
            Discover products from
            verified vendors, manage
            your cart and keep track
            of your purchase orders
            from one simple dashboard.
          </p>

          <div className="hero-actions">

            <button
              className="hero-primary-btn"
              onClick={() =>
                setActivePage(
                  "products"
                )
              }
            >
              Browse Products
              <span>→</span>
            </button>

            <button
              className="hero-secondary-btn"
              onClick={() =>
                setActivePage(
                  "orders"
                )
              }
            >
              View Orders
            </button>

          </div>
        </div>

        <div className="hero-visual">

          <div className="hero-circle hero-circle-one"></div>

          <div className="hero-circle hero-circle-two"></div>

          <div className="hero-shopping-card">

            <div className="shopping-icon">
              🛍️
            </div>

            <div>
              <strong>
                Smart Shopping
              </strong>

              <span>
                Verified products
              </span>
            </div>

            <div className="shopping-check">
              ✓
            </div>

          </div>

          <div className="floating-card floating-card-top">
            <span>
              Products
            </span>

            <strong>
              {products.length}
            </strong>
          </div>

          <div className="floating-card floating-card-bottom">
            <span>
              Cart Items
            </span>

            <strong>
              {totalCartItems}
            </strong>
          </div>

        </div>
      </section>

      {/* STATS */}

      <section className="customer-stat-grid">

        <div className="customer-stat-card">

          <div className="stat-icon blue">
            📦
          </div>

          <div>
            <span>
              Available Products
            </span>

            <strong>
              {products.length}
            </strong>

            <small>
              From verified vendors
            </small>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="stat-icon purple">
            🛒
          </div>

          <div>
            <span>
              Items in Cart
            </span>

            <strong>
              {totalCartItems}
            </strong>

            <small>
              {cart.length} product
              {cart.length !== 1
                ? "s"
                : ""}
            </small>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="stat-icon green">
            📋
          </div>

          <div>
            <span>
              My Purchase Orders
            </span>

            <strong>
              {orders.length}
            </strong>

            <small>
              Your order history
            </small>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="stat-icon orange">
            🚚
          </div>

          <div>
            <span>
              Order Tracking
            </span>

            <strong>
              Active
            </strong>

            <small>
              Real-time workflow
            </small>
          </div>

        </div>

      </section>

      {/* QUICK ACTIONS */}

      <section className="customer-content-section">

        <div className="customer-section-heading">

          <div>

            <span>
              QUICK ACTIONS
            </span>

            <h2>
              What would you like to do?
            </h2>

            <p>
              Manage your procurement
              journey with simple
              actions.
            </p>

          </div>

        </div>

        <div className="customer-action-grid">

          <button
            className="customer-action-card"
            onClick={() =>
              setActivePage(
                "products"
              )
            }
          >

            <div className="action-icon action-blue">
              📦
            </div>

            <div className="action-card-content">

              <h3>
                Browse Products
              </h3>

              <p>
                Explore products
                supplied by registered
                vendors.
              </p>

              <span>
                Explore products
                <b>→</b>
              </span>

            </div>

          </button>

          <button
            className="customer-action-card"
            onClick={() =>
              setActivePage(
                "cart"
              )
            }
          >

            <div className="action-icon action-purple">
              🛒
            </div>

            <div className="action-card-content">

              <h3>
                My Cart
              </h3>

              <p>
                Review your selected
                products before placing
                an order.
              </p>

              <span>
                Open cart
                <b>→</b>
              </span>

            </div>

          </button>

          <button
            className="customer-action-card"
            onClick={() =>
              setActivePage(
                "orders"
              )
            }
          >

            <div className="action-icon action-green">
              📋
            </div>

            <div className="action-card-content">

              <h3>
                My Orders
              </h3>

              <p>
                View and track your
                purchase orders easily.
              </p>

              <span>
                Track orders
                <b>→</b>
              </span>

            </div>

          </button>

        </div>

      </section>

      {/* RECENT PRODUCTS */}

      <section className="customer-content-section">

        <div className="customer-section-heading section-heading-row">

          <div>

            <span>
              PRODUCT CATALOG
            </span>

            <h2>
              Recently Available
            </h2>

            <p>
              Fresh products available
              from our vendor network.
            </p>

          </div>

          <button
            className="view-all-btn"
            onClick={() =>
              setActivePage(
                "products"
              )
            }
          >
            View All
            <span>→</span>
          </button>

        </div>

        {loadingProducts ? (
          <ProductSkeletons count={4} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No products available"
            text="Products registered by vendors will appear here."
          />
        ) : (
          <div className="customer-mini-product-grid">

            {products
              .slice(0, 4)
              .map(
                (product) => (
                  <div
                    className="customer-mini-product"
                    key={
                      product._id
                    }
                    onClick={() =>
                      setActivePage(
                        "products"
                      )
                    }
                  >

                    <div className="mini-product-image">

                      <ProductImage
                        product={
                          product
                        }
                      />

                      <div
                        className="mini-product-placeholder"
                        style={{
                          display:
                            product.photo
                              ? "none"
                              : "flex",
                        }}
                      >
                        📦
                      </div>

                    </div>

                    <div className="mini-product-details">

                      <span>
                        {product.category ||
                          "General"}
                      </span>

                      <h3>
                        {
                          product.productName
                        }
                      </h3>

                      <div className="mini-product-price">
                        ₹
                        {Number(
                          product.unitPrice ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </div>

                    </div>

                  </div>
                )
              )}

          </div>
        )}

      </section>

    </div>
  );

  // =====================================================
  // PRODUCT CATALOG
  // =====================================================

  const ProductCatalog = () => (
    <div className="customer-page-content">

      <div className="catalog-header">

        <div>

          <span className="customer-label">
            PRODUCT CATALOG
          </span>

          <h2>
            Find what you need 🛍️
          </h2>

          <p>
            Browse products supplied by
            verified vendors.
          </p>

        </div>

        <div className="catalog-count">

          <strong>
            {filteredProducts.length}
          </strong>

          <span>
            Products
          </span>

        </div>

      </div>

      {/* SEARCH */}

      <div className="catalog-toolbar">

        <div className="product-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search products or categories..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="category-filter">

          {categories.map(
            (item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "category-btn active"
                    : "category-btn"
                }
                onClick={() =>
                  setCategory(
                    item
                  )
                }
              >
                {item}
              </button>
            )
          )}

        </div>

      </div>

      {/* PRODUCTS */}

      {loadingProducts ? (
        <ProductSkeletons count={6} />
      ) : filteredProducts.length ===
        0 ? (
        <EmptyState
          icon="🔎"
          title="No products found"
          text="Try searching with another product name or category."
          button={
            search ||
            category !== "All"
              ? "Clear Filters"
              : null
          }
          onButton={() => {
            setSearch("");
            setCategory("All");
          }}
        />
      ) : (
        <div className="catalog-grid">

          {filteredProducts.map(
            (product) => {
              const stock =
                Number(
                  product.quantity ||
                    0
                );

              const cartQuantity =
                getCartQuantity(
                  product._id
                );

              return (
                <div
                  className="catalog-product-card"
                  key={
                    product._id
                  }
                >

                  {/* IMAGE */}

                  <div className="catalog-image">

                    <ProductImage
                      product={
                        product
                      }
                    />

                    <div
                      className="catalog-placeholder"
                      style={{
                        display:
                          product.photo
                            ? "none"
                            : "flex",
                      }}
                    >
                      📦
                    </div>

                    <span className="catalog-category">
                      {product.category ||
                        "General"}
                    </span>

                    {stock <= 0 && (
                      <span className="out-stock-label">
                        Out of Stock
                      </span>
                    )}

                    {stock > 0 &&
                      stock <= 10 && (
                        <span className="low-stock-label">
                          Only{" "}
                          {stock} left
                        </span>
                      )}

                  </div>

                  {/* CONTENT */}

                  <div className="catalog-product-content">

                    <div className="product-title-row">

                      <h3>
                        {
                          product.productName
                        }
                      </h3>

                      {cartQuantity >
                        0 && (
                        <span className="in-cart-badge">
                          In Cart
                        </span>
                      )}

                    </div>

                    <p>
                      {product.description ||
                        "No description available."}
                    </p>

                    <div className="catalog-product-bottom">

                      <div>

                        <span className="price-label">
                          UNIT PRICE
                        </span>

                        <strong className="product-price">
                          ₹
                          {Number(
                            product.unitPrice ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                      <div className="stock-info">

                        <span>
                          STOCK
                        </span>

                        <strong
                          className={
                            stock <= 0
                              ? "stock-zero"
                              : stock <=
                                10
                              ? "stock-low"
                              : ""
                          }
                        >
                          {stock}
                        </strong>

                      </div>

                    </div>

                    {cartQuantity >
                    0 ? (
                      <div className="product-cart-control">

                        <button
                          onClick={() =>
                            decreaseQuantity(
                              product._id
                            )
                          }
                        >
                          −
                        </button>

                        <div>

                          <strong>
                            {
                              cartQuantity
                            }
                          </strong>

                          <span>
                            in cart
                          </span>

                        </div>

                        <button
                          onClick={() =>
                            increaseQuantity(
                              product._id
                            )
                          }
                        >
                          +
                        </button>

                      </div>
                    ) : (
                      <button
                        className="add-cart-btn"
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                        disabled={
                          stock <= 0
                        }
                      >
                        {stock <= 0
                          ? "Out of Stock"
                          : "🛒 Add to Cart"}
                      </button>
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );

  // =====================================================
  // CART PAGE
  // =====================================================

  const CartPage = () => (
    <div className="customer-page-content">

      <div className="catalog-header">

        <div>

          <span className="customer-label">
            SHOPPING CART
          </span>

          <h2>
            My Cart 🛒
          </h2>

          <p>
            Review your selected
            products before placing
            your order.
          </p>

        </div>

        {cart.length > 0 && (
          <button
            className="clear-cart-btn"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        )}

      </div>

      {cart.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          text="Browse our product catalog and add items to your cart."
          button="Browse Products"
          onButton={() =>
            setActivePage(
              "products"
            )
          }
        />
      ) : (
        <div className="cart-layout">

          {/* ITEMS */}

          <div className="cart-items">

            <div className="cart-items-header">

              <div>

                <span>
                  YOUR ITEMS
                </span>

                <h3>
                  {cart.length} Product
                  {cart.length !==
                  1
                    ? "s"
                    : ""}
                </h3>

              </div>

              <span className="cart-item-count">
                {totalCartItems} total
                item
                {totalCartItems !==
                1
                  ? "s"
                  : ""}
              </span>

            </div>

            {cart.map(
              (item) => {
                const quantity =
                  Number(
                    item.quantity ||
                      1
                  );

                const itemTotal =
                  Number(
                    item.unitPrice ||
                      0
                  ) * quantity;

                const stock =
                  getProductStock(
                    item._id
                  );

                return (
                  <div
                    className="cart-item"
                    key={
                      item._id
                    }
                  >

                    <div className="cart-item-image">

                      {item.photo ? (
                        <img
                          src={getImageUrl(
                            item.photo
                          )}
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

                    <div className="cart-item-info">

                      <span>
                        {item.category ||
                          "General"}
                      </span>

                      <h3>
                        {
                          item.productName
                        }
                      </h3>

                      <p>
                        ₹
                        {Number(
                          item.unitPrice ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}{" "}
                        / unit
                      </p>

                    </div>

                    <div className="cart-quantity-control">

                      <button
                        onClick={() =>
                          decreaseQuantity(
                            item._id
                          )
                        }
                      >
                        −
                      </button>

                      <strong>
                        {quantity}
                      </strong>

                      <button
                        onClick={() => {
                          if (
                            stock <= 0 ||
                            quantity >=
                              stock
                          ) {
                            showNotification(
                              "No more stock available",
                              "error"
                            );
                            return;
                          }

                          increaseQuantity(
                            item._id
                          );
                        }}
                      >
                        +
                      </button>

                    </div>

                    <div className="cart-item-total">

                      <span>
                        ITEM TOTAL
                      </span>

                      <strong>
                        ₹
                        {itemTotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        onClick={() =>
                          removeFromCart(
                            item._id
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* SUMMARY */}

          <aside className="cart-summary">

            <span className="summary-label">
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
                {totalCartItems}
              </strong>

            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {cartTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            <button
              className="checkout-btn"
              onClick={() =>
                setActivePage(
                  "checkout"
                )
              }
            >
              Proceed to Order
              <span>→</span>
            </button>

            <button
              className="continue-shopping-btn"
              onClick={() =>
                setActivePage(
                  "products"
                )
              }
            >
              ← Continue Shopping
            </button>

            <div className="secure-note">

              <span>
                ✓
              </span>

              <p>
                Your order will be
                sent to Admin for
                approval before it
                reaches the vendor.
              </p>

            </div>

          </aside>

        </div>
      )}

    </div>
  );

  // =====================================================
  // CHECKOUT PAGE
  // =====================================================

  const CheckoutPage = () => {
    const [
      placingOrder,
      setPlacingOrder,
    ] = useState(false);

    const [notes, setNotes] =
      useState("");

    // -------------------------------------------------
    // GET VENDOR ID
    // -------------------------------------------------

    const getVendorId = (item) => {
      if (
        item.vendor &&
        typeof item.vendor ===
          "object"
      ) {
        return (
          item.vendor._id ||
          item.vendor.id
        );
      }

      return (
        item.vendor ||
        item.vendorId
      );
    };

    // -------------------------------------------------
    // GENERATE PO NUMBER
    // -------------------------------------------------

    const generatePONumber = () => {
      return (
        "PO-" +
        Date.now()
          .toString()
          .slice(-8)
      );
    };

    // -------------------------------------------------
    // PLACE ORDER
    // -------------------------------------------------

    const placeOrder = async () => {
      // -----------------------------------------------
      // CUSTOMER VALIDATION
      // -----------------------------------------------

      if (!customerId) {
        showNotification(
          "Customer information is missing. Please login again.",
          "error"
        );

        return;
      }

      // -----------------------------------------------
      // CART VALIDATION
      // -----------------------------------------------

      if (cart.length === 0) {
        showNotification(
          "Your cart is empty",
          "error"
        );

        setActivePage("cart");

        return;
      }

      // -----------------------------------------------
      // VENDOR VALIDATION
      // -----------------------------------------------

      const vendorIds = [
        ...new Set(
          cart
            .map((item) =>
              getVendorId(item)
            )
            .filter(Boolean)
        ),
      ];

      if (
        vendorIds.length === 0
      ) {
        showNotification(
          "Vendor information is missing from the selected products",
          "error"
        );

        return;
      }

      if (
        vendorIds.length > 1
      ) {
        showNotification(
          "Please order products from one vendor at a time",
          "error"
        );

        return;
      }

      const vendorId =
        vendorIds[0];

      // -----------------------------------------------
      // STOCK VALIDATION
      // -----------------------------------------------

      for (const item of cart) {
        const currentStock =
          getProductStock(
            item._id
          );

        const requestedQuantity =
          Number(
            item.quantity || 1
          );

        if (
          currentStock <= 0
        ) {
          showNotification(
            `${item.productName} is out of stock`,
            "error"
          );

          return;
        }

        if (
          requestedQuantity >
          currentStock
        ) {
          showNotification(
            `Only ${currentStock} ${item.productName} available`,
            "error"
          );

          return;
        }
      }

      try {
        setPlacingOrder(
          true
        );

        // ---------------------------------------------
        // ORDER ITEMS
        // ---------------------------------------------

        const orderItems =
          cart.map(
            (item) => ({
              productName:
                item.productName,

              itemPhoto:
                item.photo || "",

              quantity:
                Number(
                  item.quantity || 1
                ),

              unitPrice:
                Number(
                  item.unitPrice || 0
                ),
            })
          );

        // ---------------------------------------------
        // DELIVERY DATE
        // ---------------------------------------------

        const deliveryDate =
          new Date();

        deliveryDate.setDate(
          deliveryDate.getDate() +
            7
        );

        const expectedDeliveryDate =
          deliveryDate
            .toISOString()
            .split("T")[0];

        // ---------------------------------------------
        // CREATE PURCHASE ORDER
        // ---------------------------------------------

        const response =
          await fetch(
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

                // IMPORTANT
                // Customer ownership
                customer:
                  customerId,

                vendor:
                  vendorId,

                expectedDeliveryDate,

                totalAmount:
                  cartTotal,

                notes:
                  notes.trim() ||
                  `Customer order by ${
                    user?.name ||
                    "Customer"
                  }`,

                items:
                  orderItems,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create purchase order"
          );
        }

        // ---------------------------------------------
        // CLEAR CART
        // ---------------------------------------------

        localStorage.removeItem(
          "customerCart"
        );

        setCart([]);

        // ---------------------------------------------
        // REFRESH ORDERS
        // ---------------------------------------------

        await fetchOrders();

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        showNotification(
          "Order placed! Waiting for Admin approval."
        );

        setTimeout(() => {
          setActivePage(
            "orders"
          );
        }, 900);

      } catch (error) {
        console.error(
          "Place order error:",
          error
        );

        showNotification(
          error.message ||
            "Failed to place order",
          "error"
        );
      } finally {
        setPlacingOrder(
          false
        );
      }
    };

    return (
      <div className="customer-page-content">

        <div className="catalog-header">

          <div>

            <span className="customer-label">
              CHECKOUT
            </span>

            <h2>
              Review Your Order
            </h2>

            <p>
              Confirm your products
              before creating the
              purchase order.
            </p>

          </div>

          <button
            className="back-link-btn"
            onClick={() =>
              setActivePage(
                "cart"
              )
            }
          >
            ← Back to Cart
          </button>

        </div>

        <div className="checkout-layout">

          {/* ORDER REVIEW */}

          <div className="checkout-review">

            <div className="checkout-section-title">

              <div>

                <span>
                  ORDER ITEMS
                </span>

                <h3>
                  {cart.length} Product
                  {cart.length !==
                  1
                    ? "s"
                    : ""}
                </h3>

              </div>

            </div>

            {cart.map(
              (item) => {
                const quantity =
                  Number(
                    item.quantity ||
                      1
                  );

                const total =
                  Number(
                    item.unitPrice ||
                      0
                  ) * quantity;

                return (
                  <div
                    className="checkout-item"
                    key={
                      item._id
                    }
                  >

                    <div className="checkout-item-image">

                      {item.photo ? (
                        <img
                          src={getImageUrl(
                            item.photo
                          )}
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

                    <div>

                      <span>
                        {item.category ||
                          "General"}
                      </span>

                      <h4>
                        {
                          item.productName
                        }
                      </h4>

                      <p>
                        {quantity} × ₹
                        {Number(
                          item.unitPrice ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>

                    <strong>
                      ₹
                      {total.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>
                );
              }
            )}

            <div className="checkout-notes">

              <label>
                Order Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Add any special instructions..."
                rows="4"
              />

            </div>

          </div>

          {/* FINAL SUMMARY */}

          <aside className="checkout-summary">

            <span className="summary-label">
              FINAL SUMMARY
            </span>

            <h2>
              Place Order
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
                {totalCartItems}
              </strong>

            </div>

            <div className="summary-divider"></div>

            <div className="checkout-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {cartTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            <button
              className="checkout-btn"
              onClick={
                placeOrder
              }
              disabled={
                placingOrder
              }
            >
              {placingOrder
                ? "Creating Order..."
                : "Confirm & Place Order →"}
            </button>

            <button
              className="continue-shopping-btn"
              onClick={() =>
                setActivePage(
                  "cart"
                )
              }
            >
              ← Edit Cart
            </button>

            <div className="secure-note">

              <span>
                ✓
              </span>

              <p>
                Your Purchase Order
                will first go to Admin
                for approval. Once
                approved, it can be
                sent to the vendor.
              </p>

            </div>

          </aside>

        </div>

      </div>
    );
  };

  // =====================================================
  // ORDERS PAGE
  // =====================================================

  const OrdersPage = () => (
    <div className="customer-page-content">

      <div className="catalog-header">

        <div>

          <span className="customer-label">
            ORDER MANAGEMENT
          </span>

          <h2>
            My Orders 📋
          </h2>

          <p>
            Track your purchase orders,
            approval and delivery status.
          </p>

        </div>

        <button
          className="catalog-action-btn"
          onClick={() =>
            setActivePage(
              "products"
            )
          }
        >
          + New Order
        </button>

      </div>

      {loadingOrders ? (
        <div className="order-skeleton-list">

          <div className="order-skeleton"></div>

          <div className="order-skeleton"></div>

          <div className="order-skeleton"></div>

        </div>
      ) : orders.length ===
        0 ? (
        <EmptyState
          icon="📋"
          title="No orders yet"
          text="Your purchase orders will appear here after you place an order."
          button="Browse Products"
          onButton={() =>
            setActivePage(
              "products"
            )
          }
        />
      ) : (
        <div className="customer-orders-list">

          {orders.map(
            (order) => (
              <div
                className="customer-order-card"
                key={
                  order._id
                }
              >

                <div className="order-main">

                  <div className="order-icon">
                    📋
                  </div>

                  <div>

                    <span className="order-label">
                      PURCHASE ORDER
                    </span>

                    <h3>
                      {order.poNumber ||
                        "Order"}
                    </h3>

                    <p>
                      Created{" "}
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month:
                                "short",
                              year:
                                "numeric",
                            }
                          )
                        : "Recently"}
                    </p>

                    <p>
                      Delivery:{" "}
                      {order.expectedDeliveryDate
                        ? new Date(
                            order.expectedDeliveryDate
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month:
                                "short",
                              year:
                                "numeric",
                            }
                          )
                        : "Not specified"}
                    </p>

                    {/* VENDOR */}

                    {order.vendor && (
                      <p>
                        Vendor:{" "}
                        <strong>
                          {order.vendor
                            .companyName ||
                            "Vendor"}
                        </strong>
                      </p>
                    )}

                  </div>

                </div>

                <div className="order-right">

                  <strong>
                    ₹
                    {Number(
                      order.totalAmount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <span
                    className={`status-badge ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {formatStatus(
                      order.status
                    )}
                  </span>

                  {/* REJECTION REASON */}

                  {order.status ===
                    "REJECTED" &&
                    order.rejectionReason && (
                      <div className="order-rejection-reason">

                        <span>
                          Rejection Reason
                        </span>

                        <p>
                          {
                            order.rejectionReason
                          }
                        </p>

                      </div>
                    )}

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );

  // =====================================================
  // EMPTY STATE
  // =====================================================

  function EmptyState({
    icon,
    title,
    text,
    button,
    onButton,
  }) {
    return (
      <div className="customer-empty-state">

        <div className="empty-icon">
          {icon}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

        {button && (
          <button
            className="customer-primary-btn"
            onClick={
              onButton
            }
          >
            {button}
            <span>→</span>
          </button>
        )}

      </div>
    );
  }

  // =====================================================
  // PRODUCT SKELETON
  // =====================================================

  function ProductSkeletons({
    count = 4,
  }) {
    return (
      <div className="catalog-grid">

        {Array.from({
          length: count,
        }).map(
          (_, index) => (
            <div
              className="product-skeleton"
              key={index}
            >

              <div className="skeleton-image"></div>

              <div className="skeleton-content">

                <div className="skeleton-line short"></div>

                <div className="skeleton-line"></div>

                <div className="skeleton-line medium"></div>

                <div className="skeleton-button"></div>

              </div>

            </div>
          )
        )}

      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="customer-dashboard">

      {/* =================================================
          TOPBAR
      ================================================= */}

      <header className="customer-topbar">

        <div className="brand-area">

          <div className="brand-mark">
            P
          </div>

          <div>

            <span className="customer-label">
              PROCUREX
            </span>

            <h1>
              Customer Portal
            </h1>

          </div>

        </div>

        <div className="customer-profile">

          <div className="customer-avatar">

            {(user?.name ||
              "C")
              .charAt(0)
              .toUpperCase()}

          </div>

          <div className="profile-info">

            <strong>
              {user?.name ||
                "Customer"}
            </strong>

            <span>
              {user?.email ||
                "Customer Account"}
            </span>

          </div>

          <button
            className="customer-logout"
            onClick={
              onLogout
            }
            title="Logout"
          >
            Logout
          </button>

        </div>

      </header>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="customer-nav">

        <div className="nav-inner">

          <button
            className={
              activePage ===
              "dashboard"
                ? "customer-nav-btn active"
                : "customer-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              activePage ===
              "products"
                ? "customer-nav-btn active"
                : "customer-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "products"
              )
            }
          >
            <span>▦</span>
            Products
          </button>

          <button
            className={
              activePage ===
              "cart"
                ? "customer-nav-btn active"
                : "customer-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "cart"
              )
            }
          >

            <span>
              🛒
            </span>

            Cart

            {totalCartItems >
              0 && (
              <span className="cart-count">
                {totalCartItems}
              </span>
            )}

          </button>

          <button
            className={
              activePage ===
              "orders"
                ? "customer-nav-btn active"
                : "customer-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "orders"
              )
            }
          >
            <span>▤</span>
            Orders
          </button>

        </div>

      </nav>

      {/* =================================================
          PAGE
      ================================================= */}

      {activePage ===
        "dashboard" && (
        <Dashboard />
      )}

      {activePage ===
        "products" && (
        <ProductCatalog />
      )}

      {activePage === "cart" && (
        <CartPage />
      )}

      {activePage ===
        "checkout" && (
        <CheckoutPage />
      )}

      {activePage ===
        "orders" && (
        <OrdersPage />
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="customer-footer">

        <div>

          <strong>
            ProcureX
          </strong>

          <span>
            Smart Vendor &
            Procurement
            Management
          </span>

        </div>

        <span>
          © 2026 ProcureX.
          All rights reserved.
        </span>

      </footer>

      {/* =================================================
          NOTIFICATION
      ================================================= */}

      {notification && (
        <div
          className={`customer-notification ${notification.type}`}
        >

          <span>
            {notification.type ===
            "success"
              ? "✓"
              : notification.type ===
                "error"
              ? "!"
              : "i"}
          </span>

          <p>
            {
              notification.message
            }
          </p>

        </div>
      )}

    </div>
  );
}

export default CustomerPage;