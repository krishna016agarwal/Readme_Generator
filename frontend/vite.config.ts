import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    proxy: {
      '/api': { // When the frontend requests '/api/*'
        target: 'http://localhost:5000', // Proxy it to your backend
        changeOrigin: true,
        secure: false, // Set to true for HTTPS backends
      }
    },
    port: 5173,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
