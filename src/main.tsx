import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initAnalytics } from "./lib/analytics";

// Initialize analytics before React renders
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);

// Unregister any existing service workers (fixes cached white screen)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}
