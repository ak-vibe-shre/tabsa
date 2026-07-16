import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite's dev-server SPA fallback always resolves unknown paths to the root
// index.html. Rewrite requests under /app/* or /order/* (client-side routes
// with no file extension) to that bundle's own index.html so deep links keep
// working — /app is the staff dashboard, /order is the public QR-order page.
function appRouterFallback() {
  return {
    name: 'app-router-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        for (const prefix of ['/app', '/order']) {
          if (url.startsWith(prefix) && !url.slice(url.lastIndexOf('/')).includes('.')) {
            req.url = `${prefix}/index.html`;
            break;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), appRouterFallback()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 127.0.0.1, not localhost — avoids IPv6 (::1) resolution failing to
        // connect since the backend only binds IPv4 0.0.0.0.
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
        order: fileURLToPath(new URL('./order/index.html', import.meta.url)),
      },
    },
  },
});
