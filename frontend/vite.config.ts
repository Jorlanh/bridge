import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { firebaseServiceWorkerPlugin } from "./vite-plugin-firebase-sw";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    firebaseServiceWorkerPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
