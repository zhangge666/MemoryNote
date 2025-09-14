<template>
  <div class="plugin-page">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">加载插件页面...</span>
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="text-red-500 text-2xl mb-2">⚠️</div>
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button 
          @click="$router.go(-1)"
          class="mt-4 btn btn-primary"
        >
          返回
        </button>
      </div>
    </div>
    
    <div v-else-if="pageComponent" class="plugin-page-content">
      <component 
        :is="pageComponent" 
        :api="pluginAPI"
        :config="pageConfig"
        v-bind="componentProps"
      />
    </div>
    
    <div v-else class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="text-gray-400 text-2xl mb-2">📄</div>
        <p class="text-gray-600 dark:text-gray-400">页面未找到</p>
        <button 
          @click="$router.push('/')"
          class="mt-4 btn btn-primary"
        >
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePluginsStore } from '../stores/plugins';
import type { PluginPageConfig } from '../plugins/types';

const route = useRoute();
const router = useRouter();
const pluginsStore = usePluginsStore();

const loading = ref(true);
const error = ref<string | null>(null);
const pageComponent = ref<any>(null);
const pageConfig = ref<PluginPageConfig | null>(null);
const pluginAPI = ref<any>(null);
const componentProps = ref<Record<string, any>>({});

const pageId = computed(() => route.params.pageId as string);

async function loadPluginPage() {
  loading.value = true;
  error.value = null;
  pageComponent.value = null;
  pageConfig.value = null;
  
  try {
    if (!pageId.value) {
      throw new Error('缺少页面ID');
    }
    
    // 使用新的等待机制等待插件管理器就绪
    console.log('⏳ 等待插件管理器就绪...');
    const isReady = await pluginsStore.waitForManagerReady(10000); // 10秒超时
    
    if (!isReady) {
      throw new Error('插件管理器未能在指定时间内就绪');
    }
    
    const pluginManager = pluginsStore.pluginManager;
    if (!pluginManager) {
      throw new Error('插件管理器获取失败');
    }
    
    console.log('✅ 插件管理器已就绪');
    
    const pageData = pluginManager.getPluginPage(pageId.value);
    if (!pageData) {
      const allPages = pluginManager.getRegisteredPages();
      const availablePages = allPages.map(p => p.id).join(', ');
      throw new Error(`页面 "${pageId.value}" 未找到，可用页面: ${availablePages}`);
    }
    
    pageConfig.value = pageData.config;
    pageComponent.value = markRaw(pageData.component);
    
    // 从页面ID中提取插件ID（页面ID格式：pluginId-pageId）
    const pageIdParts = pageId.value.split('-');
    const pluginId = pageIdParts.slice(0, -1).join('-'); // 支持插件ID包含连字符的情况
    
    console.log('🔍 提取插件ID:', pluginId, '从页面ID:', pageId.value);
    
    const plugin = pluginsStore.getPlugin(pluginId);
    
    if (plugin) {
      console.log('✅ 找到插件实例:', plugin.manifest.name);
      
      // 获取插件API实例
      if (plugin.api) {
        pluginAPI.value = plugin.api;
        console.log('✅ 获取到插件API');
      } else {
        console.warn('⚠️ 插件API不存在，插件可能未启用');
        // 创建一个基本的API对象避免null错误
        pluginAPI.value = {
          workspace: {
            showNotification: (message: string) => console.log('通知:', message)
          }
        };
      }
      
      // 如果插件有自定义的页面props
      if (typeof plugin.plugin.getPageProps === 'function') {
        try {
          componentProps.value = plugin.plugin.getPageProps(pageData.config.id) || {};
        } catch (error) {
          console.warn('获取页面props失败:', error);
          componentProps.value = {};
        }
      }
    } else {
      console.warn('⚠️ 未找到插件:', pluginId);
      // 创建一个基本的API对象避免null错误
      pluginAPI.value = {
        workspace: {
          showNotification: (message: string) => console.log('通知:', message)
        }
      };
    }
    
    console.log('✅ 插件页面加载成功:', pageConfig.value.title);
    
  } catch (err) {
    console.error('插件页面加载失败:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
  } finally {
    loading.value = false;
  }
}

// 监听路由变化
watch(() => pageId.value, () => {
  if (pageId.value) {
    loadPluginPage();
  }
}, { immediate: true });

onMounted(() => {
  if (pageId.value) {
    loadPluginPage();
  }
});
</script>

<style scoped>
.plugin-page {
  @apply h-full overflow-auto;
}

.plugin-page-content {
  @apply h-full;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}
</style>
