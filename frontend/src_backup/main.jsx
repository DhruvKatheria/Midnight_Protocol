import React from "react";
import ReactDom from "react-dom/client";
import App from "./App.jsx";
import { WalletProvider } from "./context/walletContext.jsx";

ReactDom.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);