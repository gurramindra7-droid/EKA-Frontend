import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js + React Three Fiber live in the lazily-loaded intro chunk (~250 kB gzip);
    // they never load once the intro has been seen in a session.
    chunkSizeWarningLimit: 1000,
  },
})
