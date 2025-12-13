<template>
  <div class="right-sidebar">
    <!-- 待审核卡片区域 -->
    <div v-if="hasPendingCards" class="pending-cards-section">
      <div class="section-header">
        <h3 class="section-title">{{ t('review.pendingCards.title') }}</h3>
        <span class="badge">{{ pendingCards.length }}</span>
      </div>
      <p class="pending-desc">{{ t('review.pendingCards.description') }}</p>
      
      <div class="section-actions">
        <AppButton 
          variant="success"
          size="sm"
          @click="acceptAllPendingCards"
          :disabled="isProcessing"
          :loading="isProcessing"
        >
          {{ t('review.pendingCards.acceptAll') }}
        </AppButton>
        <AppButton 
          variant="danger"
          size="sm"
          @click="rejectAllPendingCards"
          :disabled="isProcessing"
        >
          {{ t('review.pendingCards.rejectAll') }}
        </AppButton>
      </div>
      
      <div class="pending-cards-list">
        <div 
          v-for="card in pendingCards" 
          :key="card.id" 
          class="pending-card"
          :class="card.type"
        >
          <div class="pending-card-header">
            <span class="card-type-badge" :class="card.type">
              {{ t(`review.cardType.${card.type}`) }}
            </span>
            <span v-if="card.noteTitle" class="card-note">{{ card.noteTitle }}</span>
          </div>
          <p class="card-content">{{ truncate(card.content, 100) }}</p>
          <div class="pending-card-actions">
            <AppButton 
              variant="success"
              size="sm"
              @click="acceptPendingCard(card.id)"
              :disabled="isProcessing"
            >
              {{ t('review.pendingCards.accept') }}
            </AppButton>
            <AppButton 
              variant="secondary"
              size="sm"
              @click="rejectPendingCard(card.id)"
              :disabled="isProcessing"
            >
              {{ t('review.pendingCards.reject') }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无待审核卡片时显示的内容 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h3 class="empty-title">{{ t('review.pendingCards.empty') }}</h3>
      <p class="empty-desc">{{ t('review.pendingCards.emptyDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReviewStore } from '@renderer/stores/review';
import AppButton from '@renderer/components/common/AppButton.vue';

const { t } = useI18n();
const reviewStore = useReviewStore();

// 响应式数据
const pendingCards = computed(() => reviewStore.pendingCards);
const hasPendingCards = computed(() => reviewStore.hasPendingCards);
const isProcessing = ref(false);

// 接受单个待审核卡片
async function acceptPendingCard(cardId: string) {
  isProcessing.value = true;
  try {
    await reviewStore.acceptPendingCard(cardId);
  } finally {
    isProcessing.value = false;
  }
}

// 拒绝单个待审核卡片
function rejectPendingCard(cardId: string) {
  reviewStore.rejectPendingCard(cardId);
}

// 接受所有待审核卡片
async function acceptAllPendingCards() {
  isProcessing.value = true;
  try {
    const count = await reviewStore.acceptAllPendingCards();
    console.log(`Accepted ${count} pending cards`);
  } finally {
    isProcessing.value = false;
  }
}

// 拒绝所有待审核卡片
function rejectAllPendingCards() {
  reviewStore.rejectAllPendingCards();
}

// 截断文本
function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
</script>

<style scoped>
.right-sidebar {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

/* 待审核卡片区域 */
.pending-cards-section {
  background: var(--color-background-secondary);
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-warning);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.pending-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.section-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.section-actions :deep(.app-button) {
  flex: 1;
}

.pending-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.pending-card {
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border-left: 4px solid var(--color-border);
  transition: all 0.2s;
}

.pending-card:hover {
  box-shadow: var(--shadow-md);
}

.pending-card.added {
  border-left-color: var(--color-success);
}

.pending-card.modified {
  border-left-color: var(--color-warning);
}

.pending-card.deleted {
  border-left-color: var(--color-error);
}

.pending-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-type-badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.card-type-badge.added {
  background: rgba(var(--color-success-rgb), 0.15);
  color: var(--color-success);
}

.card-type-badge.modified {
  background: rgba(var(--color-warning-rgb), 0.15);
  color: var(--color-warning);
}

.card-type-badge.deleted {
  background: rgba(var(--color-error-rgb), 0.15);
  color: var(--color-error);
}

.card-note {
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  font-size: 13px;
  color: var(--color-text);
  margin: 0 0 10px 0;
  line-height: 1.5;
  word-break: break-word;
}

.pending-card-actions {
  display: flex;
  gap: 8px;
}

.pending-card-actions :deep(.app-button) {
  flex: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}
</style>
