import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/DisplayAll': 'http://localhost:8083',
      '/Display': 'http://localhost:8083',
      '/Add': 'http://localhost:8083',
      '/Update': 'http://localhost:8083',
      '/Delete': 'http://localhost:8083',
    },
  },
})
