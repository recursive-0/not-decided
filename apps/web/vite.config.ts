import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: [
      'remark-gfm', // vite had some issues with optimizing deps hence included this
    ],
  },
  resolve: {
    alias: {
      "@" : path.resolve(__dirname, "./src")
    }
  }
})
