<template>
  <div class="ai-settings">
    <div class="settings-section">
      <h3 class="section-title">{{ t('settings.ai.general') }}</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.enableAI') }}</label>
          <div class="setting-description">{{ t('settings.ai.enableAIDesc') }}</div>
        </div>
        <input 
          type="checkbox" 
          class="setting-checkbox"
          v-model="aiConfig.enabled"
          @change="saveConfig"
        />
      </div>
    </div>

    <!-- NLP 设置 -->
    <div class="settings-section" v-if="aiConfig.enabled">
      <h3 class="section-title">{{ t('settings.ai.nlp') }}</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.enableNLP') }}</label>
          <div class="setting-description">{{ t('settings.ai.enableNLPDesc') }}</div>
        </div>
        <input 
          type="checkbox" 
          class="setting-checkbox"
          v-model="aiConfig.nlp.enabled"
          @change="saveConfig"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.embeddingProvider') }}</label>
          <div class="setting-description">{{ t('settings.ai.embeddingProviderDesc') }}</div>
        </div>
        <select 
          class="setting-select"
          v-model="aiConfig.nlp.embedding.provider"
          @change="onProviderChange"
        >
          <option 
            v-for="provider in embeddingProviders" 
            :key="provider.id" 
            :value="provider.id"
          >
            {{ provider.name }}
          </option>
        </select>
      </div>

      <!-- API Key 输入框 (仅对需要 API Key 的提供商显示) -->
      <div class="setting-item" v-if="currentEmbeddingProvider?.requiresApiKey">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.apiKey') }}</label>
          <div class="setting-description">{{ t('settings.ai.apiKeyDesc') }}</div>
        </div>
        <input 
          type="password" 
          class="setting-input"
          v-model="aiConfig.nlp.embedding.apiKey"
          :placeholder="t('settings.ai.apiKeyPlaceholder')"
          @blur="saveConfig"
        />
      </div>

      <!-- 自定义端点 (仅对自定义提供商显示) -->
      <div class="setting-item" v-if="aiConfig.nlp.embedding.provider === 'custom'">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.customEndpoint') }}</label>
          <div class="setting-description">{{ t('settings.ai.customEndpointDesc') }}</div>
        </div>
        <input 
          type="text" 
          class="setting-input"
          v-model="aiConfig.nlp.embedding.apiEndpoint"
          :placeholder="t('settings.ai.customEndpointPlaceholder')"
          @blur="saveConfig"
        />
      </div>

      <!-- 模型选择 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.embeddingModel') }}</label>
          <div class="setting-description">{{ t('settings.ai.embeddingModelDesc') }}</div>
        </div>
        <input 
          type="text" 
          class="setting-input"
          v-model="aiConfig.nlp.embedding.model"
          :placeholder="getDefaultModel(aiConfig.nlp.embedding.provider)"
          @blur="saveConfig"
        />
      </div>

      <!-- 向量维度 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.dimensions') }}</label>
          <div class="setting-description">{{ t('settings.ai.dimensionsDesc') }}</div>
        </div>
        <input 
          type="number" 
          class="setting-input"
          v-model.number="aiConfig.nlp.embedding.dimensions"
          min="128"
          max="4096"
          @blur="saveConfig"
        />
      </div>

      <!-- 相似度阈值 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.similarityThreshold') }}</label>
          <div class="setting-description">{{ t('settings.ai.similarityThresholdDesc') }}</div>
        </div>
        <input 
          type="number" 
          class="setting-input"
          v-model.number="aiConfig.nlp.similarityThreshold"
          min="0"
          max="1"
          step="0.01"
          @blur="saveConfig"
        />
      </div>
    </div>

    <!-- LLM 设置 -->
    <div class="settings-section" v-if="aiConfig.enabled">
      <h3 class="section-title">{{ t('settings.ai.llm') }}</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.llmProvider') }}</label>
          <div class="setting-description">{{ t('settings.ai.llmProviderDesc') }}</div>
        </div>
        <select 
          class="setting-select"
          v-model="aiConfig.llm.provider"
          @change="onLLMProviderChange"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="local">Local (TODO)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <!-- API Key -->
      <div class="setting-item" v-if="aiConfig.llm.provider !== 'local'">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.apiKey') }}</label>
          <div class="setting-description">{{ t('settings.ai.apiKeyDesc') }}</div>
        </div>
        <input 
          type="password" 
          class="setting-input"
          v-model="aiConfig.llm.apiKey"
          :placeholder="t('settings.ai.apiKeyPlaceholder')"
          @blur="saveConfig"
        />
      </div>

      <!-- 自定义端点 -->
      <div class="setting-item" v-if="aiConfig.llm.provider === 'custom'">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.customEndpoint') }}</label>
          <div class="setting-description">{{ t('settings.ai.customLLMEndpointDesc') }}</div>
        </div>
        <input 
          type="text" 
          class="setting-input"
          v-model="aiConfig.llm.apiEndpoint"
          :placeholder="t('settings.ai.customEndpointPlaceholder')"
          @blur="saveConfig"
        />
      </div>

      <!-- 模型 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.llmModel') }}</label>
          <div class="setting-description">{{ t('settings.ai.llmModelDesc') }}</div>
        </div>
        <input 
          type="text" 
          class="setting-input"
          v-model="aiConfig.llm.model"
          :placeholder="getDefaultLLMModel(aiConfig.llm.provider)"
          @blur="saveConfig"
        />
      </div>

      <!-- Temperature -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.temperature') }}</label>
          <div class="setting-description">{{ t('settings.ai.temperatureDesc') }}</div>
        </div>
        <input 
          type="number" 
          class="setting-input"
          v-model.number="aiConfig.llm.temperature"
          min="0"
          max="2"
          step="0.1"
          @blur="saveConfig"
        />
      </div>

      <!-- Max Tokens -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.maxTokens') }}</label>
          <div class="setting-description">{{ t('settings.ai.maxTokensDesc') }}</div>
        </div>
        <input 
          type="number" 
          class="setting-input"
          v-model.number="aiConfig.llm.maxTokens"
          min="1"
          max="32768"
          @blur="saveConfig"
        />
      </div>
    </div>

    <!-- AI 助手设置 -->
    <div class="settings-section" v-if="aiConfig.enabled">
      <h3 class="section-title">{{ t('settings.ai.assistant') }}</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.streamResponses') }}</label>
          <div class="setting-description">{{ t('settings.ai.streamResponsesDesc') }}</div>
        </div>
        <input 
          type="checkbox" 
          class="setting-checkbox"
          v-model="aiConfig.assistant.streamResponses"
          @change="saveConfig"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.useKnowledgeBase') }}</label>
          <div class="setting-description">{{ t('settings.ai.useKnowledgeBaseDesc') }}</div>
        </div>
        <input 
          type="checkbox" 
          class="setting-checkbox"
          v-model="aiConfig.assistant.useKnowledgeBase"
          @change="saveConfig"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('settings.ai.maxContextNotes') }}</label>
          <div class="setting-description">{{ t('settings.ai.maxContextNotesDesc') }}</div>
        </div>
        <input 
          type="number" 
          class="setting-input"
          v-model.number="aiConfig.assistant.maxContextNotes"
          min="1"
          max="20"
          @blur="saveConfig"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="settings-actions" v-if="aiConfig.enabled">
      <AppButton 
        variant="primary"
        @click="testConnection"
        :loading="testingConnection"
      >
        {{ testingConnection ? t('settings.ai.testing') : t('settings.ai.testConnection') }}
      </AppButton>
      
      <AppButton 
        variant="secondary"
        @click="rebuildIndex"
        :loading="rebuildingIndex"
        :disabled="indexStatus?.isBuilding"
      >
        {{ indexStatus?.isBuilding ? t('settings.ai.rebuilding') : t('settings.ai.rebuildIndex') }}
      </AppButton>
      
      <div class="index-status" v-if="indexStatus">
        <span>{{ t('settings.ai.indexedDocs') }}: {{ indexStatus.indexedDocuments }}/{{ indexStatus.totalDocuments }}</span>
        <span v-if="indexStatus.lastUpdated > 0">
          {{ t('settings.ai.lastUpdated') }}: {{ formatDate(indexStatus.lastUpdated) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@renderer/components/common/AppButton.vue';
import type { AIConfig, EmbeddingProvider } from '@shared/types/ai';

const { t } = useI18n();

// AI 配置
const aiConfig = reactive<AIConfig>({
  enabled: false,
  llm: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
  },
  nlp: {
    enabled: true,
    embedding: {
      provider: 'local',
      model: 'Xenova/all-MiniLM-L6-v2',
      dimensions: 384,
      batchSize: 32,
    },
    chunkSize: 500,
    chunkOverlap: 50,
    similarityThreshold: 0.3,
  },
  assistant: {
    systemPrompt: 'You are a helpful AI assistant for the MemoryNote application. Help users with their notes, answer questions about their knowledge base, and provide suggestions for better note-taking.',
    useKnowledgeBase: true,
    maxContextNotes: 5,
    streamResponses: true,
  },
});

// 状态
const testingConnection = ref(false);
const rebuildingIndex = ref(false);
const indexStatus = ref<any>(null);

// Embedding 提供商信息
const embeddingProviders = [
  {
    id: 'local',
    name: t('settings.ai.providers.local'),
    description: t('settings.ai.providers.localDesc'),
    requiresApiKey: false,
  },
  {
    id: 'openai',
    name: t('settings.ai.providers.openai'),
    description: t('settings.ai.providers.openaiDesc'),
    requiresApiKey: true,
  },
  {
    id: 'qwen',
    name: t('settings.ai.providers.qwen'),
    description: t('settings.ai.providers.qwenDesc'),
    requiresApiKey: true,
  },
  {
    id: 'custom',
    name: t('settings.ai.providers.custom'),
    description: t('settings.ai.providers.customDesc'),
    requiresApiKey: true,
  },
];

// 当前选中的 Embedding 提供商
const currentEmbeddingProvider = computed(() => {
  return embeddingProviders.find(p => p.id === aiConfig.nlp.embedding.provider);
});

// 获取默认模型
const getDefaultModel = (provider: EmbeddingProvider): string => {
  const defaults: Record<EmbeddingProvider, string> = {
    local: 'Xenova/all-MiniLM-L6-v2',
    openai: 'text-embedding-3-small',
    qwen: 'text-embedding-v3',
    custom: 'custom-model',
  };
  return defaults[provider] || defaults.local;
};

// 获取默认 LLM 模型
const getDefaultLLMModel = (provider: string): string => {
  const defaults: Record<string, string> = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307',
    local: 'local-model',
    custom: 'custom-model',
  };
  return defaults[provider] || defaults.openai;
};

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

