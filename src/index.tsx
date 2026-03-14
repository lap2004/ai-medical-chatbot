import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./i18n";

const root = document.getElementById("root");
if (!root) throw new Error("Root not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        richColors
        position="top-right"
        closeButton
        toastOptions={{
          classNames: {
            closeButton: '!left-auto !right-2 !top-1/2 !-translate-y-1/2 !translate-x-0',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
