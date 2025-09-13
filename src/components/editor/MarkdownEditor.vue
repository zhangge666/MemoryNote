<template>
  <div class="markdown-editor h-full flex flex-col">
    <!-- 编辑器工具栏 -->
    <div v-if="currentShowToolbar" class="editor-toolbar border-b border-gray-200 dark:border-dark-600 p-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
        <!-- 格式化按钮 -->
        <button
          @click="isWysiwygMode ? execCommand('bold') : insertFormat('**', '**')"
          class="toolbar-btn"
          title="粗体 (Ctrl+B)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3v14h5.5c1.4 0 2.5-.6 3.2-1.3.7-.8 1.3-1.8 1.3-3.2s-.6-2.4-1.3-3.2c.4-.4.7-.9.9-1.5.2-.6.3-1.2.3-1.8 0-1.4-.6-2.5-1.3-3.2C12.9 3.6 11.8 3 10.4 3H5zm3 5h2.5c.6 0 1.1.2 1.4.6.3.4.6.9.6 1.4s-.3 1-.6 1.4c-.3.4-.8.6-1.4.6H8V8zm0 7h3c.6 0 1.1-.2 1.4-.6.3-.4.6-.9.6-1.4s-.3-1-.6-1.4c-.3-.4-.8-.6-1.4-.6H8v4z"/>
          </svg>
        </button>
        
        <button
          @click="isWysiwygMode ? execCommand('italic') : insertFormat('*', '*')"
          class="toolbar-btn"
          title="斜体 (Ctrl+I)"
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
        
        <!-- 模式指示器 -->
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mr-3">
          <span class="mr-1">模式:</span>
          <span class="font-medium">
            {{ currentViewMode === 'edit' ? '编辑' : currentViewMode === 'read' ? '阅读' : '源码' }}
          </span>
          <span v-if="currentViewMode === 'edit' && currentLayoutMode !== 'single'" class="ml-1 text-gray-400">
            | {{ currentLayoutMode === 'horizontal' ? '水平分屏' : currentLayoutMode === 'vertical' ? '垂直分屏' : '' }}
          </span>
        </div>
        
        <!-- WYSIWYG 模式切换按钮 -->
        <button
          @click="toggleWysiwygMode"
          class="toolbar-btn"
          :class="{ 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': isWysiwygMode }"
          title="所见即所得模式"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- 预览切换按钮 (仅在编辑模式单屏时显示) -->
        <button
          v-if="currentViewMode === 'edit' && currentLayoutMode === 'single' && !isWysiwygMode"
          @click="togglePreview"
          class="toolbar-btn"
          :class="{ 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': showPreview }"
          :title="showPreview ? '显示编辑器' : '显示预览'"
        >
          <svg v-if="!showPreview" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑器内容区域 -->
    <div class="flex-1 flex" :class="getLayoutClass()">
      <!-- 编辑器区域 -->
      <div 
        v-if="currentViewMode !== 'read'"
        :class="getEditorClass()" 
        class="relative"
      >
        <!-- WYSIWYG 编辑器 -->
        <div
          v-if="isWysiwygMode"
          ref="wysiwygRef"
          class="wysiwyg-editor prose prose-gray dark:prose-invert max-w-none p-4 h-full overflow-y-auto focus:outline-none"
          contenteditable="true"
          @keydown="onWysiwygKeydown"
          @paste="onWysiwygPaste"
          @blur="onWysiwygBlur"
          @compositionstart="onCompositionStart"
          @compositionend="onCompositionEnd"
          v-html="wysiwygContent"
          :data-placeholder="placeholder"
        ></div>
        
        <!-- 传统文本编辑器 -->
        <textarea
          v-else
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
        v-if="shouldShowPreview"
        :class="getPreviewClass()"
        class="overflow-y-auto"
        :style="{ scrollTop: previewScrollTop }"
        ref="previewRef"
      >
        <div class="prose prose-gray dark:prose-invert max-w-none p-4" v-html="renderedContent"></div>
      </div>
    </div>
    
    <!-- 查找替换对话框 -->
    <div
      v-if="showFindReplace"
      class="find-replace-dialog absolute top-16 right-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg p-4 z-40 w-80"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">查找替换</h3>
        <button @click="showFindReplace = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3">
        <input
          v-model="findText"
          type="text"
          placeholder="查找内容"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
          @keydown.enter="findNext"
        />
        <input
          v-model="replaceText"
          type="text"
          placeholder="替换为"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
          @keydown.enter="replaceNext"
        />
        
        <div class="flex items-center space-x-2">
          <button @click="findNext" class="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">查找下一个</button>
          <button @click="replaceNext" class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">替换</button>
          <button @click="replaceAll" class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">全部替换</button>
        </div>
        
        <div class="flex items-center space-x-4 text-sm">
          <label class="flex items-center">
            <input v-model="caseSensitive" type="checkbox" class="mr-1" />
            大小写敏感
          </label>
          <label class="flex items-center">
            <input v-model="wholeWord" type="checkbox" class="mr-1" />
            全词匹配
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import MarkdownIt from 'markdown-it';

