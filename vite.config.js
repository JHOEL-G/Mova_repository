import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

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
            console.log("🚀 Proxy Request:", req.method, req.url);
            console.log("🚀 Headers enviados:", req.headers);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("✅ Proxy Response:", proxyRes.statusCode, req.url);
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
});
