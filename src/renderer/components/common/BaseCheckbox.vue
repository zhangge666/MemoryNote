<template>
  <label class="base-checkbox" :class="{ 'base-checkbox--disabled': disabled }">
    <input
      type="checkbox"
      class="base-checkbox__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    <span class="base-checkbox__box">
      <svg
        v-if="modelValue"
        class="base-checkbox__icon"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M13.5 4.5L6 12L2.5 8.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="base-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
export interface BaseCheckboxProps {
  /** v-model 绑定值 */
  modelValue: boolean;
  /** 标签文本 */
  label?: string;
  /** 禁用状态 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<BaseCheckboxProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
  emit('change', target.checked);
}
</script>

<style scoped>
.base-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.base-checkbox--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.base-checkbox__box {
  position: relative;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.base-checkbox:hover:not(.base-checkbox--disabled) .base-checkbox__box {
  border-color: var(--color-primary);
}

.base-checkbox__input:checked + .base-checkbox__box {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.base-checkbox__input:focus + .base-checkbox__box {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.base-checkbox__icon {
  width: 12px;
  height: 12px;
  color: white;
}

.base-checkbox__label {
  font-size: 0.875rem;
  color: var(--color-text);
}
</style>
