import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'src/pages/landing/landing.html'),
        login: resolve(__dirname, 'src/pages/login/login.html'),
        admin: resolve(__dirname, 'src/pages/admin/admin.html'),
        products: resolve(__dirname, 'src/pages/products/products.html'),
      },
    },
  },
  server: {
    open: '/src/pages/landing/landing.html',
  },
});
