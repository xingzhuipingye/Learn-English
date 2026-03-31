import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages 项目页地址一般为：https://<user>.github.io/<仓库名>/
// CI 中设置 VITE_BASE=/Learn-English/；本地开发默认 /
// https://vite.dev/config/shared-options.html#base
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
})
