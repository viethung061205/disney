import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./ProductDetail.css";

function addToCartLocal(product, qty) {
  const saved = localStorage.getItem("cartItems");
  const cart = saved ? JSON.parse(saved) : [];

  const productId = product.id;
  const exists = cart.find((it) => it.id === productId);

  if (exists) {
    exists.quantity += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.ten_sanpham,
      price: product.gia,
      available: product.so_luong,
      image: product.anh,
      quantity: qty,
    });
  }

  localStorage.setItem("cartItems", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);
  const [imagesList, setImagesList] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);

        const res = await fetch(`http://localhost:3000/api/shop/${productId}`);
        const data = await res.json();

        if (!res.ok) {
          setProduct(null);
          return;
        }

        let parsedImages = [];
        if (data.mauanh) {
          try {
            parsedImages = Array.isArray(data.mauanh)
              ? data.mauanh
              : JSON.parse(data.mauanh);
          } catch {
            parsedImages = [];
          }
        }

        setProduct(data);
        setImagesList(parsedImages);
        setActiveImg(parsedImages[0] || data.anh || "");
        setQty(1);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProductData();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${productId}`);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-page">
        <div className="pd-card pd-notfound">
          <h2>Product not found</h2>
          <button className="pd-btn" onClick={() => navigate("/shop")}>
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const stockLeft = Math.max(0, product.so_luong ?? 0);
  const canAdd = stockLeft > 0;

  const handleAdd = async () => {
    if (!canAdd) return;

    const userData = JSON.parse(localStorage.getItem("user"));
    const userEmail = userData?.email;

    if (!userEmail) {
      alert("Please log in to add items to your bag.");
      navigate("/login");
      return;
    }

    if (qty > stockLeft) {
      alert("Selected quantity exceeds available stock.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/shop/themgiohang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          productId: product.id,
          quantity: qty,
        }),
      });

      if (response.ok) {
        addToCartLocal(product, qty);
        alert("Item added to your bag successfully.");
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        alert("Failed to add item to bag.");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  const handleBuyNow = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      alert("Please log in to proceed with purchase.");
      navigate("/login");
      return;
    }

    if (!canAdd) return;

    if (qty > stockLeft) {
      alert("Selected quantity exceeds available stock.");
      return;
    }

    navigate("/checkout", {
      state: {
        buyNowItem: {
          id: product.id,
          ten_sanpham: product.ten_sanpham,
          gia: product.gia,
          anh: product.anh,
          loai: product.loai,
          quantity: qty
        }
      }
    });
  };

  const handleSubmitReview = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
      alert("Please log in to submit a review.");
      navigate("/login");
      return;
    }

    try {
      await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_sanpham: productId,
          user_email: userData.email,
          hoten: userData.hoten,
          avatar: userData.avatar,
          danhgia: rating,
          binhluan: comment,
        }),
      });

      alert("Review submitted successfully.");
      setComment("");
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await fetch(`http://localhost:3000/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      alert("Review deleted successfully.");
      fetchReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review.");
    }
  };

  const handleEditReview = async (review) => {
    const newComment = prompt("Edit your review:", review.binhluan);

    if (!newComment) return;

    try {
      await fetch(`http://localhost:3000/api/reviews/${review.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          binhluan: newComment,
          danhgia: review.danhgia,
        }),
      });

      alert("Review updated successfully.");
      fetchReviews();
    } catch (err) {
      console.error("Failed to update review:", err);
      alert("Failed to update review.");
    }
  };

  return (
    <div className="pd-page">
      <div className="pd-breadcrumb">
        <Link to="/shop">Shop</Link>
        <span> / </span>
        <span>{product.ten_sanpham}</span>
      </div>

      <div className="pd-card">
        <div className="pd-left">
          <div className="pd-main-img">
            {activeImg && <img src={activeImg} alt={product.ten_sanpham} />}
          </div>

          <div className="pd-thumbs">
            {[...new Set([product.anh, ...imagesList])]
              .filter(Boolean)
              .map((url, index) => (
                <button
                  key={index}
                  className={`pd-thumb ${activeImg === url ? "active" : ""}`}
                  onClick={() => setActiveImg(url)}
                  type="button"
                >
                  <img src={url} alt={`thumb-${index}`} />
                </button>
              ))}
          </div>
        </div>

        <div className="pd-right">
          <h1 className="pd-title">{product.ten_sanpham}</h1>

          <p className="pd-meta">
            <b>Category:</b> {product.loai || "General"}
          </p>

          <p className="pd-meta">
            <b>Available:</b> {stockLeft}
          </p>

          <div className="pd-price">
            {product.gia?.toLocaleString("vi-VN")} VND
          </div>

          <div className="pd-qty">
            <button
              className="pd-qty-btn"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              type="button"
            >
              -
            </button>

            <span className="pd-qty-value">{qty}</span>

            <button
              className="pd-qty-btn"
              onClick={() => {
                if (qty + 1 > stockLeft) {
                  alert("Selected quantity exceeds available stock.");
                  return;
                }
                setQty((q) => q + 1);
              }}
              type="button"
              disabled={!canAdd}
            >
              +
            </button>
          </div>

          <button className="pd-btn" onClick={handleAdd} disabled={!canAdd}>
            {canAdd ? "Add to bag" : "Out of stock"}
          </button>

          <button className="pd-btn buy-now-btn" onClick={handleBuyNow} disabled={!canAdd}>
            Buy Now
          </button>

          <div className="pd-desc">
            <h3>Description</h3>
            <p>{product.mota || "No description available."}</p>
          </div>

          <div className="pd-review">
            <h3>Customer Reviews</h3>

            <div className="pd-review-form">
              <select
                className="pd-review-select"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value="5">5 ⭐</option>
                <option value="4">4 ⭐</option>
                <option value="3">3 ⭐</option>
                <option value="2">2 ⭐</option>
                <option value="1">1 ⭐</option>
              </select>

              <textarea
                className="pd-review-textarea"
                placeholder="Write your review..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <button
                className="pd-review-btn"
                onClick={handleSubmitReview}
              >
                Submit Review
              </button>
            </div>

            <div className="pd-review-list">
              {reviews.length > 0 ? (
                reviews.map((r) => {
                  const isOwner = currentUser?.email === r.user_email;

                  return (
                    <div key={r.id} className="pd-review-item" style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      
                      <div className="pd-review-avatar">
                        <img 
                          src={r.avatar || "https://via.placeholder.com/50"} 
                          alt="User" 
                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      </div>

                      <div className="pd-review-content" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong className="pd-review-name">{r.hoten || "Anonymous"}</strong>
                          <p className="pd-review-rating">{"⭐".repeat(r.danhgia)}</p>
                        </div>
                        
                        <p className="pd-review-comment" style={{ margin: '5px 0' }}>{r.binhluan}</p>
                        <small className="pd-review-date" style={{ color: '#888' }}>
                          {new Date(r.ngaytao).toLocaleDateString("vi-VN")}
                        </small>
                      </div>

                      {isOwner && (
                        <div className="pd-review-actions">
                          <button className="pd-review-edit" onClick={() => handleEditReview(r)}>Edit</button>
                          <button className="pd-review-delete" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="pd-review-empty">No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}