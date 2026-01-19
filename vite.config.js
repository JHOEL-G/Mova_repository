import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";


export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api-negocio": {
        target: "https://api.acreditamv.financialsoft.site",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-negocio/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.referencia) {
              proxyReq.setHeader("referencia", req.headers.referencia);
            }
          });
        },
      },
      "/api-servicios": {
        target: "https://servicios.apifs.xyz",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-servicios/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
