import { useEffect, useState } from "react";
import "./CustomerPage.css";

const API = "http://localhost:5000/api";

function ProductCatalog({ user, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");

  // ================================
  // FETCH PRODUCTS
  // ================================

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API}/products`);
      const data = await response.json();

      if (response.ok) {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setMessage("❌ Cannot connect to backend");
    }
  };

  // ================================
  // GET CATEGORIES
  // ================================

  const categories = [
    "All",
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  // ================================
  // FILTER PRODUCTS
  // ================================

  const filteredProducts = products.filter((product) => {
    const productName =
      product.productName?.toLowerCase() || "";

    const productCategory =
      product.category?.toLowerCase() || "";

    const searchText = search.toLowerCase();

    const matchesSearch =
      productName.includes(searchText) ||
      productCategory.includes(searchText) ||
      product.description
        ?.toLowerCase()
        .includes(searchText);

    const matchesCategory =
      category === "All" ||
      product.category === category;

    return matchesSearch && matchesCategory;
  });

  // ================================
  // ADD TO CART
  // ================================

  const addToCart = (product) => {
    const existingCart =
      JSON.parse(localStorage.getItem("customerCart")) || [];

    const existingProductIndex =
      existingCart.findIndex(
        (item) => item._id === product._id
      );

    if (existingProductIndex !== -1) {
      existingCart[existingProductIndex].cartQuantity += 1;
    } else {
      existingCart.push({
        ...product,
        cartQuantity: 1,
      });
    }

    localStorage.setItem(
      "customerCart",
      JSON.stringify(existingCart)
    );

    setMessage(
      `✅ ${product.productName} added to cart`
    );

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  return (
    <div className="customer-page">

      {/* ================================
          HEADER
      ================================= */}

      <header className="customer-header">

        <div className="customer-brand">

          <div className="brand-icon">
            🛒
          </div>

          <div>
            <h1>Product Catalog</h1>

            <p>
              Browse products from registered vendors
            </p>
          </div>

        </div>

        <div className="customer-user">

          <div className="customer-avatar">
            {(user?.name || "C")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="customer-user-info">

            <strong>
              {user?.name || "Customer"}
            </strong>

            <span>
              {user?.email || "Customer Account"}
            </span>

          </div>

          <button
            className="customer-nav-button"
            onClick={() => onNavigate("dashboard")}
          >
            Dashboard
          </button>

          <button
            className="cart-header-button"
            onClick={() => onNavigate("cart")}
          >
            🛒 Cart
          </button>

        </div>

      </header>


      {/* ================================
          PAGE INTRO
      ================================= */}

      <section className="catalog-hero">

        <div>

          <span className="customer-label">
            PRODUCT MARKETPLACE
          </span>

          <h2>
            Find what you need
          </h2>

          <p>
            Explore products supplied by our registered
            vendors and add them to your cart.
          </p>

        </div>

        <div className="catalog-hero-icon">
          📦
        </div>

      </section>


      {/* ================================
          SEARCH + FILTER
      ================================= */}

      <section className="catalog-toolbar">

        <div className="search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="category-filter">

          <label>
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}

          </select>

        </div>

      </section>


      {/* ================================
          MESSAGE
      ================================= */}

      {message && (
        <div className="customer-message">
          {message}
        </div>
      )}


      {/* ================================
          PRODUCT COUNT
      ================================= */}

      <div className="catalog-result-info">

        <div>

          <span>
            AVAILABLE PRODUCTS
          </span>

          <h3>
            {filteredProducts.length} Products
          </h3>

        </div>

        {search && (
          <p>
            Search results for{" "}
            <strong>"{search}"</strong>
          </p>
        )}

      </div>


      {/* ================================
          PRODUCTS
      ================================= */}

      {filteredProducts.length === 0 ? (

        <div className="customer-empty-state">

          <div className="empty-icon">
            📦
          </div>

          <h3>
            No products found
          </h3>

          <p>
            Try changing your search or category filter.
          </p>

          <button
            className="primary-btn"
            onClick={() => {
              setSearch("");
              setCategory("All");
            }}
          >
            Clear Filters
          </button>

        </div>

      ) : (

        <section className="customer-product-grid">

          {filteredProducts.map((product) => {

            const stock =
              Number(product.quantity || 0);

            const isOutOfStock = stock <= 0;

            return (

              <div
                className="customer-product-card"
                key={product._id}
              >

                {/* IMAGE */}

                <div className="customer-product-image">

                  {product.photo ? (

                    <img
                      src={product.photo}
                      alt={product.productName}
                    />

                  ) : (

                    <div className="customer-product-placeholder">
                      📦
                    </div>

                  )}

                  <span
                    className={
                      isOutOfStock
                        ? "stock-badge out"
                        : "stock-badge"
                    }
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : `${stock} in stock`}
                  </span>

                </div>


                {/* CONTENT */}

                <div className="customer-product-content">

                  <span className="product-category">
                    {product.category || "General"}
                  </span>

                  <h3>
                    {product.productName}
                  </h3>

                  <p>
                    {product.description ||
                      "No description available."}
                  </p>


                  {product.sku && (
                    <small className="product-sku">
                      SKU: {product.sku}
                    </small>
                  )}


                  {/* PRICE */}

                  <div className="customer-product-bottom">

                    <div className="customer-product-price">

                      <span>
                        Unit Price
                      </span>

                      <strong>
                        ₹
                        {Number(
                          product.unitPrice || 0
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>


                    <button
                      className="add-cart-btn"
                      disabled={isOutOfStock}
                      onClick={() =>
                        addToCart(product)
                      }
                    >
                      {isOutOfStock
                        ? "Unavailable"
                        : "+ Add to Cart"}
                    </button>

                  </div>

                </div>

              </div>

            );
          })}

        </section>

      )}

    </div>
  );
}

export default ProductCatalog;