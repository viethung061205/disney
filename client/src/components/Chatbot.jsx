import { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

const Chatbot = ({ userEmail }) => { 
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Mickey here. How can I help you with Disneyland tickets today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const getCurrentEmail = () => {
    if (userEmail) return userEmail;
    const savedUser = JSON.parse(localStorage.getItem("user"));
    return savedUser?.email || "guest@example.com";
  };

  const email = getCurrentEmail();
  const isGuest = email === "guest@example.com";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([
      { role: "bot", text: "Hi! Mickey here. How can I help you today?" }
    ]);
  }, [email]);

  useEffect(() => {
    const loadNewHistory = async () => {
      if (isGuest) return;

      try {
        const res = await fetch(`http://localhost:3000/api/chatbot/laylichsu?email=${email}`);
        const data = await res.json();

        if (data && data.length > 0) {
          const history = data.flatMap(m => [
            { role: "user", text: m.cau_hoi },
            { role: "bot", text: m.cau_tra_loi }
          ]);
          setMessages(history);
        } else {
          setMessages([{ role: "bot", text: "Hi! Mickey here. How can I help you today?" }]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (open) {
      loadNewHistory();
    }
  }, [email, open]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isGuest) return;

    const userText = input;

    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:3000/api/chatbot/hoiAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userText, 
          email: email
        }),
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: "bot", text: data.text }
      ]);

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (isGuest) return;

    if (window.confirm("Delete all chat history?")) {
      await fetch("http://localhost:3000/api/chatbot/xoalichsu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessages([
        { role: "bot", text: "Hi! Mickey here. How can I help you with Disneyland tickets today?" }
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      {!open && (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          <img src="/mickey.png" alt="Mickey" />
        </button>
      )}

      {open && (
        <div className="chatbox">
          <div className="chat-header">
            <span>Mickey Assistant</span>
            <div>
              <button onClick={handleClear} title="Clear history" style={{marginRight: '10px'}}>🗑️</button>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chat-content">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.text}
              </div>
            ))}

            {isTyping && (
              <div className="message bot">Typing...</div>
            )}

            {isGuest && (
              <div className="message bot">Please login to use this feature.</div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isGuest ? "Please login to chat..." : "Type your message..."}
              disabled={isGuest}
            />
            <button onClick={handleSend} disabled={isGuest}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;