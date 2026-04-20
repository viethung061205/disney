const db = require("../config/db");

exports.layTongQuan = (req, res) => {
  const sql = `
    SELECT id_sanpham, 
           AVG(danhgia) as avg_rating, 
           COUNT(*) as total
    FROM reviews
    GROUP BY id_sanpham
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error while fetching overview data." });
    }
    res.json(rows);
  });
};

exports.layBinhLuan = (req, res) => {
  const id_sanpham = parseInt(req.params.id_sanpham);

  if (isNaN(id_sanpham) || id_sanpham <= 0) {
    return res.status(400).json({ error: "Invalid product ID." });
  }

  const sql = `
    SELECT id, id_sanpham, user_email, hoten, avatar, danhgia, binhluan, ngaytao
    FROM reviews
    WHERE id_sanpham = ?
    ORDER BY ngaytao DESC
  `;

  db.query(sql, [id_sanpham], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch comments." });
    }
    res.json(results || []);
  });
};

exports.themBinhLuan = (req, res) => {
  const { id_sanpham, user_email, hoten, avatar, danhgia, binhluan } = req.body;

  if (!id_sanpham || !user_email || !danhgia) {
    return res.status(400).json({ error: "Missing required fields (product, email, rating)." });
  }

  const sql = `
    INSERT INTO reviews (id_sanpham, user_email, hoten, avatar, danhgia, binhluan)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [id_sanpham, user_email, hoten, avatar, danhgia, binhluan], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to add comment. Please try again." });
    }
    res.json({ message: "Comment added successfully." });
  });
};

exports.suaBinhLuan = (req, res) => {
  const { id } = req.params;
  const { binhluan, danhgia } = req.body;

  if (!binhluan) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  if (!danhgia || isNaN(danhgia) || danhgia < 1 || danhgia > 5) {
    return res.status(400).json({ message: "Rating is required and must be between 1 and 5." });
  }

  const sql = `
    UPDATE reviews 
    SET binhluan = ?, danhgia = ?
    WHERE id = ?
  `;

  db.query(sql, [binhluan, danhgia, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update comment." });
    }
    res.json({ message: "Comment updated successfully." });
  });
};

exports.xoaBinhLuan = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM reviews WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete comment." });
    }
    res.json({ message: "Comment deleted successfully." });
  });
};