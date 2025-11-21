import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
        login: resolve(__dirname, 'login.html'),
        products: resolve(__dirname, 'products.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
