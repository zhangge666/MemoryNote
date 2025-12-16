<template>
  <div class="base-select-wrapper">
    <select
      class="base-select"
      :class="{ 'base-select--disabled': disabled }"
      :value="modelValue ?? ''"
      :disabled="disabled"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>
    <svg class="base-select__arrow" viewBox="0 0 20 20" fill="none">
      <path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface BaseSelectProps {
  /** v-model 绑定值 */
  modelValue?: string | number;
  /** 选项列表 */
  options?: SelectOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 禁用状态 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<BaseSelectProps>(), {
  options: () => [],
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}>();

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<style scoped>
.base-select-wrapper {
  position: relative;
  display: inline-block;
  width: 200px;
  flex-shrink: 0;
}

.base-select {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 0.875rem;
  background: linear-gradient(135deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 95%, #000) 100%);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.base-select:hover:not(.base-select--disabled) {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.base-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent),
              0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.base-select--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.base-select__arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  pointer-events: none;
  transition: all 0.2s ease;
}

.base-select-wrapper:hover .base-select__arrow {
  color: var(--color-primary);
}

.base-select:focus ~ .base-select__arrow {
  color: var(--color-primary);
  transform: translateY(-50%) rotate(180deg);
}

/* 选项样式 */
.base-select option {
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0.5rem;
}
</style>
