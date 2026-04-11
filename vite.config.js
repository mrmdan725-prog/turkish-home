import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('recharts')) {
            return 'vendor-charts';
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          if (id.includes('react-router-dom')) {
            return 'vendor-router';
          }

          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-barcode')) {
            return 'vendor-ui';
          }

          return 'vendor-core';
        },
      },
    },
  },
})
