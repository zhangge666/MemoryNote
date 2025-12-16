<template>
  <div class="review-settings">
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.autoGenerateCards') }}</span>
        <span class="setting-description">{{ t('settings.review.autoGenerateCardsDesc') }}</span>
      </div>
      <BaseToggle v-model="autoGenerateCards" @update:model-value="saveAutoGenerate" />
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.algorithm') }}</span>
        <span class="setting-description">{{ t('settings.review.algorithmDesc') }}</span>
      </div>
      <BaseSelect
        :model-value="algorithmStore.currentReviewAlgorithmId"
        @update:model-value="changeReviewAlgorithmValue"
      >
        <option 
          v-for="algo in algorithmStore.reviewAlgorithms" 
          :key="algo.id" 
          :value="algo.id"
        >
          {{ algo.name }}
          <template v-if="!algo.isBuiltin"> (插件)</template>
        </option>
      </BaseSelect>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.diffAlgorithm') }}</span>
        <span class="setting-description">{{ t('settings.review.diffAlgorithmDesc') }}</span>
      </div>
      <BaseSelect
        :model-value="algorithmStore.currentDiffAlgorithmId"
        @update:model-value="changeDiffAlgorithmValue"
      >
        <option 
          v-for="algo in algorithmStore.diffAlgorithms" 
          :key="algo.id" 
          :value="algo.id"
        >
          {{ algo.name }}
          <template v-if="!algo.isBuiltin"> (插件)</template>
        </option>
      </BaseSelect>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.granularity') }}</span>
        <span class="setting-description">{{ t('settings.review.granularityDesc') }}</span>
      </div>
      <BaseSelect
        v-model="granularity"
        @update:model-value="saveGranularity"
      >
        <option value="paragraph">{{ t('settings.review.paragraph') }}</option>
        <option value="sentence">{{ t('settings.review.sentence') }}</option>
        <option value="word">{{ t('settings.review.word') }}</option>
      </BaseSelect>
    </div>
    
    <div class="setting-item">
      <div class="setting-label">
        <span>{{ t('settings.review.syncToCloud') }}</span>
        <span class="setting-description">{{ t('settings.review.syncToCloudDesc') }}</span>
      </div>
      <BaseToggle v-model="syncToCloud" @update:model-value="saveSyncToCloud" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlgorithmStore } from '@renderer/stores/algorithm'
import BaseToggle from '@renderer/components/common/BaseToggle.vue'
import BaseSelect from '@renderer/components/common/BaseSelect.vue'

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

// 保存自动生成卡片配置
async function saveAutoGenerate(value: boolean) {
  try {
    const config = await window.ipc.config.get('review') || {}
    config.autoGenerateCards = value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
    autoGenerateCards.value = !value
  }
}

// 更改复习算法
async function changeReviewAlgorithmValue(value: string | number) {
  await algorithmStore.setReviewAlgorithm(value as string)
}

// 更改 Diff 算法
async function changeDiffAlgorithmValue(value: string | number) {
  await algorithmStore.setDiffAlgorithm(value as string)
}

// 保存粒度配置
async function saveGranularity(value: string | number) {
  try {
    const config = await window.ipc.config.get('review') || {}
    config.granularity = value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
  }
}

// 保存云同步配置
async function saveSyncToCloud(value: boolean) {
  try {
    const config = await window.ipc.config.get('review') || {}
    config.syncToCloud = value
    await window.ipc.config.set('review', config)
  } catch (error) {
    console.error('Failed to save review config:', error)
    syncToCloud.value = !value
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


</style>
