import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n } from './locales';
import './index.css';

// 创建Vue应用实例
const app = createApp(App);

// 使用Pinia状态管理
app.use(createPinia());

// 使用Vue Router
app.use(router);

// 使用国际化
app.use(i18n);

// 挂载应用
app.mount('#app');

console.log('🚀 MemoryNote应用已启动');
