<template>
  <button
    class="app-button"
    :class="[
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--block': block, 'app-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="app-button__spinner"></span>
    <span v-if="icon && !loading" class="app-button__icon">{{ icon }}</span>
    <span class="app-button__content">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
export interface AppButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button label text */
  label?: string;
  /** Icon (emoji or text) */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  block?: boolean;
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.app-button:focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
}

.app-button:active:not(:disabled) {
  transform: scale(0.98);
}

/* ========== Sizes ========== */
.app-button--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 6px;
}

.app-button--md {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
}

.app-button--lg {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
}

/* ========== Block ========== */
.app-button--block {
  width: 100%;
}

/* ========== Primary Variant ========== */
.app-button--primary {
  background: var(--theme-primary);
  color: white;
}

.app-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-primary) 85%, black);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-primary) 30%, transparent);
}

.app-button--primary:active:not(:disabled) {
  background: color-mix(in srgb, var(--theme-primary) 75%, black);
}

/* ========== Secondary Variant ========== */
.app-button--secondary {
  background: var(--theme-background-secondary);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
}

.app-button--secondary:hover:not(:disabled) {
  background: var(--theme-background-tertiary);
  border-color: var(--theme-primary);
}

.app-button--secondary:active:not(:disabled) {
  background: var(--theme-border);
}

/* ========== Success Variant ========== */
.app-button--success {
  background: var(--theme-success);
  color: white;
}

.app-button--success:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-success) 85%, black);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-success) 30%, transparent);
}

.app-button--success:active:not(:disabled) {
  background: color-mix(in srgb, var(--theme-success) 75%, black);
}

/* ========== Warning Variant ========== */
.app-button--warning {
  background: var(--theme-warning);
  color: #1a1a1a;
}

.app-button--warning:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-warning) 85%, black);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-warning) 30%, transparent);
}

.app-button--warning:active:not(:disabled) {
  background: color-mix(in srgb, var(--theme-warning) 75%, black);
}

/* ========== Danger Variant ========== */
.app-button--danger {
  background: var(--theme-error);
  color: white;
}

.app-button--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-error) 85%, black);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-error) 30%, transparent);
}

.app-button--danger:active:not(:disabled) {
  background: color-mix(in srgb, var(--theme-error) 75%, black);
}

/* ========== Ghost Variant ========== */
.app-button--ghost {
  background: transparent;
  color: var(--theme-text);
}

.app-button--ghost:hover:not(:disabled) {
  background: var(--theme-background-secondary);
}

.app-button--ghost:active:not(:disabled) {
  background: var(--theme-border);
}

/* ========== Disabled State ========== */
.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ========== Loading State ========== */
.app-button--loading {
  pointer-events: none;
}

.app-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.app-button__icon {
  font-size: 1.1em;
}

.app-button__content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
