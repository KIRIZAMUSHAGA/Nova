import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[main] Starting application mounting...");

const rootElement = document.getElementById("root");

if (rootElement) {
  console.log("[main] Root element found, mounting React...");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[SW] Registered', reg))
        .catch(err => console.log('[SW] Registration failed', err));
    });
  }
} else {
  console.error("[main] Critical Error: Root element '#root' not found.");
  // Emergency fallback if root is missing
  document.body.innerHTML = '<div style="color:white; background:black; padding:20px; font-family:sans-serif;"><h1>Erreur de Chargement</h1><p>L\'élément racine (#root) est manquant. Veuillez rafraîchir la page.</p></div>';
}
