const express = require("express");
const router = express.Router();
const reviews = require("../api/reviews");
 
router.get("/summary", reviews.layTongQuan);
router.get("/:id_sanpham", reviews.layBinhLuan);
router.post("/", reviews.themBinhLuan);
router.put("/:id", reviews.suaBinhLuan);
router.delete("/:id", reviews.xoaBinhLuan);
 
module.exports = router;