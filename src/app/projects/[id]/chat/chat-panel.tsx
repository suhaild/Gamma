"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat, type ChatMessage } from "./use-chat";

type ChatPanelProps = {
  projectId: string;
  teamMembers: string[];
  open: boolean;
  onClose: () => void;
};

const SENDER_COLORS = [
  "#d2af73",
  "#7ec8e3",
  "#c49bdb",
  "#6dcba4",
  "#e8a87c",
  "#82b1ff",
  "#f48fb1",
  "#b9f6ca",
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: ChatMessage;
  isOwn: boolean;
}) {
  const color = getSenderColor(msg.sender_name);

  return (
    <motion.div
      className={`chat-bubble ${isOwn ? "chat-bubble-own" : "chat-bubble-other"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isOwn && (
        <span className="chat-sender" style={{ color }}>
          {msg.sender_name}
        </span>
      )}
      <p className="chat-text">{msg.content}</p>
      <span className="chat-time">{formatTime(msg.created_at)}</span>
    </motion.div>
  );
}

export default function ChatPanel({
  projectId,
  teamMembers,
  open,
  onClose,
}: ChatPanelProps) {
  const { messages, loading, sendMessage } = useChat(projectId);
  const [selectedUser, setSelectedUser] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, selectedUser]);

  async function handleSend() {
    if (!selectedUser || !input.trim() || sending) return;

    setSending(true);
    await sendMessage(selectedUser, input);
    setInput("");
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="chat-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="chat-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <h3>Project Chat</h3>
                <span className="chat-live-dot" />
                <span className="chat-live-label">Live</span>
              </div>
              <button className="chat-close" onClick={onClose} aria-label="Close chat">
                ✕
              </button>
            </div>

            {/* User selector */}
            <div className="chat-user-select">
              <label htmlFor="chat-as">Chat as:</label>
              <select
                id="chat-as"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select your name</option>
                {teamMembers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading && (
                <div className="chat-empty">Loading messages...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="chat-empty">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.sender_name === selectedUser}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              {!selectedUser && (
                <div className="chat-input-disabled">
                  Select your name above to start chatting
                </div>
              )}
              {selectedUser && (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />
                  <button
                    className="chat-send"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? (
                      <span className="loader" />
                    ) : (
                      "Send"
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
