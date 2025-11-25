import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 

  ],
  // 配置路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 配置@指向src目录
    }
  },
  base: '/',
  server: {
    proxy: {
      // 匹配以 /images 开头的请求
      '/images': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true, // 允许跨域（修改请求头的 Origin 为后端地址）
        // 可选：若后端路径与前端请求路径一致，无需 rewrite；若不一致则调整
        // rewrite: (path) => path.replace(/^\/images/, '/images') 
      },
    },
  },
})