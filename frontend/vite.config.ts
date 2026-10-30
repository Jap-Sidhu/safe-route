import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    // Send API calls to the Flask backend during development
    proxy: { '/api': 'http://127.0.0.1:5050' },
  },
})
