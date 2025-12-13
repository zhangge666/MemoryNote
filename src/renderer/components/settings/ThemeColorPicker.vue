<template>
  <div class="color-picker-group">
    <label class="color-label">{{ label }}</label>
    <div class="color-input-wrapper">
      <input
        type="color"
        :value="modelValue"
        @input="handleInput"
        class="color-input"
      />
      <input
        type="text"
        :value="modelValue"
        @input="handleTextInput"
        class="color-text"
        placeholder="#000000"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleTextInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value;
  // Validate hex color
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    emit('update:modelValue', value);
  }
};
</script>

<style scoped>
.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text);
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-input {
  width: 50px;
  height: 36px;
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--theme-background);
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-text {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--theme-input-background);
  border: 1px solid var(--theme-input-border);
  border-radius: 6px;
  color: var(--theme-input-text);
  font-size: 0.875rem;
  font-family: var(--theme-font-mono);
  transition: all 0.2s ease;
}

.color-text:focus {
  outline: none;
  border-color: var(--theme-input-focus);
}

.color-text::placeholder {
  color: var(--theme-input-placeholder);
}
</style>
