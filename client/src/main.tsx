import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Custom CSS for Instagram styling
document.documentElement.style.setProperty('--primary', '207 90% 54%');
document.documentElement.style.setProperty('--primary-foreground', '211 100% 99%');
document.documentElement.style.setProperty('--instagram-red', '355 100% 63%');
document.documentElement.style.setProperty('--instagram-gradient-pink', '333 100% 52%');
document.documentElement.style.setProperty('--instagram-gradient-purple', '262 100% 40%');
document.documentElement.style.setProperty('--instagram-bg', '0 0% 98%');
document.documentElement.style.setProperty('--instagram-border', '0 0% 86%');
document.documentElement.style.setProperty('--instagram-text', '0 0% 15%');
document.documentElement.style.setProperty('--instagram-text-secondary', '0 0% 56%');

createRoot(document.getElementById("root")!).render(<App />);
