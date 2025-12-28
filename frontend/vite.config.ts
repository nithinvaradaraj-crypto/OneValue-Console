import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore warnings about optional dependencies
        if (warning.code === 'UNRESOLVED_IMPORT' &&
            (warning.message.includes('canvg') || warning.message.includes('html2canvas'))) {
          return
        }
        warn(warning)
      },
    },
  },
})
