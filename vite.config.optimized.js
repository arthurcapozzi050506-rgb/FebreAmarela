import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Compressão Brotli e Gzip automática
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    // Otimizações de build
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Code splitting automático
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'gsap': ['gsap'],
          'three': ['three'],
        },
      },
    },
    // Gera manifest para cache busting
    manifest: true,
    // Otimiza CSS
    cssCodeSplit: true,
    // Remove console.log em produção
    sourcemap: false,
  },
  // Preload de assets críticos
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