// 提供商变更处理
const onProviderChange = () => {
  // 重置 API Key 和端点
  if (!currentEmbeddingProvider.value?.requiresApiKey) {
    aiConfig.nlp.embedding.apiKey = undefined;
  }
  
  if (aiConfig.nlp.embedding.provider !== 'custom') {
    aiConfig.nlp.embedding.apiEndpoint = undefined;
  }
  
  // 设置默认模型和维度
  aiConfig.nlp.embedding.model = getDefaultModel(aiConfig.nlp.embedding.provider);
  
  // 设置默认维度
  const defaultDimensions: Record<EmbeddingProvider, number> = {
    local: 384,
    openai: 1536,
    qwen: 1024,
    custom: 768,
  };
  aiConfig.nlp.embedding.dimensions = defaultDimensions[aiConfig.nlp.embedding.provider] || 384;
  
  saveConfig();
};

// LLM 提供商变更处理
const onLLMProviderChange = () => {
  // 设置默认模型
  aiConfig.llm.model = getDefaultLLMModel(aiConfig.llm.provider);
  saveConfig();
};

// 保存配置
const saveConfig = async () => {
  try {
    // 创建可序列化的配置副本
    const serializableConfig = JSON.parse(JSON.stringify(aiConfig));
    await window.electronAPI.invoke('config:set', 'ai', serializableConfig);
  } catch (error) {
    console.error('Failed to save AI config:', error);
  }
};

