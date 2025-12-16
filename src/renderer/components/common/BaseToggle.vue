<template>
  <button
    class="base-toggle"
    :class="{ 
      'base-toggle--active': modelValue, 
      'base-toggle--disabled': disabled,
      'base-toggle--ready': isReady
    }"
    :disabled="disabled"
    role="switch"
    :aria-checked="modelValue"
    @click="handleToggle"
  >
    <span class="base-toggle__slider">
      <span class="base-toggle__icon">
        <svg v-if="!modelValue" viewBox="0 0 12 12" fill="none">
          <path d="M3 6L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg v-else viewBox="0 0 12 12" fill="none">
          <path d="M3 6L5 8L9 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

export interface BaseToggleProps {
  /** v-model 绑定值 */
  modelValue: boolean;
  /** 禁用状态 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<BaseToggleProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isReady = ref(false);

onMounted(() => {
  // 使用 nextTick 确保 Vue 的响应式更新完成
  // 再使用双重 requestAnimationFrame 确保浏览器的布局和绘制都完成
  // 这样可以彻底避免初始渲染时的过渡动画
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isReady.value = true;
      });
    });
  });
});

function handleToggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<style scoped>
.base-toggle {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* 只有在组件准备好后才启用过渡动画 */
.base-toggle.base-toggle--ready {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.base-toggle:hover:not(.base-toggle--disabled) {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
}

.base-toggle.base-toggle--ready:hover:not(.base-toggle--disabled) {
  transform: scale(1.02);
}

.base-toggle--active {
  background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 80%, #000) 100%);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 10%, transparent),
              inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.base-toggle--active:hover:not(.base-toggle--disabled) {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 90%, #fff) 0%, var(--color-primary) 100%);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent),
              0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent),
              inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.base-toggle--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.base-toggle__slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2),
              0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 只有在组件准备好后才启用滑块的过渡动画 */
.base-toggle--ready .base-toggle__slider {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.base-toggle--active .base-toggle__slider {
  transform: translateX(22px);
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25),
              0 1px 3px rgba(0, 0, 0, 0.15);
}

.base-toggle__icon {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.base-toggle--active .base-toggle__icon {
  color: var(--color-primary);
}

.base-toggle__icon svg {
  width: 100%;
  height: 100%;
}
</style>
