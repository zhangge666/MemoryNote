<template>
  <div class="review-sidebar">
    <!-- 日历组件 -->
    <ReviewCalendar ref="calendarRef" />

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats?.dueCards || 0 }}</span>
        <span class="stat-label">{{ t('review.dueCards') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats?.reviewedToday || 0 }}</span>
        <span class="stat-label">{{ t('review.reviewedToday') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats?.totalCards || 0 }}</span>
        <span class="stat-label">{{ t('review.totalCards') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats?.streakDays || 0 }}</span>
        <span class="stat-label">{{ t('review.stats.studyStreak') }}</span>
      </div>
    </div>

    <!-- 开始复习按钮 -->
    <AppButton
      variant="primary"
      size="lg"
      block
      :disabled="!hasCards && !isReviewing"
      @click="startReview"
    >
      {{ isReviewing ? t('review.continueReview') : t('review.startReview') }}
    </AppButton>

    <!-- 待审核卡片区域已移动到右侧边栏 -->

    <!-- 复习卡片列表预览 -->
    <div class="cards-section">
      <h3 class="section-title">{{ t('review.dueCards') }}</h3>
      
      <div v-if="isLoading" class="loading">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="dueCards.length === 0" class="empty">
        <div class="empty-icon">✅</div>
        <p>{{ t('review.noCards') }}</p>
      </div>

      <div v-else class="cards-list">
        <div
          v-for="card in dueCards.slice(0, 5)"
          :key="card.id"
          class="card-item"
          :class="card.type"
        >
          <span class="card-type-badge">{{ t(`review.cardType.${card.type}`) }}</span>
          <p class="card-content">{{ truncate(card.content, 60) }}</p>
          <span v-if="card.noteTitle" class="card-note">{{ card.noteTitle }}</span>
        </div>

        <div v-if="dueCards.length > 5" class="more-cards">
          {{ t('review.remaining', { count: dueCards.length - 5 }) }}
        </div>
      </div>
    </div>

    <!-- 学习统计 -->
    <div class="stats-section">
      <h3 class="section-title">{{ t('review.stats.title') }}</h3>
      <div class="stat-row">
        <span>{{ t('review.learnedCards') }}</span>
        <span class="stat-num">{{ stats?.learnedCards || 0 }}</span>
      </div>
      <div class="stat-row">
        <span>{{ t('review.newCards') }}</span>
        <span class="stat-num">{{ stats?.newCards || 0 }}</span>
      </div>
      <div class="stat-row">
        <span>{{ t('review.stats.averageQuality') }}</span>
        <span class="stat-num">{{ (stats?.averageQuality || 0).toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReviewStore } from '../../stores/review';
import { useTabStore } from '../../stores/tab';
import ReviewCalendar from './ReviewCalendar.vue';
import AppButton from '@renderer/components/common/AppButton.vue';

const { t } = useI18n();
const reviewStore = useReviewStore();
const tabStore = useTabStore();
const calendarRef = ref<InstanceType<typeof ReviewCalendar> | null>(null);

// 响应式数据
const stats = computed(() => reviewStore.stats);
const dueCards = computed(() => reviewStore.dueCards);
const isLoading = computed(() => reviewStore.isLoading);
const hasCards = computed(() => reviewStore.hasCards);
const isReviewing = computed(() => reviewStore.isReviewing);

// 监听配置变化
onMounted(async () => {
  await reviewStore.loadStats();
  await reviewStore.loadDueCards();
});

// 开始复习
function startReview() {
  // 检查是否已有复习标签页打开
  const existingTab = tabStore.allTabs.find(tab => tab.type === 'review');
  
  if (existingTab) {
    // 如果已有复习标签页，激活它
    tabStore.activateTab(existingTab.id);
  } else {
    // 打开新的复习标签页
    tabStore.openTab({
      title: t('review.title'),
      type: 'review',
      icon: '📚',
    });
  }
  
  // 开始复习会话
  reviewStore.startReview();
}

// 截断文本
function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// 暴露刷新方法
defineExpose({
  refresh: async () => {
    await reviewStore.loadStats();
    await reviewStore.loadDueCards();
    calendarRef.value?.refresh();
  },
});
</script>

<style scoped>
.review-sidebar {
  padding: 10px;
  height: 100%;
  overflow-y: auto;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--theme-border);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--theme-text-secondary);
  margin-top: 2px;
  text-align: center;
}

/* 开始按钮已用 AppButton 组件替代 */
:deep(.app-button--lg) {
  margin-bottom: 20px;
}

/* 卡片区域 */
.cards-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--theme-border);
}

.loading,
.empty {
  text-align: center;
  padding: 24px 0;
  color: var(--theme-text-secondary);
  font-size: 13px;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* 卡片列表 */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-item {
  padding: 10px 12px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--theme-border);
}

.card-item.added {
  border-left-color: var(--theme-success);
}

.card-item.modified {
  border-left-color: var(--theme-warning);
}

.card-item.deleted {
  border-left-color: var(--theme-error);
}

.card-type-badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--theme-background);
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.card-content {
  font-size: 12px;
  color: var(--theme-text);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.card-note {
  display: block;
  font-size: 10px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

.more-cards {
  text-align: center;
  font-size: 12px;
  color: var(--theme-text-secondary);
  padding: 8px;
}

/* 手动 Diff 分析区域 */
.manual-diff-section {
  margin-bottom: 20px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.manual-diff-desc {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.analyze-btn {
  width: 100%;
  padding: 8px;
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.analyze-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.diff-results h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0 0 8px 0;
}

.diff-changes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-change {
  padding: 10px;
  background: var(--theme-background);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--theme-border);
}

.diff-change.add {
  border-left-color: var(--theme-success);
}

.diff-change.modify {
  border-left-color: var(--theme-warning);
}

.diff-change.delete {
  border-left-color: var(--theme-error);
}

.change-type {
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--theme-background-secondary);
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.change-content {
  font-size: 12px;
  color: var(--theme-text);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.change-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.accept {
  background: var(--theme-success);
  color: var(--theme-text-inverse);
}

.action-btn.reject {
  background: var(--theme-error);
  color: var(--theme-text-inverse);
}

.action-btn:hover {
  opacity: 0.9;
}

.no-changes {
  text-align: center;
  font-size: 12px;
  color: var(--theme-text-secondary);
  padding: 16px 0;
}

/* 待审核卡片区域 */
.pending-cards-section {
  margin-bottom: 20px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
  border: 1px solid var(--theme-warning);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header .section-title {
  margin: 0;
  padding: 0;
  border: none;
}

.section-actions {
  display: flex;
  gap: 6px;
}

.action-btn-small {
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-small.accept {
  background: var(--theme-success);
  color: var(--theme-text-inverse);
}

.action-btn-small.reject {
  background: var(--theme-error);
  color: var(--theme-text-inverse);
}

.action-btn-small:hover:not(:disabled) {
  opacity: 0.9;
}

.action-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pending-desc {
  font-size: 11px;
  color: var(--theme-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.pending-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.pending-card {
  padding: 10px;
  background: var(--theme-background);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--theme-border);
}

.pending-card.added {
  border-left-color: var(--theme-success);
}

.pending-card.modified {
  border-left-color: var(--theme-warning);
}

.pending-card.deleted {
  border-left-color: var(--theme-error);
}

.pending-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.pending-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* 统计区域 */
.stats-section {
  background: var(--theme-background-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  border-bottom: 1px solid var(--theme-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-num {
  font-weight: 600;
  color: var(--theme-text);
}
</style>
