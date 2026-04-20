import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Shop.css";

const Shop = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [sortPrice, setSortPrice] = useState("NONE");

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/shop");
        if (!res.ok) return;
        const data = await res.json();

        const list = Array.isArray(data) ? data : data.products || [];
        setProducts(list);
        setFilteredProducts(list);

        const qtyInit = {};
        list.forEach((p) => {
          const id = p.id || p._id;
          if (id !== undefined) qtyInit[id] = 1;
        });
        setQuantities(qtyInit);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/reviews/summary");
        const data = await res.json();

        const map = {};
        data.forEach((r) => {
          map[r.id_sanpham] = r;
        });

        setReviewSummary(map);
      } catch (err) {
        console.error("Review fetch error:", err);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCartLocal = (product, quantity) => {
    const productId = product.id ?? product._id;
    if (productId === undefined) return;

    const exists = cartItems.find((item) => {
      const itemId = item.id ?? item._id;
      return itemId !== undefined && itemId === productId;
    });

    if (exists) {
      setCartItems(
        cartItems.map((item) => {
          const itemId = item.id ?? item._id;
          return itemId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        })
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.ten_sanpham,
          price: product.gia,
          available: product.so_luong,
          image: product.anh,
          quantity: quantity,
        },
      ]);
    }

    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleQuantityChange = (id, value, stock) => {
    let qty = parseInt(value) || 1;
    if (qty < 1) qty = 1;
    if (qty > stock) {
      alert("Quantity exceeds available stock!");
      qty = stock;
    }
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const addToCart = async (product) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const userEmail = userData?.email;

    if (!userEmail) {
      alert("Please login to add products to bag!");
      navigate("/login");
      return;
    }

    const productId = product.id ?? product._id;
    const quantity = quantities[productId] || 1;
    const stock = product.so_luong || product.soluong || product.available || 0;

    if (stock === 0) {
      alert("This product is out of stock!");
      return;
    }

    if (quantity > stock) {
      alert("Quantity exceeds available stock!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/shop/themgiohang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          productId: productId,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        addToCartLocal(product, quantity);
        alert("Added to bag successfully!");
      } else {
        alert("Failed to add to bag");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  const applyFilterAndSort = (category, sortType) => {
    let list = [...products];

    if (category !== "ALL") {
      list = list.filter((p) => p.loai === category);
    }

    if (sortType === "ASC") {
      list.sort((a, b) => (a.gia || 0) - (b.gia || 0));
    }

    if (sortType === "DESC") {
      list.sort((a, b) => (b.gia || 0) - (a.gia || 0));
    }

    setFilteredProducts(list);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    applyFilterAndSort(category, sortPrice);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortPrice(value);
    applyFilterAndSort(activeCategory, value);
  };

  return (
    <div className="shop-page">
      <div className="shop-banner">
        <h1 className="shop-title">Disney Shop</h1>
        <img
          src="https://i.pinimg.com/1200x/4a/8a/0c/4a8a0c5a87d312b7ec5f3079b9614c0a.jpg"
          alt="Disney Store"
        />
      </div>

      <div className="shop-toolbar-wrapper">
        <div className="shop-toolbar">
          <div className="toolbar-left">
            <select
              className="sort-select"
              value={sortPrice}
              onChange={handleSortChange}
            >
              <option value="NONE">Sort by price</option>
              <option value="ASC">Price: Low → High</option>
              <option value="DESC">Price: High → Low</option>
            </select>
          </div>

          <div className="toolbar-right">
            <p className="result-count">
              Showing {filteredProducts.length} items
            </p>
          </div>
        </div>
      </div>

      <div className="shop-main">
        <div className="shop-sidebar">
          <ul className="category-list">
            <li
              className={activeCategory === "ALL" ? "active" : ""}
              onClick={() => handleCategoryClick("ALL")}
            >
              All
            </li>
            <li
              className={activeCategory === "Accessories" ? "active" : ""}
              onClick={() => handleCategoryClick("Accessories")}
            >
              Accessories
            </li>
            <li
              className={activeCategory === "Toys" ? "active" : ""}
              onClick={() => handleCategoryClick("Toys")}
            >
              Toys
            </li>
            <li
              className={
                activeCategory === "Household & School supplies" ? "active" : ""
              }
              onClick={() => handleCategoryClick("Household & School supplies")}
            >
              Household & School supplies
            </li>
          </ul>
        </div>

        <div className="shop-products">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((item) => {
              const id = item.id ?? item._id;
              const stock = item.so_luong || item.soluong || item.available || 0;
              const outOfStock = stock === 0;

              return (
                <div key={id} className="product-card">
                  <Link
                    to={`/shop/${id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <img
                      src={
                        item.anh ||
                        item.hinhanh ||
                        item.image ||
                        (Array.isArray(item.mauanh) ? item.mauanh[0] : "")
                      }
                      alt={item.ten_sanpham || item.ten || item.name}
                    />
                    <p className="product-name">
                      {item.ten_sanpham || item.ten || item.name}
                    </p>

                    {reviewSummary[id] ? (
                      <div className="product-rating">
                        <span className="stars">
                          {"★".repeat(Math.round(reviewSummary[id].avg_rating))}
                        </span>
                        <span className="rating-number">
                          {Number(reviewSummary[id].avg_rating).toFixed(1)}
                        </span>
                        <span className="review-count">
                          ({reviewSummary[id].total})
                        </span>
                      </div>
                    ) : (
                      <p className="no-review">No reviews</p>
                    )}
                  </Link>

                  <p>
                    {outOfStock ? (
                      <span style={{ color: "red" }}>Out of stock</span>
                    ) : (
                      `Available: ${stock}`
                    )}
                  </p>

                  <p>
                    Price:{" "}
                    {(item.gia || item.price)?.toLocaleString("vi-VN")} VND
                  </p>

                  {!outOfStock && (
                    <div style={{ marginBottom: "10px" }}>
                      <input
                        type="number"
                        min="1"
                        max={stock}
                        value={quantities[id] || 1}
                        onChange={(e) =>
                          handleQuantityChange(id, e.target.value, stock)
                        }
                        style={{ width: "60px", padding: "6px" }}
                      />
                    </div>
                  )}

                  <div className="product-buttons">
                    <button onClick={() => navigate(`/shop/${id}`)}>
                      Quick shop
                    </button>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={outOfStock}
                      style={outOfStock ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    >
                      Add to bag
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            !loading && <p>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
