<template>
  <label 
    class="base-checkbox"
    :class="{ 
      'base-checkbox--disabled': disabled,
      'base-checkbox--checked': modelValue
    }"
  >
    <input
      type="checkbox"
      class="base-checkbox__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    <span class="base-checkbox__control">
      <svg 
        v-if="modelValue" 
        class="base-checkbox__icon" 
        viewBox="0 0 16 16" 
        fill="none"
      >
        <path 
          d="M3.5 8L6.5 11L12.5 5" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="$slots.default || label" class="base-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
export interface BaseCheckboxProps {
  modelValue?: boolean;
  label?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<BaseCheckboxProps>(), {
  modelValue: false,
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
  cursor: pointer;
  position: relative;
  user-select: none;
  gap: 0.5rem;
}

.base-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.base-checkbox__control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  border: 1.5px solid var(--theme-text-muted);
  border-radius: 4px;
  background: var(--theme-background);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--theme-text-inverse);
}

.base-checkbox:hover:not(.base-checkbox--disabled) .base-checkbox__control {
  border-color: var(--theme-primary);
  background: var(--theme-background-secondary);
}

.base-checkbox--checked .base-checkbox__control {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
}

.base-checkbox__icon {
  width: 10px;
  height: 10px;
}

.base-checkbox__label {
  font-size: 0.875rem;
  color: var(--theme-text);
  transition: color 0.2s ease;
}

.base-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.base-checkbox--disabled .base-checkbox__control {
  background: var(--theme-background-tertiary);
  border-color: var(--theme-border);
}
</style>
