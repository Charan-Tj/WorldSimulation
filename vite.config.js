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
        landing: resolve(__dirname, 'index.html'),
        simulation: resolve(__dirname, 'simulation.html'),
        login: resolve(__dirname, 'src/pages/login/login.html'),
        admin: resolve(__dirname, 'src/pages/admin/admin.html'),
        products: resolve(__dirname, 'src/pages/products/products.html'),
      },
    },
  },
  server: {
    open: '/',
  },
});
