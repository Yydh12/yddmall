// src/main.js
import { createApp } from 'vue';
// 修正大小写敏感的文件导入路径
import App from './app.vue';
import router from './router/router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 全局错误处理器，过滤Google翻译相关的网络错误
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const source = event.filename || '';
  
  // 过滤Google翻译相关的错误
  if (source.includes('translate.googleapis.com') || 
      source.includes('translate.google.com') ||
      message.includes('translate.googleapis.com') ||
      message.includes('translate.google.com')) {
    event.preventDefault();
    return false;
  }
});

// 过滤未处理的Promise拒绝（网络超时错误）
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason || {};
  const message = reason.message || reason.toString();
  
  if (message.includes('translate.googleapis.com') || 
      message.includes('translate.google.com') ||
      message.includes('ERR_CONNECTION_TIMED_OUT')) {
    event.preventDefault();
    return false;
  } else {
    console.error('Unhandled Promise Rejection:', event.reason); // Log the full reason
  }
});

const app = createApp(App);

app.use(router);
app.use(ElementPlus);

app.mount('#app');