interface Props {
  modelValue: string;
  placeholder?: string;
  showLineNumbers?: boolean;
  viewMode?: 'edit' | 'read' | 'source';
  layoutMode?: 'single' | 'horizontal' | 'vertical';
  showToolbar?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'save'): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始写作...',
  showLineNumbers: false,
  viewMode: 'edit',
  layoutMode: 'single',
  showToolbar: true,
});

const emit = defineEmits<Emits>();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// 响应式状态
const textareaRef = ref<HTMLTextAreaElement>();
const previewRef = ref<HTMLElement>();
const wysiwygRef = ref<HTMLElement>();
const content = ref(props.modelValue);
const showPreview = ref(false);
const previewScrollTop = ref(0);

// WYSIWYG 相关状态
const isWysiwygMode = ref(false);
const wysiwygContent = ref('');

// 查找替换相关状态
const showFindReplace = ref(false);

// 计算属性，优先使用父组件传入的props
const currentViewMode = computed(() => props.viewMode);
const currentLayoutMode = computed(() => props.layoutMode);
const currentShowToolbar = computed(() => props.showToolbar);

// 查找替换相关状态
const findText = ref('');
const replaceText = ref('');
const caseSensitive = ref(false);
const wholeWord = ref(false);
const currentMatchIndex = ref(-1);
const totalMatches = ref(0);

// 计算属性
const renderedContent = computed(() => {
  return md.render(content.value);
});

const lineCount = computed(() => {
  return content.value.split('\n').length;
});

const shouldShowPreview = computed(() => {
  // 阅读模式：只显示预览
  if (currentViewMode.value === 'read') return true;
  
  // 源码模式：不显示预览
  if (currentViewMode.value === 'source') return false;
  
  // 编辑模式：根据布局模式决定
  if (currentViewMode.value === 'edit') {
    // 单屏模式：手动切换预览
    if (currentLayoutMode.value === 'single') return showPreview.value;
    // 分屏模式：始终显示预览
    return true;
  }
  
  return false;
});

const getLayoutClass = () => {
  if (currentLayoutMode.value === 'vertical') return 'flex-col';
  return 'flex-row';
};

const getEditorClass = () => {
  // 阅读模式：隐藏编辑器
  if (currentViewMode.value === 'read') return 'hidden';
  
  // 源码模式和编辑模式
  if (currentLayoutMode.value === 'single') {
    // 单屏模式：如果显示预览则隐藏编辑器，否则全屏
    return shouldShowPreview.value ? 'hidden' : 'w-full';
  }
  
  // 分屏模式
  if (currentLayoutMode.value === 'horizontal') return 'w-1/2';
  if (currentLayoutMode.value === 'vertical') return 'h-1/2';
  
  return 'w-full';
};

const getPreviewClass = () => {
  // 阅读模式：全屏显示
  if (currentViewMode.value === 'read') return 'w-full';
  
  // 单屏模式：全屏显示预览
  if (currentLayoutMode.value === 'single') return 'w-full';
  
  // 分屏模式
  if (currentLayoutMode.value === 'horizontal') return 'w-1/2 border-l border-gray-200 dark:border-dark-600';
  if (currentLayoutMode.value === 'vertical') return 'h-1/2 border-t border-gray-200 dark:border-dark-600';
  
  return 'w-1/2 border-l border-gray-200 dark:border-dark-600';
};

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

// 监听用户输入，保存历史
let inputTimer: number | null = null;
function onInput() {
  // 延迟保存历史，避免频繁操作
  if (inputTimer) {
    clearTimeout(inputTimer);
  }
  inputTimer = setTimeout(() => {
    saveToHistory();
  }, 1000);
}

// 在首次加载时保存初始状态
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
    if (undoStack.value.length === 0) {
      saveToHistory();
    }
    // 如果在WYSIWYG模式，同步更新HTML内容
    if (isWysiwygMode.value) {
      wysiwygContent.value = md.render(newValue);
    }
  }
}, { immediate: true });

