"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, Loader2, Bot, User, Sparkles, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the common symptoms of malaria?",
  "How does the MedQR episode system work?",
  "What should I do if I miss a dose of medication?",
  "How can I access my health records?",
  "What is the difference between a pharmacist and a doctor?",
  "How do I prepare for a blood test?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm **MedAI**, your intelligent health assistant powered by Gemini AI.\n\nI can help you with:\n- General health questions and symptom information\n- How to navigate the MedQR system\n- Understanding medical terms and procedures\n- Wellness and preventive health advice\n\n*Remember: I'm an AI assistant — always consult a licensed healthcare professional for personal medical advice.*\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get a response.");
      } else {
        setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  // Simple markdown-like renderer
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic
      rendered = rendered.replace(/\*(.*?)\*/g, "<em>$1</em>");
      // Bullet points
      if (rendered.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 mb-1 list-disc" dangerouslySetInnerHTML={{ __html: rendered.slice(2) }} />
        );
      }
      if (rendered.trim() === "") return <br key={i} />;
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const hasOnlyWelcome = messages.length === 1;

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid var(--border-color)",
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          <ArrowLeft size={16} />
          Home
        </Link>

        <div style={{ width: "1px", height: "20px", background: "var(--border-color)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(8,127,121,0.3)",
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>MedAI Assistant</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Powered by Gemini AI · MedQR Health System
            </div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Online</span>
        </div>
      </header>

      {/* MESSAGES AREA */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Suggested questions — only show at start */}
        {hasOnlyWelcome && (
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Suggested Questions
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "9999px",
                    border: "1.5px solid var(--primary)",
                    background: "rgba(8,127,121,0.06)",
                    color: "var(--primary-dark)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(8,127,121,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(8,127,121,0.06)")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: "0.75rem",
              alignItems: "flex-start",
              maxWidth: "100%",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  msg.role === "assistant"
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "linear-gradient(135deg, #64748b, #475569)",
                boxShadow:
                  msg.role === "assistant"
                    ? "0 3px 10px rgba(8,127,121,0.3)"
                    : "0 3px 10px rgba(100,116,139,0.25)",
              }}
            >
              {msg.role === "assistant" ? (
                <Sparkles size={16} color="white" />
              ) : (
                <User size={16} color="white" />
              )}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: "min(680px, 80%)",
                padding: "0.85rem 1.1rem",
                borderRadius: msg.role === "user" ? "20px 6px 20px 20px" : "6px 20px 20px 20px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "white",
                color: msg.role === "user" ? "white" : "var(--text-main)",
                fontSize: "0.925rem",
                lineHeight: 1.6,
                boxShadow:
                  msg.role === "user"
                    ? "0 4px 14px rgba(8,127,121,0.25)"
                    : "0 2px 10px rgba(0,0,0,0.07)",
                border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none",
              }}
            >
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                boxShadow: "0 3px 10px rgba(8,127,121,0.3)",
              }}
            >
              <Sparkles size={16} color="white" />
            </div>
            <div
              style={{
                padding: "0.85rem 1.1rem",
                borderRadius: "6px 20px 20px 20px",
                background: "white",
                border: "1px solid var(--border-color)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
              }}
            >
              <Loader2 size={15} className="animate-spin" />
              MedAI is thinking...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "12px",
              color: "#dc2626",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div
        style={{
          background: "white",
          borderTop: "1px solid var(--border-color)",
          padding: "1rem 1.5rem",
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-end",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask MedAI a health question... (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "1.5px solid var(--border-color)",
              borderRadius: "14px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              lineHeight: 1.5,
              outline: "none",
              transition: "border-color 0.2s",
              background: "var(--surface)",
              color: "var(--text-main)",
              overflowY: "auto",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--primary)")}
            onBlur={e => (e.target.style.borderColor = "var(--border-color)")}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              width: 46,
              height: 46,
              borderRadius: "12px",
              background:
                loading || !input.trim()
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow:
                loading || !input.trim() ? "none" : "0 4px 12px rgba(8,127,121,0.35)",
            }}
          >
            <Send size={18} color={loading || !input.trim() ? "#94a3b8" : "white"} />
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            marginTop: "0.5rem",
            maxWidth: 800,
            margin: "0.5rem auto 0",
          }}
        >
          MedAI can make mistakes. Always consult a licensed healthcare provider for personal medical advice.
        </p>
      </div>
    </div>
  );
}
