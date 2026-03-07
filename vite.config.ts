import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/", // ensures dynamic imports resolve correctly
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // ❌ Removed Cartographer – not needed outside Replit
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    assetsDir: "assets", // dynamic chunks (ocr-*.js, wasm) go here
    rollupOptions: {
      output: {
        // ✅ keeps wasm + worker chunks grouped properly
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: ({ name }) => {
          if (/\.(wasm)$/.test(name ?? "")) return "assets/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  server: {
    port: 5173, // Frontend dev server port (different from backend 5000)
    fs: {
      strict: true,
      deny: ["**/\\.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
