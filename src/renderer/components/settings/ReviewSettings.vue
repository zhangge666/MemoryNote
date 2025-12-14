<template>
  <div class="review-settings">
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.autoGenerateCards') }}</span>
        <span class="setting-description">{{ t('settings.review.autoGenerateCardsDesc') }}</span>
      </div>
      <button
        class="toggle-button"
        :class="{ active: autoGenerateCards }"
        @click="toggleAutoGenerate"
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.algorithm') }}</span>
        <span class="setting-description">{{ t('settings.review.algorithmDesc') }}</span>
      </div>
      <select 
        class="setting-select" 
        :value="algorithmStore.currentReviewAlgorithmId"
        @change="changeReviewAlgorithm"
      >
        <option 
          v-for="algo in algorithmStore.reviewAlgorithms" 
          :key="algo.id" 
          :value="algo.id"
        >
          {{ algo.name }}
          <template v-if="!algo.isBuiltin"> (插件)</template>
        </option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.diffAlgorithm') }}</span>
        <span class="setting-description">{{ t('settings.review.diffAlgorithmDesc') }}</span>
      </div>
      <select 
        class="setting-select" 
        :value="algorithmStore.currentDiffAlgorithmId"
        @change="changeDiffAlgorithm"
      >
        <option 
          v-for="algo in algorithmStore.diffAlgorithms" 
          :key="algo.id" 
          :value="algo.id"
        >
          {{ algo.name }}
          <template v-if="!algo.isBuiltin"> (插件)</template>
        </option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.granularity') }}</span>
        <span class="setting-description">{{ t('settings.review.granularityDesc') }}</span>
      </div>
      <select 
        class="setting-select" 
        :value="granularity"
        @change="changeGranularity"
      >
        <option value="paragraph">{{ t('settings.review.paragraph') }}</option>
        <option value="sentence">{{ t('settings.review.sentence') }}</option>
        <option value="word">{{ t('settings.review.word') }}</option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.syncToCloud') }}</span>
        <span class="setting-description">{{ t('settings.review.syncToCloudDesc') }}</span>
      </div>
      <button
        class="toggle-button"
        :class="{ active: syncToCloud }"
        @click="toggleSyncToCloud"
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlgorithmStore } from '@renderer/stores/algorithm'

const { t } = useI18n()
const algorithmStore = useAlgorithmStore()

// 配置项
const autoGenerateCards = ref(true)
const granularity = ref('paragraph')
const syncToCloud = ref(false)

// 加载配置
onMounted(async () => {
  try {
    // 加载复习配置
    const config = await window.ipc.config.get('review')
    if (config) {
      autoGenerateCards.value = config.autoGenerateCards ?? true
      granularity.value = config.granularity ?? 'paragraph'
      syncToCloud.value = config.syncToCloud ?? false
    }
    
    // 加载可用算法（使用 store）
    await algorithmStore.initialize()
  } catch (error) {
    console.error('Failed to load review config:', error)
  }
})

// 切换自动生成卡片
async function toggleAutoGenerate() {
  autoGenerateCards.value = !autoGenerateCards.value
  try {
    const config = await window.ipc.config.get('review') || {}
    config.autoGenerateCards = autoGenerateCards.value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
    autoGenerateCards.value = !autoGenerateCards.value
  }
}

// 更改复习算法
async function changeReviewAlgorithm(event: Event) {
  const target = event.target as HTMLSelectElement
  const newAlgorithmId = target.value
  await algorithmStore.setReviewAlgorithm(newAlgorithmId)
}

// 更改 Diff 算法
async function changeDiffAlgorithm(event: Event) {
  const target = event.target as HTMLSelectElement
  const newAlgorithmId = target.value
  await algorithmStore.setDiffAlgorithm(newAlgorithmId)
}

// 更改粒度
async function changeGranularity(event: Event) {
  const target = event.target as HTMLSelectElement
  granularity.value = target.value as any
  try {
    const config = await window.ipc.config.get('review') || {}
    config.granularity = granularity.value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
  }
}

// 切换云同步
async function toggleSyncToCloud() {
  syncToCloud.value = !syncToCloud.value
  try {
    const config = await window.ipc.config.get('review') || {}
    config.syncToCloud = syncToCloud.value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
    syncToCloud.value = !syncToCloud.value
  }
}
</script>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label > span:first-child {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.setting-description {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.toggle-button {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-border);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-button:hover {
  background: var(--color-border-active);
}

.toggle-button.active {
  background: var(--color-primary);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.toggle-button.active .toggle-slider {
  transform: translateX(20px);
}

.setting-select {
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  min-width: 150px;
}

.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
