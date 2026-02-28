import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(26, 26, 37, 0.95)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            backdropFilter: "blur(20px)",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: {
            iconTheme: { primary: "#a855f7", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#fff" },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
