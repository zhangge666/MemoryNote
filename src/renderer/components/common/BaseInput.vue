<template>
  <div 
    class="base-input-wrapper"
    :class="{ 'base-input--block': block }"
  >
    <input
      class="base-input"
      :class="{ 
        'base-input--disabled': disabled, 
        'base-input--readonly': readonly,
        'base-input--search': type === 'search'
      }"
      :type="type"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="handleInput"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <svg v-if="type === 'search'" class="base-input__search-icon" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12.5 12.5L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
export interface BaseInputProps {
  /** v-model 绑定值 */
  modelValue?: string | number;
  /** 输入框类型 */
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  /** 占位符文本 */
  placeholder?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 只读状态 */
  readonly?: boolean;
  /** 是否占满父容器宽度 */
  block?: boolean;
}

const props = withDefaults(defineProps<BaseInputProps>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  block: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('change', value);
}

function handleBlur(event: FocusEvent) {
  emit('blur', event);
}

function handleFocus(event: FocusEvent) {
  emit('focus', event);
}
</script>

<style scoped>
.base-input-wrapper {
  position: relative;
  display: inline-block;
  width: auto;
  max-width: 220px;
  min-width: 120px; /* Minimum readable width */
}

.base-input-wrapper.base-input--block {
  width: 100%;
}

.base-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--theme-background-secondary);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-md);
  color: var(--theme-text);
  font-size: var(--theme-font-size-sm);
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
}

.base-input::placeholder {
  color: var(--theme-text-muted);
  font-weight: 400;
}

.base-input:hover:not(.base-input--disabled):not(.base-input--readonly) {
  border-color: var(--theme-primary);
  background: var(--theme-background-secondary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.base-input:focus {
  border-color: var(--theme-primary);
  background: var(--theme-background-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-primary) 12%, transparent),
              0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.base-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.base-input--readonly {
  background: color-mix(in srgb, var(--theme-background-secondary) 50%, transparent);
  cursor: default;
  border-color: transparent;
}

/* 搜索框特殊样式 */
.base-input--search {
  padding-left: 2.75rem;
}

.base-input__search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--theme-text-muted);
  pointer-events: none;
  transition: color 0.2s ease;
}

.base-input-wrapper:hover .base-input__search-icon,
.base-input:focus ~ .base-input__search-icon {
  color: var(--theme-primary);
}

/* 数字输入框 - 隐藏默认的上下箭头 */
.base-input[type="number"]::-webkit-inner-spin-button,
.base-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.base-input[type="number"] {
  -moz-appearance: textfield;
}
</style>
