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
import { ref, computed, onMounted, watch } from 'vue';
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
    
    const pluginManager = pluginsStore.pluginManager;
    if (!pluginManager) {
      throw new Error('插件管理器未初始化');
    }
    
    const pageData = pluginManager.getPluginPage(pageId.value);
    if (!pageData) {
      throw new Error(`页面 "${pageId.value}" 未找到`);
    }
    
    pageConfig.value = pageData.config;
    pageComponent.value = pageData.component;
    
    // 获取插件ID（从页面ID中提取）
    const pluginId = pageId.value.split('-')[0];
    const plugin = pluginsStore.getPlugin(pluginId);
    
    if (plugin?.instance) {
      // 创建插件API实例
      pluginAPI.value = plugin.instance.api;
      
      // 如果插件有自定义的页面props
      if (typeof plugin.instance.getPageProps === 'function') {
        componentProps.value = plugin.instance.getPageProps(pageData.config.id) || {};
      }
    }
    
    console.log('✅ 插件页面加载成功:', pageConfig.value.title);
    
  } catch (err) {
    console.error('❌ 插件页面加载失败:', err);
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
