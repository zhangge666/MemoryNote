<template>
  <div class="review-view">
    <!-- 加载状态 -->
    <div v-if="reviewStore.isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 无卡片状态 -->
    <div v-else-if="!reviewStore.hasCards && !reviewStore.isReviewing" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2>{{ t('review.noCards') }}</h2>
      <p>{{ t('review.noCardsDesc') }}</p>
      <button class="refresh-btn" @click="refreshCards">
        {{ t('common.refresh') }}
      </button>
    </div>

    <!-- 复习完成状态 -->
    <div v-else-if="reviewStore.isReviewing && !reviewStore.currentCard" class="completed-state">
      <div class="completed-icon">🎉</div>
      <h2>{{ t('review.completed') }}</h2>
      <p>{{ t('review.completedDesc', { count: reviewStore.currentIndex }) }}</p>
      <div class="completed-actions">
        <button class="primary-btn" @click="finishReview">
          {{ t('common.finish') }}
        </button>
      </div>
    </div>

    <!-- 复习卡片 -->
    <div v-else-if="reviewStore.currentCard" class="review-content">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${reviewStore.progress}%` }"></div>
      </div>
      <div class="progress-info">
        <span>{{ t('review.progress') }}: {{ reviewStore.currentIndex + 1 }}/{{ reviewStore.dueCards.length }}</span>
        <span>{{ t('review.remaining', { count: reviewStore.remainingCards }) }}</span>
      </div>

      <!-- 卡片 -->
      <div class="card" :class="cardTypeClass">
        <!-- 卡片头部 -->
        <div class="card-header">
          <span class="card-type" :class="reviewStore.currentCard.type">
            {{ t(`review.cardType.${reviewStore.currentCard.type}`) }}
          </span>
          <span v-if="reviewStore.currentCard.noteTitle" class="card-source">
            {{ t('review.fromNote', { title: reviewStore.currentCard.noteTitle }) }}
          </span>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <!-- 修改类型显示旧内容 -->
          <div v-if="reviewStore.currentCard.type === 'modified' && reviewStore.currentCard.oldContent" class="old-content">
            <div class="content-label">{{ t('common.previous') }}:</div>
            <pre class="content-text deleted">{{ reviewStore.currentCard.oldContent }}</pre>
          </div>

          <!-- 新内容/当前内容 -->
          <div class="new-content">
            <div v-if="reviewStore.currentCard.type === 'modified'" class="content-label">{{ t('common.next') }}:</div>
            <pre class="content-text" :class="{ added: reviewStore.currentCard.type === 'added', deleted: reviewStore.currentCard.type === 'deleted' }">{{ reviewStore.currentCard.content }}</pre>
          </div>
        </div>

        <!-- 卡片操作 -->
        <div class="card-actions">
          <button class="action-btn skip" @click="skipCard" :title="t('review.skipCard')">
            <span class="icon">⏭️</span>
            {{ t('review.skipCard') }}
          </button>
          <button class="action-btn delete" @click="deleteCard" :title="t('review.deleteCard')">
            <span class="icon">🗑️</span>
            {{ t('review.deleteCard') }}
          </button>
        </div>
      </div>

      <!-- 评分按钮 -->
      <div class="quality-buttons">
        <p class="quality-hint">{{ t('review.qualityHint') }}</p>
        <div class="quality-grid">
          <button
            v-for="quality in qualityOptions"
            :key="quality.value"
            class="quality-btn"
            :class="quality.class"
            @click="submitReview(quality.value)"
          >
            <span class="quality-value">{{ quality.value }}</span>
            <span class="quality-label">{{ t(`review.quality.${quality.value}`) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 开始复习按钮（未开始时） -->
    <div v-else class="start-review">
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ reviewStore.stats?.dueCards || 0 }}</span>
          <span class="stat-label">{{ t('review.dueCards') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ reviewStore.stats?.totalCards || 0 }}</span>
          <span class="stat-label">{{ t('review.totalCards') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ reviewStore.stats?.reviewedToday || 0 }}</span>
          <span class="stat-label">{{ t('review.reviewedToday') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ reviewStore.stats?.streakDays || 0 }}</span>
          <span class="stat-label">{{ t('review.stats.studyStreak') }}</span>
        </div>
      </div>
      <button class="start-btn" @click="startReview" :disabled="!reviewStore.hasCards">
        {{ t('review.startReview') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReviewStore } from '../stores/review';

const { t } = useI18n();
const reviewStore = useReviewStore();

// 评分选项
const qualityOptions = [
  { value: 0, class: 'fail' },
  { value: 1, class: 'fail' },
  { value: 2, class: 'fail' },
  { value: 3, class: 'pass' },
  { value: 4, class: 'good' },
  { value: 5, class: 'perfect' },
];

// 卡片类型样式
const cardTypeClass = computed(() => {
  if (!reviewStore.currentCard) return '';
  return `card-${reviewStore.currentCard.type}`;
});

// 加载数据
onMounted(async () => {
  await reviewStore.loadStats();
  await reviewStore.loadDueCards();
});

// 刷新卡片
async function refreshCards() {
  await reviewStore.loadDueCards();
  await reviewStore.loadStats();
}

// 开始复习
function startReview() {
  reviewStore.startReview();
}

// 结束复习
function finishReview() {
  reviewStore.endReview();
  refreshCards();
}

// 提交复习评分
async function submitReview(quality: number) {
  await reviewStore.submitReview(quality);
}

// 跳过卡片
async function skipCard() {
  await reviewStore.skipCurrentCard();
}

// 删除卡片
async function deleteCard() {
  await reviewStore.deleteCurrentCard();
}
</script>

<style scoped>
.review-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  background: var(--theme-background);
}

/* 加载状态 */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--theme-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--theme-border);
  border-top-color: var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state,
.completed-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.empty-icon,
.completed-icon {
  font-size: 64px;
  margin-bottom: 8px;
}

.empty-state h2,
.completed-state h2 {
  font-size: 24px;
  color: var(--theme-text);
  margin: 0;
}

.empty-state p,
.completed-state p {
  color: var(--theme-text-secondary);
  margin: 0;
}

.refresh-btn,
.primary-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.refresh-btn:hover,
.primary-btn:hover {
  background: var(--theme-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 进度条 */
.progress-bar {
  height: 4px;
  background: var(--theme-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--theme-primary);
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-bottom: 24px;
}

/* 卡片 */
.card {
  background: var(--theme-background-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--theme-border);
  box-shadow: var(--shadow-md);
}

.card.card-added {
  border-left: 4px solid var(--theme-success);
}

.card.card-modified {
  border-left: 4px solid var(--theme-warning);
}

.card.card-deleted {
  border-left: 4px solid var(--theme-error);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border);
}

.card-type {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.card-type.added {
  background: color-mix(in srgb, var(--theme-success) 10%, transparent);
  color: var(--theme-success);
}

.card-type.modified {
  background: color-mix(in srgb, var(--theme-warning) 10%, transparent);
  color: var(--theme-warning);
}

.card-type.deleted {
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
  color: var(--theme-error);
}

.card-source {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.card-content {
  margin-bottom: 16px;
}

.content-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
}

.content-text {
  font-family: var(--theme-font-mono);
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
  background: var(--theme-background);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: var(--theme-text);
  border: 1px solid var(--theme-border-light);
}

.content-text.added {
  background: color-mix(in srgb, var(--theme-success) 5%, transparent);
  border-left-color: var(--theme-success);
}

.content-text.deleted {
  background: color-mix(in srgb, var(--theme-error) 5%, transparent);
  border-left-color: var(--theme-error);
  text-decoration: line-through;
  opacity: 0.7;
}

.old-content {
  margin-bottom: 16px;
}

.card-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  color: var(--theme-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--theme-background-hover);
  border-color: var(--theme-text-secondary);
  color: var(--theme-text);
}

.action-btn.delete:hover {
  border-color: var(--theme-error);
  color: var(--theme-error);
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
}

/* 评分按钮 */
.quality-buttons {
  margin-top: 24px;
}

.quality-hint {
  text-align: center;
  color: var(--theme-text-secondary);
  margin-bottom: 16px;
  font-size: 14px;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  background: var(--theme-background-secondary);
  border: 2px solid var(--theme-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quality-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.quality-btn.fail {
  border-color: color-mix(in srgb, var(--theme-error) 30%, transparent);
}

.quality-btn.fail:hover {
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
  border-color: var(--theme-error);
}

.quality-btn.pass {
  border-color: color-mix(in srgb, var(--theme-warning) 30%, transparent);
}

.quality-btn.pass:hover {
  background: color-mix(in srgb, var(--theme-warning) 10%, transparent);
  border-color: var(--theme-warning);
}

.quality-btn.good {
  border-color: color-mix(in srgb, var(--theme-info) 30%, transparent);
}

.quality-btn.good:hover {
  background: color-mix(in srgb, var(--theme-info) 10%, transparent);
  border-color: var(--theme-info);
}

.quality-btn.perfect {
  border-color: color-mix(in srgb, var(--theme-success) 30%, transparent);
}

.quality-btn.perfect:hover {
  background: color-mix(in srgb, var(--theme-success) 10%, transparent);
  border-color: var(--theme-success);
}

.quality-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-text);
}

.quality-label {
  font-size: 11px;
  color: var(--theme-text-secondary);
  text-align: center;
  line-height: 1.3;
}

/* 开始复习 */
.start-review {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--theme-border);
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--theme-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

.start-btn {
  padding: 16px 48px;
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-md);
}

.start-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .quality-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
