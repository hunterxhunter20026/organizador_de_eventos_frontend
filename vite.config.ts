import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],   // deja lo que ya tengas aquí
  server: {
  proxy: {
    '/demo-ds-univalle': {
      target: 'http://localhost:8085',
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.removeHeader('origin');
        });
      },
    },
  },
},
})