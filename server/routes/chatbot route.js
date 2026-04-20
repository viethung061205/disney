const express = require("express");
const router = express.Router();
const chatbot = require("../api/chatbot");

router.post("/hoiAI", chatbot.hoiAI);
router.get("/laylichsu", chatbot.laylichsu); 
router.post("/xoalichsu", chatbot.xoalichsu); 

module.exports = router;