// 监听content变化，同步WYSIWYG内容（但避免在用户输入时更新）
let isUserTyping = false;
watch(content, (newValue) => {
  if (isWysiwygMode.value && wysiwygRef.value && !isUserTyping) {
    // 只有当内容真正改变时才更新，避免循环更新
    const currentHtml = wysiwygRef.value.innerHTML;
    const newHtml = md.render(newValue);
    if (currentHtml !== newHtml) {
      wysiwygContent.value = newHtml;
    }
  }
});

// 方法 - onInput 已在上面定义

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

// WYSIWYG 模式切换
function toggleWysiwygMode() {
  isWysiwygMode.value = !isWysiwygMode.value;
  
  if (isWysiwygMode.value) {
    // 切换到 WYSIWYG 模式
    nextTick(() => {
      initWysiwygEditor();
      if (wysiwygRef.value) {
        wysiwygRef.value.focus();
      }
    });
  } else {
    // 切换回文本模式，清理观察器
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // 最后一次转换
    if (wysiwygRef.value) {
      updateMarkdownFromWysiwyg();
    }
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
      }
    });
  }
}

// WYSIWYG 输入处理 - 使用更简单的方法
let wysiwygUpdateTimer: number | null = null;
let observer: MutationObserver | null = null;

function onWysiwygInput(event: Event) {
  // 标记用户正在输入
  isUserTyping = true;
  
  // 清除之前的定时器
  if (wysiwygUpdateTimer) {
    clearTimeout(wysiwygUpdateTimer);
  }
  
  // 延迟更新，让用户连续输入
  wysiwygUpdateTimer = setTimeout(() => {
    updateMarkdownFromWysiwyg();
    isUserTyping = false;
  }, 500); // 增加延迟到500ms
}

function updateMarkdownFromWysiwyg() {
  if (!wysiwygRef.value) return;
  
  const html = wysiwygRef.value.innerHTML;
  const markdown = htmlToMarkdown(html);
  
  // 只有内容真正改变时才更新
  if (markdown !== content.value) {
    wysiwygContent.value = html;
    content.value = markdown;
    emit('update:modelValue', markdown);
    emit('change', markdown);
  }
}

// 初始化WYSIWYG编辑器
function initWysiwygEditor() {
  if (!wysiwygRef.value) return;
  
  // 设置初始内容
  wysiwygContent.value = md.render(content.value);
  
  // 移除旧的观察器
  if (observer) {
    observer.disconnect();
  }
  
  // 创建MutationObserver来监听内容变化
  observer = new MutationObserver((mutations) => {
    // 如果正在输入中文，不处理
    if (isComposing) return;
    
    // 只有当不是程序化更新时才处理
    if (!isUserTyping) return;
    
    let hasContentChange = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' || 
          mutation.type === 'characterData' ||
          (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
        hasContentChange = true;
      }
    });
    
    if (hasContentChange) {
      // 延迟处理，避免中文输入时的问题
      if (wysiwygUpdateTimer) {
        clearTimeout(wysiwygUpdateTimer);
      }
      
      wysiwygUpdateTimer = setTimeout(() => {
        updateMarkdownFromWysiwyg();
        isUserTyping = false;
      }, 300);
    }
  });
  
  // 开始观察
  observer.observe(wysiwygRef.value, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });
}

// 将光标放在内容末尾（备用函数）
function placeCursorAtEnd() {
  if (!wysiwygRef.value) return;
  
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(wysiwygRef.value);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// WYSIWYG 键盘事件处理
function onWysiwygKeydown(event: KeyboardEvent) {
  // 处理一些特殊的键盘快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault();
        execCommand('bold');
        break;
      case 'i':
        event.preventDefault();
        execCommand('italic');
        break;
      case 's':
        event.preventDefault();
        emit('save');
        break;
      case 'z':
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 'y':
        event.preventDefault();
        redo();
        break;
    }
  }
  
  // Enter键处理
  if (event.key === 'Enter') {
    handleEnterInWysiwyg(event);
  }
}

// WYSIWYG 粘贴处理
function onWysiwygPaste(event: ClipboardEvent) {
  event.preventDefault();
  
  const text = event.clipboardData?.getData('text/plain') || '';
  if (text) {
    // 插入纯文本，避免粘贴格式问题
    document.execCommand('insertText', false, text);
    // 标记用户正在输入
    isUserTyping = true;
    // 延迟更新
    setTimeout(() => {
      updateMarkdownFromWysiwyg();
      isUserTyping = false;
    }, 100);
  }
}

// WYSIWYG 失去焦点处理
function onWysiwygBlur() {
  // 失去焦点时立即同步内容
  setTimeout(() => {
    updateMarkdownFromWysiwyg();
    isUserTyping = false;
  }, 100);
}

