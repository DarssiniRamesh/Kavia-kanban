import React, { useEffect } from "react";

// PUBLIC_INTERFACE
/**
 * ToastModal
 * A simple toast/modal notification that overlays the app.
 * Usage: <ToastModal message="..." type="success|error" onClose={...} />
 */
export default function ToastModal({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(timer);
  }, [onClose, duration, message]);

  return (
    <div
      className="kanban-toast-modal-overlay"
      style={{
        position: "fixed",
        bottom: 36,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 4000,
        pointerEvents: "none",
      }}
    >
      <div
        className="kanban-toast-modal"
        style={{
          minWidth: 220,
          maxWidth: 420,
          background: type === "error" ? "#c13a2b" : "#259d67",
          color: "#fff",
          fontWeight: 600,
          borderRadius: 12,
          padding: "18px 34px 16px 20px",
          fontSize: "1.08rem",
          boxShadow: "0 4px 18px 0 rgba(20,33,61,0.16)",
          display: "flex",
          alignItems: "center",
          gap: 11,
          pointerEvents: "auto",
          position: "relative",
          animation: "toastFadeIn .18s",
        }}
        role="alert"
      >
        <span role="img" aria-label="icon" style={{ fontSize: "1.35em" }}>
          {type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}
        </span>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: 900,
            fontSize: "1.05em",
            marginLeft: 10,
            opacity: 0.8,
            cursor: "pointer",
            pointerEvents: "all",
          }}
          title="Close"
          onClick={() => onClose && onClose()}
          tabIndex={0}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <style>
        {`@keyframes toastFadeIn { from { opacity: 0; bottom: 10px; } to { opacity: 1; bottom: 36px; } }`}
      </style>
    </div>
  );
}
