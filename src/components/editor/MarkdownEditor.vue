<template>
  <div class="markdown-editor h-full flex flex-col">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar border-b border-gray-200 dark:border-dark-600 p-2">
      <div class="flex items-center space-x-2">
        <!-- 格式化按钮 -->
        <button
          @click="insertFormat('**', '**')"
          class="toolbar-btn"
          title="粗体"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3v14h5.5c1.4 0 2.5-.6 3.2-1.3.7-.8 1.3-1.8 1.3-3.2s-.6-2.4-1.3-3.2c.4-.4.7-.9.9-1.5.2-.6.3-1.2.3-1.8 0-1.4-.6-2.5-1.3-3.2C12.9 3.6 11.8 3 10.4 3H5zm3 5h2.5c.6 0 1.1.2 1.4.6.3.4.6.9.6 1.4s-.3 1-.6 1.4c-.3.4-.8.6-1.4.6H8V8zm0 7h3c.6 0 1.1-.2 1.4-.6.3-.4.6-.9.6-1.4s-.3-1-.6-1.4c-.3-.4-.8-.6-1.4-.6H8v4z"/>
          </svg>
        </button>
        
        <button
          @click="insertFormat('*', '*')"
          class="toolbar-btn"
          title="斜体"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3h8v2h-2.5l-2 12H14v2H6v-2h2.5l2-12H8V3z"/>
          </svg>
        </button>
        
        <button
          @click="insertFormat('`', '`')"
          class="toolbar-btn"
          title="代码"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-dark-600 h-6 mx-2"></div>
        
        <button
          @click="insertHeading(1)"
          class="toolbar-btn"
          title="标题 1"
        >
          H1
        </button>
        
        <button
          @click="insertHeading(2)"
          class="toolbar-btn"
          title="标题 2"
        >
          H2
        </button>
        
        <button
          @click="insertHeading(3)"
          class="toolbar-btn"
          title="标题 3"
        >
          H3
        </button>
        
        <div class="border-l border-gray-300 dark:border-dark-600 h-6 mx-2"></div>
        
        <button
          @click="insertList('-')"
          class="toolbar-btn"
          title="无序列表"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <button
          @click="insertList('1.')"
          class="toolbar-btn"
          title="有序列表"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-dark-600 h-6 mx-2"></div>
        
        <button
          @click="togglePreview"
          class="toolbar-btn"
          :class="{ 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': showPreview }"
          title="预览"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 编辑器内容区域 -->
    <div class="flex-1 flex">
      <!-- 编辑器 -->
      <div :class="showPreview ? 'w-1/2' : 'w-full'" class="relative">
        <textarea
          ref="textareaRef"
          v-model="content"
          class="editor-textarea"
          :placeholder="placeholder"
          @input="onInput"
          @keydown="onKeydown"
          @scroll="onScroll"
        ></textarea>
        
        <!-- 行号 -->
        <div v-if="showLineNumbers" class="line-numbers">
          <div
            v-for="lineNumber in lineCount"
            :key="lineNumber"
            class="line-number"
          >
            {{ lineNumber }}
          </div>
        </div>
      </div>
      
      <!-- 预览区域 -->
      <div
        v-if="showPreview"
        class="w-1/2 border-l border-gray-200 dark:border-dark-600 overflow-y-auto"
        :style="{ scrollTop: previewScrollTop }"
      >
        <div class="prose dark:prose-invert max-w-none p-4" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import MarkdownIt from 'markdown-it';

interface Props {
  modelValue: string;
  placeholder?: string;
  showLineNumbers?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始写作...',
  showLineNumbers: false,
});

const emit = defineEmits<Emits>();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// 响应式状态
const textareaRef = ref<HTMLTextAreaElement>();
const content = ref(props.modelValue);
const showPreview = ref(false);
const previewScrollTop = ref(0);

// 计算属性
const renderedContent = computed(() => {
  return md.render(content.value);
});

const lineCount = computed(() => {
  return content.value.split('\n').length;
});

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
  }
});

// 监听内容变化
watch(content, (newContent) => {
  emit('update:modelValue', newContent);
  emit('change', newContent);
});

// 方法
function onInput() {
  // 这里可以添加输入处理逻辑
}

function onKeydown(event: KeyboardEvent) {
  const textarea = textareaRef.value!;
  const { selectionStart, selectionEnd } = textarea;
  
  // Tab键缩进
  if (event.key === 'Tab') {
    event.preventDefault();
    const beforeCursor = content.value.substring(0, selectionStart);
    const afterCursor = content.value.substring(selectionEnd);
    
    if (event.shiftKey) {
      // Shift+Tab 减少缩进
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      if (currentLine.startsWith('  ')) {
        lines[lines.length - 1] = currentLine.substring(2);
        content.value = lines.join('\n') + afterCursor;
        nextTick(() => {
          textarea.setSelectionRange(selectionStart - 2, selectionStart - 2);
        });
      }
    } else {
      // Tab 增加缩进
      content.value = beforeCursor + '  ' + afterCursor;
      nextTick(() => {
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
      });
    }
  }
  
  // Enter键自动缩进
  if (event.key === 'Enter') {
    const beforeCursor = content.value.substring(0, selectionStart);
    const lines = beforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // 检查当前行的缩进
    const indentMatch = currentLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    
    // 检查是否是列表项
    const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      event.preventDefault();
      const listIndent = listMatch[1];
      const listMarker = listMatch[2];
      
      if (currentLine.trim() === listMarker) {
        // 空列表项，删除标记
        const newContent = beforeCursor.substring(0, beforeCursor.lastIndexOf('\n') + 1) + 
                          content.value.substring(selectionEnd);
        content.value = newContent;
        nextTick(() => {
          const newPosition = beforeCursor.lastIndexOf('\n') + 1;
          textarea.setSelectionRange(newPosition, newPosition);
        });
      } else {
        // 继续列表
        const newMarker = listMarker.match(/\d+/) ? 
          `${parseInt(listMarker) + 1}.` : listMarker;
        const insertion = `\n${listIndent}${newMarker} `;
        content.value = beforeCursor + insertion + content.value.substring(selectionEnd);
        nextTick(() => {
          textarea.setSelectionRange(selectionStart + insertion.length, selectionStart + insertion.length);
        });
      }
    } else if (indent) {
      // 保持缩进
      event.preventDefault();
      const insertion = `\n${indent}`;
      content.value = beforeCursor + insertion + content.value.substring(selectionEnd);
      nextTick(() => {
        textarea.setSelectionRange(selectionStart + insertion.length, selectionStart + insertion.length);
      });
    }
  }
}

