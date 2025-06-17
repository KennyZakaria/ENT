import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'rxjs/webSocket': 'rxjs/dist/cjs/webSocket/index.js'
    }
  },
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8003',
        ws: true
      }
    }
  }
});