// 中文输入开始
let isComposing = false;
function onCompositionStart() {
  isComposing = true;
  isUserTyping = true;
}

// 中文输入结束
function onCompositionEnd() {
  isComposing = false;
  // 输入法结束后延迟更新
  setTimeout(() => {
    updateMarkdownFromWysiwyg();
    isUserTyping = false;
  }, 100);
}

// 执行编辑命令
function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
  // 标记用户操作
  isUserTyping = true;
  // 延迟更新
  setTimeout(() => {
    updateMarkdownFromWysiwyg();
    isUserTyping = false;
  }, 100);
}

// 处理WYSIWYG中的Enter键
function handleEnterInWysiwyg(event: KeyboardEvent) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  // 如果在列表中，处理列表项的创建
  const listItem = container.nodeType === Node.TEXT_NODE 
    ? container.parentElement?.closest('li')
    : (container as Element).closest('li');
    
  if (listItem) {
    // 在列表中，让浏览器处理默认行为
    return;
  }
  
  // 在其他情况下，创建新段落
  event.preventDefault();
  const br = document.createElement('br');
  range.insertNode(br);
  range.setStartAfter(br);
  range.setEndAfter(br);
  selection.removeAllRanges();
  selection.addRange(range);
}

// 将HTML转换为Markdown（简化版）
function convertHtmlToMarkdown() {
  if (!wysiwygRef.value) return;
  
  const html = wysiwygRef.value.innerHTML;
  const markdown = htmlToMarkdown(html);
  content.value = markdown;
}

