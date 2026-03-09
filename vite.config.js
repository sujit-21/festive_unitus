import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'dompurify': resolve('node_modules/dompurify')
    }
  },
  build: {
    rollupOptions: {
      external: ['dompurify']
    }
  }
})
