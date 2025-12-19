<template>
  <Transition name="notification-slide">
    <div
      v-if="visible"
      :class="['notification-item', `notification-${notification.type}`]"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- 图标 -->
      <div class="notification-icon">
        <svg
          v-if="notification.type === 'info'"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg
          v-else-if="notification.type === 'success'"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg
          v-else-if="notification.type === 'warning'"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <svg
          v-else-if="notification.type === 'error'"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- 内容 -->
      <div class="notification-content">
        <div v-if="notification.title" class="notification-title">
          {{ notification.title }}
        </div>
        <div class="notification-message">
          {{ notification.message }}
        </div>

        <!-- 动作按钮 -->
        <div v-if="notification.actions && notification.actions.length > 0" class="notification-actions">
          <button
            v-for="(action, index) in notification.actions"
            :key="index"
            :class="['action-button', { primary: action.primary }]"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button
        v-if="notification.closable !== false"
        class="notification-close"
        @click="handleClose"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- 进度条 -->
      <div v-if="showProgress" class="notification-progress">
        <div class="notification-progress-bar" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { Notification, NotificationAction } from '@shared/types/notification';

const props = defineProps<{
  notification: Notification;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(true);
const progress = ref(100);
const isPaused = ref(false);
let progressInterval: number | null = null;
let closeTimeout: number | null = null;

const showProgress = computed(() => {
  return props.notification.duration && props.notification.duration > 0;
});

/**
 * 处理鼠标进入
 */
function handleMouseEnter() {
  isPaused.value = true;
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
}

/**
 * 处理鼠标离开
 */
function handleMouseLeave() {
  isPaused.value = false;
  startProgress();
}

/**
 * 启动进度条
 */
function startProgress() {
  if (!props.notification.duration || props.notification.duration === 0) return;

  const startTime = Date.now();
  const duration = props.notification.duration;

  progressInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    progress.value = (remaining / duration) * 100;

    if (remaining === 0) {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
  }, 50);

  closeTimeout = window.setTimeout(() => {
    handleClose();
  }, duration);
}

/**
 * 处理关闭
 */
function handleClose() {
  visible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300); // 等待动画完成
}

/**
 * 处理动作
 */
function handleAction(action: NotificationAction) {
  action.handler();
  handleClose();
}

onMounted(() => {
  startProgress();
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }
});
</script>

<style scoped>
.notification-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--theme-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--theme-border);
  min-width: 320px;
  max-width: 420px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.notification-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-info .notification-icon {
  background: color-mix(in srgb, var(--theme-info) 10%, transparent);
  color: var(--theme-info);
}

.notification-success .notification-icon {
  background: color-mix(in srgb, var(--theme-success) 10%, transparent);
  color: var(--theme-success);
}

.notification-warning .notification-icon {
  background: color-mix(in srgb, var(--theme-warning) 10%, transparent);
  color: var(--theme-warning);
}

.notification-error .notification-icon {
  background: color-mix(in srgb, var(--theme-error) 10%, transparent);
  color: var(--theme-error);
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--theme-text);
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: var(--theme-text-secondary);
  line-height: 1.5;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-button {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid var(--theme-border);
  background: var(--theme-background-secondary);
  color: var(--theme-text);
}

.action-button:hover {
  background: var(--theme-background-hover);
}

.action-button.primary {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

.action-button.primary:hover {
  background: var(--theme-primary-hover);
}

.notification-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--theme-text-secondary);
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
}

.notification-close:hover {
  background: var(--theme-background-tertiary);
  color: var(--theme-text);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: color-mix(in srgb, var(--theme-text) 5%, transparent);
}

.notification-progress-bar {
  height: 100%;
  transition: width 0.05s linear;
  border-radius: 0 0 12px 12px;
}

.notification-info .notification-progress-bar {
  background: var(--theme-info);
}

.notification-success .notification-progress-bar {
  background: var(--theme-success);
}

.notification-warning .notification-progress-bar {
  background: var(--theme-warning);
}

.notification-error .notification-progress-bar {
  background: var(--theme-error);
}

/* 过渡动画 */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
  margin-top: -80px;
}
</style>