// HTML转Markdown的核心函数
function htmlToMarkdown(html: string): string {
  // 简单的HTML到Markdown转换
  // 标题
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  
  // 粗体和斜体
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  html = html.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // 链接
  html = html.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // 代码
  html = html.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  html = html.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```');
  
  // 列表
  html = html.replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  });
  html = html.replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
  });
  
  // 段落
  html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // 换行
  html = html.replace(/<br[^>]*>/gi, '\n');
  
  // 清理HTML标签
  html = html.replace(/<[^>]*>/g, '');
  
  // 清理多余的空行
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.trim();
  
  return html;
}

// 插入链接
function insertLink() {
  const textarea = textareaRef.value!;
  const { selectionStart, selectionEnd } = textarea;
  const selectedText = content.value.substring(selectionStart, selectionEnd);
  
  const linkText = selectedText || 'link text';
  const url = prompt('请输入链接地址:', 'https://');
  
  if (url) {
    const linkMarkdown = `[${linkText}](${url})`;
    content.value = content.value.substring(0, selectionStart) + linkMarkdown + content.value.substring(selectionEnd);
    
    nextTick(() => {
      if (!selectedText) {
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1 + linkText.length);
      } else {
        textarea.setSelectionRange(selectionStart + linkMarkdown.length, selectionStart + linkMarkdown.length);
      }
      textarea.focus();
    });
  }
}

// 插入换行
function insertLineBreak() {
  const textarea = textareaRef.value!;
  const { selectionStart } = textarea;
  
  content.value = content.value.substring(0, selectionStart) + '  \n' + content.value.substring(selectionStart);
  
  nextTick(() => {
    textarea.setSelectionRange(selectionStart + 3, selectionStart + 3);
    textarea.focus();
  });
}

// 注意：文件操作、视图模式、布局模式等功能现在都由父组件 NoteEditor 处理

// 查找替换功能
function findNext() {
  if (!findText.value) return;
  
  const textarea = textareaRef.value;
  if (!textarea) return;
  
  let searchText = findText.value;
  let content = textarea.value;
  
  if (!caseSensitive.value) {
    searchText = searchText.toLowerCase();
    content = content.toLowerCase();
  }
  
  const startPos = textarea.selectionEnd;
  let index = content.indexOf(searchText, startPos);
  
  if (index === -1) {
    // 从头开始搜索
    index = content.indexOf(searchText, 0);
  }
  
  if (index !== -1) {
    textarea.setSelectionRange(index, index + findText.value.length);
    textarea.focus();
  }
}

function replaceNext() {
  if (!findText.value) return;
  
  const textarea = textareaRef.value;
  if (!textarea) return;
  
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  
  if (selectedText === findText.value || (!caseSensitive.value && selectedText.toLowerCase() === findText.value.toLowerCase())) {
    const beforeSelection = textarea.value.substring(0, textarea.selectionStart);
    const afterSelection = textarea.value.substring(textarea.selectionEnd);
    
    content.value = beforeSelection + replaceText.value + afterSelection;
    
    nextTick(() => {
      textarea.setSelectionRange(
        beforeSelection.length,
        beforeSelection.length + replaceText.value.length
      );
      findNext();
    });
  } else {
    findNext();
  }
}

function replaceAll() {
  if (!findText.value) return;
  
  let searchText = findText.value;
  let replaceStr = replaceText.value;
  
  if (caseSensitive.value) {
    content.value = content.value.split(searchText).join(replaceStr);
  } else {
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    content.value = content.value.replace(regex, replaceStr);
  }
}

// 撤销重做历史
const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);
const maxHistorySize = 50;

// 保存历史状态
function saveToHistory() {
  if (undoStack.value.length >= maxHistorySize) {
    undoStack.value.shift();
  }
  undoStack.value.push(content.value);
  redoStack.value = []; // 清空重做栈
}

// 撤销操作
function undo() {
  if (undoStack.value.length > 0) {
    redoStack.value.push(content.value);
    const previousState = undoStack.value.pop();
    if (previousState !== undefined) {
      content.value = previousState;
    }
  }
}

// 重做操作
function redo() {
  if (redoStack.value.length > 0) {
    undoStack.value.push(content.value);
    const nextState = redoStack.value.pop();
    if (nextState !== undefined) {
      content.value = nextState;
    }
  }
}

// 键盘快捷键
function handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault();
        emit('save');
        break;
      case 'z':
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 'y':
        event.preventDefault();
        redo();
        break;
      case 'f':
        event.preventDefault();
        showFindReplace.value = true;
        break;
      case 'b':
        event.preventDefault();
        insertFormat('**', '**');
        break;
      case 'i':
        event.preventDefault();
        insertFormat('*', '*');
        break;
      case 'k':
        event.preventDefault();
        insertLink();
        break;
      case 'Enter':
        event.preventDefault();
        insertLineBreak();
        break;
      case '/':
        event.preventDefault();
        showFindReplace.value = true;
        break;
    }
  }
  
  if (event.key === 'Escape') {
    showFindReplace.value = false;
  }
  
  // Alt + 数字键快速插入标题
  if (event.altKey && event.key >= '1' && event.key <= '6') {
    event.preventDefault();
    insertHeading(parseInt(event.key));
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  
  // 清理WYSIWYG相关资源
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  if (wysiwygUpdateTimer) {
    clearTimeout(wysiwygUpdateTimer);
    wysiwygUpdateTimer = null;
  }
});
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

/* 查找替换对话框样式 */
.find-replace-dialog {
  min-width: 320px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .find-replace-dialog {
    @apply w-72 right-2;
  }
}

/* Typography 插件自定义样式 */
.prose {
  font-size: 16px;
  line-height: 1.75;
}

/* 自定义一些调整 */
.prose h1 {
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 0.5rem;
}

.dark .prose h1 {
  border-bottom-color: #60a5fa;
}

.prose h2 {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

.dark .prose h2 {
  border-bottom-color: #4b5563;
}

.prose blockquote {
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 0.375rem;
  padding: 1rem;
}

.dark .prose blockquote {
  background-color: rgba(59, 130, 246, 0.1);
}

.prose pre {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .prose pre {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.prose table {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.dark .prose table {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.prose img {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.prose img:hover {
  transform: scale(1.02);
}

/* WYSIWYG 编辑器样式 */
.wysiwyg-editor {
  min-height: 200px;
  cursor: text;
  background-color: transparent;
  border: none;
  outline: none;
}

.wysiwyg-editor:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  font-style: italic;
  pointer-events: none;
}

.dark .wysiwyg-editor:empty:before {
  color: #6b7280;
}

/* WYSIWYG 编辑器中的元素样式调整 */
.wysiwyg-editor * {
  outline: none;
}

.wysiwyg-editor h1,
.wysiwyg-editor h2,
.wysiwyg-editor h3,
.wysiwyg-editor h4,
.wysiwyg-editor h5,
.wysiwyg-editor h6 {
  cursor: text;
}

.wysiwyg-editor p {
  cursor: text;
  min-height: 1.5em;
}

.wysiwyg-editor li {
  cursor: text;
}

.wysiwyg-editor blockquote {
  cursor: text;
}

.wysiwyg-editor code {
  cursor: text;
}

.wysiwyg-editor pre {
  cursor: text;
}

/* 选中文本的样式 */
.wysiwyg-editor ::selection {
  background-color: rgba(59, 130, 246, 0.3);
}

.dark .wysiwyg-editor ::selection {
  background-color: rgba(96, 165, 250, 0.3);
}

/* 预览区域滚动条样式 */
.prose::-webkit-scrollbar {
  width: 8px;
}

.prose::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.prose::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-500 rounded-full;
}

.prose::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-400;
}
</style>
