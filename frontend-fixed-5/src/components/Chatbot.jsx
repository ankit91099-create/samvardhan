import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import botIcon from "../assets/chatbot.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const QUICK_REPLIES = [
  "What therapies do you offer?",
  "How do I book an appointment?",
  "Tell me about ADHD support",
  "Where are you located?",
];

const LOCAL_KB = {
  "speech": "We offer **Speech Therapy** to help children improve communication, pronunciation, language development, and confidence. Our certified speech-language pathologists use play-based techniques.",
  "occupational": "**Occupational Therapy** at Samvardhan Bloom helps children develop fine motor skills, sensory processing, hand coordination, and daily life skills like dressing and eating.",
  "aba": "**ABA (Applied Behaviour Analysis) Therapy** is our evidence-based programme for children with autism and developmental delays. It uses positive reinforcement to improve focus, social skills, and behaviour.",
  "psychology": "**Child Psychology** services help with anxiety, ADHD, emotional regulation, and behavioural challenges through counselling and play therapy.",
  "book": "To book a consultation, scroll to the 'Book a Free Consultation' section on our homepage, fill in your details, and our team will contact you within 24 hours. You can also call us at +91 95872 46814 or WhatsApp us.",
  "appointment": "To book an appointment, use the consultation form on our homepage or call +91 95872 46814. We respond within 24 hours.",
  "location": "We are located at: Pillar No 15, B/60, Maurya Path, near Bailey Road, Ashokpuri, Khajpura, Patna, Bihar 800014.",
  "address": "Our centre is at Pillar No 15, B/60, Maurya Path, near Bailey Road, Ashokpuri, Khajpura, Patna, Bihar 800014.",
  "contact": "You can reach us at +91 95872 46814 (call or WhatsApp). We're happy to help!",
  "phone": "Our phone number is +91 95872 46814. You can call or WhatsApp us.",
  "whatsapp": "You can WhatsApp us at +91 95872 46814.",
  "adhd": "We provide specialised ADHD support through occupational therapy, ABA therapy, and child psychology. Our therapists create personalised plans to improve focus, behaviour, and learning for children with ADHD.",
  "autism": "We offer comprehensive Autism Spectrum Disorder (ASD) support including ABA Therapy, Speech Therapy, and Occupational Therapy. All programmes are evidence-based and child-centred.",
  "cost": "For pricing and session details, please call us at +91 95872 46814 or book a free initial consultation.",
  "fees": "For fees and session details, please call us at +91 95872 46814 or book a free initial consultation.",
  "price": "For pricing information, please contact us at +91 95872 46814.",
  "doctor": "Dr. Sanit Ranjan is our lead Pediatric Occupational Therapist with 15+ years of experience in neurodevelopmental and sensory processing disorders. He is a Certified Sensory Integration Therapist (USC) and founder of Aadhya Development Center.",
  "therapist": "Our therapists are certified professionals with deep expertise in child development, including speech-language pathologists, occupational therapists, ABA specialists, and child psychologists.",
  "hours": "Please call us at +91 95872 46814 to confirm our current working hours.",
  "time": "For our working hours, please contact us at +91 95872 46814.",
  "hello": "Hello! 👋 I'm here to help you learn about Samvardhan Bloom Rehabilitation Centre. I can answer questions about our therapies, location, booking, and more!",
  "hi": "Hi there! 👋 How can I help you today? You can ask me about our therapies, how to book an appointment, or our location.",
  "services": "We offer four core therapy programmes:\n1. 🗣️ **Speech Therapy** — communication & language\n2. ✋ **Occupational Therapy** — motor skills & daily living\n3. 🧩 **ABA Therapy** — behaviour & autism support\n4. 💛 **Child Psychology** — emotional & mental development\n\nWould you like to know more about any specific therapy?",
  "therapy": "We provide Speech Therapy, Occupational Therapy, ABA Therapy, and Child Psychology. Each is tailored to your child's unique needs. Ask me about any one!",
  "learning": "We support children with Learning Disabilities through a combination of occupational therapy, psychology sessions, and personalised learning plans.",
  "behaviour": "Behavioural challenges are addressed through our ABA Therapy and Child Psychology programmes. We use positive reinforcement and structured plans.",
};

function getLocalReply(userText) {
  const text = userText.toLowerCase();
  for (const [key, reply] of Object.entries(LOCAL_KB)) {
    if (text.includes(key)) return reply;
  }
  return "I'm sorry, I couldn't reach the online assistant right now. For the most accurate information, please call us at **+91 95872 46814** or WhatsApp us. We're happy to help! 😊";
}

const Chatbot = () => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! 👋 I'm the Samvardhan Bloom assistant. I can help you learn about our therapies, our team, or how to book a consultation. How can I help?",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const hasReplied = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    hasReplied.current = true;
    setInput("");

    const userMsg = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated.map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(`${API_URL}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
        signal:  controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Server error");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data.reply },
      ]);

    } catch {
      const fallback = getLocalReply(content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    hasReplied.current = false;
    setMessages([
      {
        role: "assistant",
        content: "Hi again! 👋 How can I help you today?",
      },
    ]);
  };

  return (
    <div className="chatbot">
      <div
        className={"chat-icon" + (open ? " chat-icon--active" : "")}
        onClick={() => setOpen((v) => !v)}
        title="Chat with us"
        role="button"
        aria-label="Open chat assistant"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <img src={botIcon} alt="Open chat" />
        {!open && <span className="chat-badge">💬</span>}
      </div>

      {open && (
        <div className="chat-box" role="dialog" aria-label="Chat assistant">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-online-dot" />
              <div>
                <p className="chat-header-title">Samvardhan Bloom</p>
                <p className="chat-header-sub">Usually replies instantly</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="chat-action-btn" onClick={handleClear} title="New conversation" aria-label="New conversation">↺</button>
              <button className="chat-action-btn" onClick={() => setOpen(false)} title="Close" aria-label="Close chat">✕</button>
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={"chat-msg " + (msg.role === "assistant" ? "bot" : "user")}>
                {msg.content}
              </div>
            ))}

            {!hasReplied.current && (
              <div className="quick-replies">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    className="quick-reply-btn"
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chat-msg bot typing-indicator">
                <span /><span /><span />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              disabled={loading}
              maxLength={500}
              aria-label="Chat message input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="chat-send-btn"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>

          <div className="chat-footer">
            Powered by Samvardhan Bloom &middot; <a href="tel:9587246814">Call us</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
