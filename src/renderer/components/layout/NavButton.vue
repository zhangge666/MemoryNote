<template>
  <button
    class="nav-button inline-flex items-center justify-center transition-all flex-shrink-0"
    :class="[active ? 'active' : '', active ? '' : 'text-text-secondary hover:text-text']"
    :title="title"
    @click="$emit('click')"
  >
    <svg 
      class="icon-svg" 
      fill="none" 
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" :d="icon" />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  active?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped>
.nav-button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.nav-button:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

.nav-button.active {
  background: var(--color-primary-light, rgba(59, 130, 246, 0.1));
  color: var(--color-primary);
}

.icon-svg {
  width: 20px;
  height: 20px;
}
</style>

