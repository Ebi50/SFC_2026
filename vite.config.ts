import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: {
          "*": "localhost"
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Leite X-Forwarded-Proto Header weiter für Cookie-Secure-Flag
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            proxyReq.setHeader('X-Forwarded-Proto', protocol);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Stelle sicher, dass Cookies korrekt übertragen werden
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
                return cookie.replace(/Domain=.*?(;|$)/, 'Domain=localhost;')
                           .replace(/SameSite=None/, 'SameSite=Lax')
                           .replace(/Secure;/, '');
              });
            }
          });
        }
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