function onScroll(event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
  
  // 同步预览区域滚动
  if (showPreview.value) {
    const previewElement = textarea.parentElement?.nextElementSibling as HTMLElement;
    if (previewElement) {
      previewScrollTop.value = scrollPercentage * (previewElement.scrollHeight - previewElement.clientHeight);
    }
  }
}

function insertFormat(before: string, after: string) {
  const textarea = textareaRef.value!;
  const { selectionStart, selectionEnd } = textarea;
  const selectedText = content.value.substring(selectionStart, selectionEnd);
  
  const replacement = before + selectedText + after;
  content.value = content.value.substring(0, selectionStart) + replacement + content.value.substring(selectionEnd);
  
  nextTick(() => {
    if (selectedText) {
      textarea.setSelectionRange(selectionStart, selectionStart + replacement.length);
    } else {
      textarea.setSelectionRange(selectionStart + before.length, selectionStart + before.length);
    }
    textarea.focus();
  });
}

function insertHeading(level: number) {
  const textarea = textareaRef.value!;
  const { selectionStart } = textarea;
  const beforeCursor = content.value.substring(0, selectionStart);
  const afterCursor = content.value.substring(selectionStart);
  
  const lines = beforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLine = lines[currentLineIndex];
  
  const headingPrefix = '#'.repeat(level) + ' ';
  
  if (currentLine.trim() === '') {
    // 空行，直接插入标题标记
    lines[currentLineIndex] = headingPrefix;
  } else {
    // 非空行，转换为标题
    lines[currentLineIndex] = headingPrefix + currentLine.replace(/^#+\s*/, '');
  }
  
  content.value = lines.join('\n') + afterCursor;
  
  nextTick(() => {
    const newPosition = lines.join('\n').length;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
  });
}

function insertList(marker: string) {
  const textarea = textareaRef.value!;
  const { selectionStart } = textarea;
  const beforeCursor = content.value.substring(0, selectionStart);
  const afterCursor = content.value.substring(selectionStart);
  
  const lines = beforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLine = lines[currentLineIndex];
  
  const listPrefix = marker === '1.' ? '1. ' : '- ';
  
  if (currentLine.trim() === '') {
    lines[currentLineIndex] = listPrefix;
  } else {
    lines[currentLineIndex] = listPrefix + currentLine;
  }
  
  content.value = lines.join('\n') + afterCursor;
  
  nextTick(() => {
    const newPosition = lines.join('\n').length;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
  });
}

function togglePreview() {
  showPreview.value = !showPreview.value;
}
</script>

<style scoped>
.markdown-editor {
  @apply bg-white dark:bg-dark-900;
}

.editor-toolbar {
  @apply bg-gray-50 dark:bg-dark-800;
}

.toolbar-btn {
  @apply p-2 rounded hover:bg-gray-200 dark:hover:bg-dark-700;
  @apply text-gray-600 dark:text-gray-400;
  @apply transition-colors duration-200;
}

.editor-textarea {
  @apply w-full h-full resize-none border-none outline-none;
  @apply bg-transparent text-gray-900 dark:text-gray-100;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
  @apply p-4 font-mono text-sm leading-6;
}

.line-numbers {
  @apply absolute left-0 top-0 w-12 h-full;
  @apply bg-gray-50 dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600;
  @apply pt-4 text-right pr-2;
  @apply text-xs text-gray-400 dark:text-gray-500;
  @apply font-mono leading-6;
  @apply select-none;
}

.line-number {
  @apply h-6;
}

.prose {
  @apply text-gray-900;
}

.dark .prose {
  @apply text-gray-100;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  @apply text-gray-900 dark:text-gray-100;
}

.prose p {
  @apply text-gray-700 dark:text-gray-300;
}

.prose code {
  @apply bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm;
}

.prose pre {
  @apply bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto;
}

.prose pre code {
  @apply bg-transparent p-0;
}

.prose blockquote {
  @apply border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400;
}

.prose ul, .prose ol {
  @apply text-gray-700 dark:text-gray-300;
}

.prose a {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.prose table {
  @apply border-collapse border border-gray-300 dark:border-dark-600;
}

.prose th, .prose td {
  @apply border border-gray-300 dark:border-dark-600 px-4 py-2;
}

.prose th {
  @apply bg-gray-100 dark:bg-dark-700 font-semibold;
}
</style>
