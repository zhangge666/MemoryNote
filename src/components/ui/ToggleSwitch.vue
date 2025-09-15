<template>
  <button
    type="button"
    :class="[
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      enabled
        ? 'bg-primary-600 hover:bg-primary-700'
        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
    ]"
    :disabled="disabled"
    @click="toggle"
  >
    <span
      :class="[
        'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
        enabled ? 'translate-x-6' : 'translate-x-1'
      ]"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<Emits>();

const enabled = computed(() => props.modelValue);

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<style scoped>
/* 确保过渡动画流畅 */
button:focus {
  outline: none;
}

/* 禁用状态 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:disabled:hover {
  background-color: inherit !important;
}
</style>


