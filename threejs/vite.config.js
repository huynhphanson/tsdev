import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/viewer': 'http://localhost:8080',
    }
  }
});
