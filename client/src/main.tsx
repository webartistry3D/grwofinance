import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ToastProvider } from "@/components/ui/use-toast"; // ✅ wrap app with provider

// ✅ Ensure dark mode applies globally on load
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);


/*import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
//import { registerSW } from 'virtual:pwa-register';

/*const updateSW = registerSW({
  onNeedRefresh() {},
  onOfflineReady() {}
});/

// Set dark mode immediately on app load
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
*/