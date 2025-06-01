// utils/toastHelpers.ts
import toast from "react-hot-toast";

export const showSuccess = (msg: string) =>
  toast.success(msg, {
    style: {
      background: "#d1fae5",
      color: "#065f46",
      border: "1px solid #10b981",
      padding: "12px 16px",
      borderRadius: "0.5rem",
    },
  });

export const showError = (msg: string) =>
  toast.error(msg, {
    style: {
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #ef4444",
      padding: "12px 16px",
      borderRadius: "0.5rem",
    },
  });
