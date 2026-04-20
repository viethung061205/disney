const OpenAI = require("openai");
const db = require("../config/db");
const mickeyPrompt = require("../prompts/mickeyPrompt.js");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

exports.laylichsu = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required." });

  db.query(
    "SELECT cau_hoi, cau_tra_loi FROM chat_history WHERE user_email = ? ORDER BY ngay_tao ASC LIMIT 30",
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};

exports.xoalichsu = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  db.query(
    "DELETE FROM chat_history WHERE user_email = ?",
    [email],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "History cleared" });
    }
  );
};

exports.hoiAI = async (req, res) => {
  const { prompt, email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });
  if (!prompt || prompt.trim() === "") return res.status(400).json({ error: "Question content is required." });

  try {
    const allTickets = await new Promise((resolve) => {
      db.query(
        "SELECT diadiem, loai, mota, gia, giabth FROM tickets ORDER BY diadiem, loai",
        (err, results) => resolve(results || [])
      );
    });

    const historyRows = await new Promise((resolve) => {
      db.query(
        "SELECT cau_hoi, cau_tra_loi FROM chat_history WHERE user_email = ? ORDER BY ngay_tao ASC LIMIT 30",
        [email],
        (err, results) => resolve(results || [])
      );
    });

    const messages = [
      { role: "system", content: mickeyPrompt(allTickets) },
      ...historyRows.flatMap((row) => [
        { role: "user", content: row.cau_hoi },
        { role: "assistant", content: row.cau_tra_loi },
      ]),
      { role: "user", content: prompt },
    ];

    const aiRes = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
    });

    const finalMsg = aiRes.choices[0].message.content;

    await new Promise((resolve) => {
      db.query(
        "INSERT INTO chat_history (user_email, cau_hoi, cau_tra_loi) VALUES (?, ?, ?)",
        [email, prompt, finalMsg],
        () => {
          db.query(
            `DELETE FROM chat_history
             WHERE user_email = ?
             AND id NOT IN (
               SELECT id FROM (
                 SELECT id FROM (
                   SELECT id FROM chat_history
                   WHERE user_email = ?
                   ORDER BY ngay_tao DESC LIMIT 30
                 ) AS latest
               ) AS wrapper
             )`,
            [email, email],
            () => resolve()
          );
        }
      );
    });

    res.json({ text: finalMsg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Mickey is having a nap!" });
  }
};