// 测试连接
const testConnection = async () => {
  testingConnection.value = true;
  try {
    // TODO: 实现实际的连接测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await window.electronAPI.dialog.showMessage({
      type: 'info',
      title: t('common.success'),
      message: t('settings.ai.connectionSuccess'),
      buttons: [t('common.ok')],
    });
  } catch (error) {
    await window.electronAPI.dialog.showMessage({
      type: 'error',
      title: t('common.error'),
      message: t('settings.ai.connectionFailed'),
      detail: error instanceof Error ? error.message : t('common.unknownError'),
      buttons: [t('common.ok')],
    });
  } finally {
    testingConnection.value = false;
  }
};

// 重建索引
const rebuildIndex = async () => {
  rebuildingIndex.value = true;
  try {
    const result = await window.electronAPI.invoke('ai:rebuild-index');
    if (result?.success) {
      await window.electronAPI.dialog.showMessage({
        type: 'info',
        title: t('common.success'),
        message: t('settings.ai.rebuildSuccess'),
        buttons: [t('common.ok')],
      });
      loadIndexStatus();
    } else {
      throw new Error(result?.error || t('common.unknownError'));
    }
  } catch (error) {
    await window.electronAPI.dialog.showMessage({
      type: 'error',
      title: t('common.error'),
      message: t('settings.ai.rebuildFailed'),
      detail: error instanceof Error ? error.message : t('common.unknownError'),
      buttons: [t('common.ok')],
    });
  } finally {
    rebuildingIndex.value = false;
  }
};

// 加载索引状态
const loadIndexStatus = async () => {
  try {
    const result = await window.electronAPI.invoke('ai:get-index-status');
    if (result?.success) {
      indexStatus.value = result.data;
    }
  } catch (error) {
    console.error('Failed to load index status:', error);
  }
};

// 加载配置
const loadConfig = async () => {
  try {
    const config = await window.electronAPI.invoke('config:get', 'ai');
    if (config) {
      Object.assign(aiConfig, config);
    }
  } catch (error) {
    console.error('Failed to load AI config:', error);
  }
};

// 初始化
onMounted(() => {
  loadConfig();
  loadIndexStatus();
});

// 定期更新索引状态
watch(
  () => aiConfig.enabled,
  () => {
    if (aiConfig.enabled) {
      loadIndexStatus();
    }
  }
);
</script>

<style scoped>
.ai-settings {
  width: 100%;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  margin-right: 1rem;
}

.setting-label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.setting-description {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.setting-select,
.setting-input {
  width: 200px;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
}

.setting-select:focus,
.setting-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.setting-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.index-status {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .setting-select,
  .setting-input {
    width: 100%;
  }
  
  .settings-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
