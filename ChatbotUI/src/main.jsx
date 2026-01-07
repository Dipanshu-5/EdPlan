import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="bottom-left"
      toastOptions={{
        duration: 3500,
        style: {
          fontSize: "16px",
          padding: "14px",
          width: "250px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        },
        error: {
          duration: 3500,
          style: {
            background: "#ff4d4f",
            color: "#fff",
            fontSize: "16px",
            padding: "14px",
            width: "250px",
          },
        },
      }}
    />
  </BrowserRouter>
);
