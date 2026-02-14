import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/games/golf/**', 'src/games/checkers/**', 'src/games/archerfish/**', 'src/games/race/**', 'src/games/dots/**', 'src/games/battleplanes/**', 'src/components/**', 'src/hooks/**'],
      exclude: ['**/*.test.*', '**/test/**'],
    },
  },
})
