<template>
  <div class="markdown-editor h-full flex flex-col">
    <!-- 编辑器工具栏 -->
    <div v-if="currentShowToolbar" class="editor-toolbar border-b border-gray-200 dark:border-dark-600 p-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <!-- 模式切换按钮组 -->
          <div class="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
            <button
              @click="setEditorMode('wysiwyg')"
              class="mode-btn"
              :class="{ 'mode-btn-active': editorMode === 'wysiwyg' }"
              title="所见即所得模式"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
              </svg>
              所见即所得
            </button>
            <button
              @click="setEditorMode('source')"
              class="mode-btn"
              :class="{ 'mode-btn-active': editorMode === 'source' }"
              title="源码模式"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              源码
            </button>
            <button
              @click="setEditorMode('preview')"
              class="mode-btn"
              :class="{ 'mode-btn-active': editorMode === 'preview' }"
              title="阅读模式"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
              阅读
            </button>
          </div>

          <div class="border-l border-gray-300 dark:border-dark-600 h-6 mx-2"></div>
          
          <!-- 格式化按钮组 (仅在WYSIWYG和源码模式显示) -->
          <div v-if="editorMode !== 'preview'" class="flex items-center space-x-1">
            <button @click="execCommand('bold')" class="toolbar-btn" title="粗体 (Ctrl+B)">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4v12h4.5c1.38 0 2.5-.62 2.5-2s-.62-2-2.5-2c1.38 0 2.5-.62 2.5-2s-1.12-2-2.5-2H6zm3 5h1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H9V9zm0 4h2c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H9v1z"/>
              </svg>
            </button>
            
            <button @click="execCommand('italic')" class="toolbar-btn" title="斜体 (Ctrl+I)">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3h8v2h-2.5l-2 12H14v2H6v-2h2.5l2-12H8V3z"/>
              </svg>
            </button>
            
            <button @click="execCommand('strikethrough')" class="toolbar-btn" title="删除线">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10h8v2H6v-2zm2-4h4v2H8V6zm4 8H8v2h4v-2z"/>
              </svg>
            </button>
            
            <button @click="execCommand('code_inline')" class="toolbar-btn" title="行内代码">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>

            <div class="border-l border-gray-300 dark:border-dark-600 h-4 mx-1"></div>

            <button @click="execCommand('heading', { level: 1 })" class="toolbar-btn" title="标题 1">H1</button>
            <button @click="execCommand('heading', { level: 2 })" class="toolbar-btn" title="标题 2">H2</button>
            <button @click="execCommand('heading', { level: 3 })" class="toolbar-btn" title="标题 3">H3</button>

            <div class="border-l border-gray-300 dark:border-dark-600 h-4 mx-1"></div>

            <button @click="execCommand('bullet_list')" class="toolbar-btn" title="无序列表">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 000 2h1a1 1 0 000-2H3zM3 9a1 1 0 000 2h1a1 1 0 000-2H3zM3 14a1 1 0 000 2h1a1 1 0 000-2H3zM7 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zM7 9a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zM7 14a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z"/>
              </svg>
            </button>
            
            <button @click="execCommand('ordered_list')" class="toolbar-btn" title="有序列表">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 000 2h1a1 1 0 000-2H3zM3 9a1 1 0 000 2h1a1 1 0 000-2H3zM3 14a1 1 0 000 2h1a1 1 0 000-2H3zM7 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zM7 9a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zM7 14a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z"/>
              </svg>
            </button>

            <div class="border-l border-gray-300 dark:border-dark-600 h-4 mx-1"></div>

            <button @click="execCommand('link')" class="toolbar-btn" title="链接 (Ctrl+K)">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
              </svg>
            </button>

            <button @click="execCommand('image')" class="toolbar-btn" title="图片">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
              </svg>
            </button>

            <button @click="execCommand('table')" class="toolbar-btn" title="表格">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zM4 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3H4zm2 4h8v2H6V6zm8 4H6v2h8v-2zm-8 4h8v2H6v-2z" clip-rule="evenodd"/>
              </svg>
            </button>

            <button @click="execCommand('code_block')" class="toolbar-btn" title="代码块">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <!-- 当前模式指示 -->
          <div class="flex items-center">
            <span class="mr-1">当前:</span>
            <span class="font-medium text-primary-600 dark:text-primary-400">
              {{ editorMode === 'wysiwyg' ? '所见即所得' : editorMode === 'source' ? '源码模式' : '阅读模式' }}
            </span>
          </div>

          <!-- 文档信息 -->
          <div class="flex items-center space-x-2">
            <span>{{ wordCount }} 字</span>
            <span>{{ lineCount }} 行</span>
          </div>

          <!-- 图片存储信息 -->
          <span class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
            📁 Obsidian式存储
          </span>
        </div>
      </div>
    </div>
    
    <!-- 编辑器内容区域 -->
    <div class="flex-1 relative">
      <!-- Milkdown 所见即所得编辑器 -->
      <div
        v-show="editorMode === 'wysiwyg'"
        ref="milkdownRef"
        class="milkdown-container h-full"
      ></div>

      <!-- 源码编辑器 -->
      <div
        v-show="editorMode === 'source'"
        class="source-editor h-full relative"
      >
        <textarea
          ref="textareaRef"
          v-model="content"
          class="source-textarea"
          :placeholder="placeholder"
          @input="onInput"
          @keydown="onKeydown"
          @paste="onTextareaPaste"
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

      <!-- 阅读模式 -->
      <div
        v-show="editorMode === 'preview'"
        class="preview-container h-full overflow-y-auto"
      >
        <div class="prose prose-gray dark:prose-invert max-w-none p-6" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import MarkdownIt from 'markdown-it';
import { 
  defaultValueCtx, 
  Editor, 
  editorViewOptionsCtx, 
  rootCtx, 
  editorViewCtx, 
  parserCtx, 
  serializerCtx 
} from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { block } from '@milkdown/plugin-block';
// 注意：一些高级插件可能需要额外安装
// import { slash } from '@milkdown/plugin-slash';
// import { tooltip } from '@milkdown/plugin-tooltip';

interface Props {
  modelValue: string;
  placeholder?: string;
  showLineNumbers?: boolean;
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
  showToolbar: true,
});

const emit = defineEmits<Emits>();

// Markdown-it 实例用于预览模式
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// 编辑器状态
type EditorMode = 'wysiwyg' | 'source' | 'preview';
const editorMode = ref<EditorMode>('wysiwyg');
const content = ref(props.modelValue);

// DOM引用
const milkdownRef = ref<HTMLElement>();
const textareaRef = ref<HTMLTextAreaElement>();

// Milkdown编辑器实例
let milkdownEditor: Editor | null = null;
let isInitializing = ref(false);
let isUpdatingContent = ref(false);

// 计算属性
const currentShowToolbar = computed(() => props.showToolbar);
const lineCount = computed(() => content.value.split('\n').length);
const wordCount = computed(() => {
  const text = content.value.replace(/[#*`\-\[\]()]/g, '').trim();
  return text ? text.split(/\s+/).length : 0;
});

const renderedContent = computed(() => {
  const processedContent = processContentForDisplay(content.value);
  return md.render(processedContent);
});

// 模式切换
function setEditorMode(mode: EditorMode) {
  if (editorMode.value === mode) return;
  
  const previousMode = editorMode.value;
  editorMode.value = mode;
  
  nextTick(() => {
    if (mode === 'wysiwyg' && previousMode !== 'wysiwyg') {
      initMilkdownEditor();
    } else if (mode === 'source' && previousMode !== 'source') {
      if (textareaRef.value) {
        textareaRef.value.focus();
      }
    }
  });
}

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value && !isUpdatingContent.value) {
    content.value = newValue;
    updateMilkdownContent(newValue);
  }
});

watch(content, (newContent) => {
  if (!isUpdatingContent.value) {
    emit('update:modelValue', newContent);
    emit('change', newContent);
  }
});

// Milkdown 编辑器初始化
async function initMilkdownEditor() {
  if (!milkdownRef.value || milkdownEditor || isInitializing.value) return;
  
  try {
    isInitializing.value = true;
    
    milkdownEditor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, milkdownRef.value);
        ctx.set(defaultValueCtx, processContentForDisplay(content.value));
        ctx.set(editorViewOptionsCtx, {
          editable: () => true,
          attributes: {
            class: 'milkdown-editor-content prose prose-gray dark:prose-invert max-w-none outline-none p-4',
            spellcheck: 'false'
          }
        });
        
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
          if (!isUpdatingContent.value) {
            isUpdatingContent.value = true;
            const convertedMarkdown = convertImageRefsFromMarkdown(markdown);
            content.value = convertedMarkdown;
            nextTick(() => {
              isUpdatingContent.value = false;
            });
          }
        });
      })
      .config(nord)
      .use(commonmark)
      .use(listener)
      .use(history)
      .use(cursor)
      .use(block)
      .create();
      
    console.log('Milkdown editor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Milkdown editor:', error);
    // 回退到源码模式
    editorMode.value = 'source';
  } finally {
    isInitializing.value = false;
  }
}

// 更新Milkdown内容
async function updateMilkdownContent(newContent: string) {
  if (!milkdownEditor || isUpdatingContent.value) return;
  
  try {
    isUpdatingContent.value = true;
    const processedContent = processContentForDisplay(newContent);
    
    await milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      
      const doc = parser(processedContent);
      if (doc && view.state.doc.toString() !== doc.toString()) {
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
        view.dispatch(tr);
      }
    });
  } catch (error) {
    console.error('Failed to update Milkdown content:', error);
  } finally {
    nextTick(() => {
      isUpdatingContent.value = false;
    });
  }
}

// 源码编辑器事件处理
function onInput() {
  // 源码模式下的输入处理
}

function onKeydown(event: KeyboardEvent) {
  if (!textareaRef.value) return;
  
  const textarea = textareaRef.value;
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
  
  // 快捷键处理
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault();
        emit('save');
        break;
      case 'b':
        event.preventDefault();
        execCommand('bold');
        break;
      case 'i':
        event.preventDefault();
        execCommand('italic');
        break;
      case 'k':
        event.preventDefault();
        execCommand('link');
        break;
    }
  }
}

// 命令执行
function execCommand(command: string, options?: any) {
  if (editorMode.value === 'wysiwyg' && milkdownEditor) {
    execMilkdownCommand(command, options);
  } else if (editorMode.value === 'source') {
    execSourceCommand(command, options);
  }
}

// Milkdown 命令执行
function execMilkdownCommand(command: string, options?: any) {
  if (!milkdownEditor) return;
  
  try {
    switch (command) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'strikethrough':
        document.execCommand('strikethrough');
        break;
      case 'code_inline':
        insertMilkdownFormat('`', '`');
        break;
      case 'heading':
        insertMilkdownHeading(options?.level || 1);
        break;
      case 'bullet_list':
        insertMilkdownFormat('- ', '');
        break;
      case 'ordered_list':
        insertMilkdownFormat('1. ', '');
        break;
      case 'link':
        insertMilkdownLink();
        break;
      case 'image':
        insertMilkdownImage();
        break;
      case 'table':
        insertMilkdownTable();
        break;
      case 'code_block':
        insertMilkdownCodeBlock();
        break;
    }
  } catch (error) {
    console.warn('Milkdown command failed, fallback to source mode:', error);
    execSourceCommand(command, options);
  }
}

// 源码模式命令执行
function execSourceCommand(command: string, options?: any) {
  if (!textareaRef.value) return;
  
  const textarea = textareaRef.value;
  const { selectionStart, selectionEnd } = textarea;
  const selectedText = content.value.substring(selectionStart, selectionEnd);
  
  let insertion = '';
  let cursorOffset = 0;
  
  switch (command) {
    case 'bold':
      insertion = `**${selectedText}**`;
      cursorOffset = selectedText ? 0 : 2;
      break;
    case 'italic':
      insertion = `*${selectedText}*`;
      cursorOffset = selectedText ? 0 : 1;
      break;
    case 'strikethrough':
      insertion = `~~${selectedText}~~`;
      cursorOffset = selectedText ? 0 : 2;
      break;
    case 'code_inline':
      insertion = `\`${selectedText}\``;
      cursorOffset = selectedText ? 0 : 1;
      break;
    case 'heading':
      const level = options?.level || 1;
      insertion = `${'#'.repeat(level)} ${selectedText}`;
      cursorOffset = selectedText ? 0 : level + 1;
      break;
    case 'bullet_list':
      insertion = `- ${selectedText}`;
      cursorOffset = selectedText ? 0 : 2;
      break;
    case 'ordered_list':
      insertion = `1. ${selectedText}`;
      cursorOffset = selectedText ? 0 : 3;
      break;
    case 'link':
      const url = prompt('请输入链接地址:', 'https://');
      if (url) {
        insertion = `[${selectedText || 'link text'}](${url})`;
        cursorOffset = selectedText ? 0 : 1;
      }
      break;
    case 'image':
      const imgUrl = prompt('请输入图片地址:', 'https://');
      if (imgUrl) {
        insertion = `![${selectedText || 'image'}](${imgUrl})`;
        cursorOffset = 0;
      }
      break;
    case 'table':
      insertion = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |`;
      cursorOffset = 0;
      break;
    case 'code_block':
      insertion = `\`\`\`\n${selectedText}\n\`\`\``;
      cursorOffset = selectedText ? 0 : 4;
      break;
  }
  
  if (insertion) {
    content.value = content.value.substring(0, selectionStart) + insertion + content.value.substring(selectionEnd);
    
    nextTick(() => {
      const newPosition = selectionStart + insertion.length - cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    });
  }
}

// Milkdown 格式化辅助函数
function insertMilkdownFormat(before: string, after: string) {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    const replacement = before + selectedText + after;
    
    range.deleteContents();
    const textNode = document.createTextNode(replacement);
    range.insertNode(textNode);
    
    // 设置光标位置
    if (!selectedText) {
      range.setStart(textNode, before.length);
      range.setEnd(textNode, before.length);
    } else {
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
    }
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function insertMilkdownHeading(level: number) {
  insertMilkdownFormat('#'.repeat(level) + ' ', '');
}

function insertMilkdownLink() {
  const url = prompt('请输入链接地址:', 'https://');
  if (url) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      insertMilkdownFormat(`[${selectedText || 'link text'}](`, `${url})`);
    }
  }
}

function insertMilkdownImage() {
  const url = prompt('请输入图片地址:', 'https://');
  if (url) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      insertMilkdownFormat(`![${selectedText || 'image'}](`, `${url})`);
    }
  }
}

function insertMilkdownTable() {
  const tableMarkdown = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |`;
  
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(tableMarkdown);
    range.insertNode(textNode);
  }
}

function insertMilkdownCodeBlock() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const selectedText = selection.toString();
    insertMilkdownFormat('```\n', `\n${selectedText}\n\`\`\``);
  }
}

// 图片粘贴处理
async function onTextareaPaste(event: ClipboardEvent) {
  const handled = await handlePasteWithImages(event);
  if (!handled) {
    return; // 让默认的粘贴行为继续
  }
}

async function handlePasteWithImages(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return false;
  
  const items = Array.from(clipboardData.items);
  const imageItems = items.filter(item => item.type.startsWith('image/'));
  
  if (imageItems.length === 0) return false;
  
  event.preventDefault();
  
  try {
    const imagePromises = imageItems.map(item => {
      const file = item.getAsFile();
      if (file) {
        return handleImagePaste(file);
      }
      return Promise.resolve('');
    });
    
    const imageRefs = await Promise.all(imagePromises);
    const imageText = imageRefs.filter(ref => ref).join('\n\n');
    
    if (editorMode.value === 'source' && textareaRef.value) {
      const textarea = textareaRef.value;
      const { selectionStart } = textarea;
      const beforeCursor = content.value.substring(0, selectionStart);
      const afterCursor = content.value.substring(selectionStart);
      
      content.value = beforeCursor + imageText + afterCursor;
      
      nextTick(() => {
        textarea.setSelectionRange(selectionStart + imageText.length, selectionStart + imageText.length);
        textarea.focus();
      });
    } else if (editorMode.value === 'wysiwyg') {
      // 在WYSIWYG模式下插入图片
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(imageText);
        range.insertNode(textNode);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to handle image paste:', error);
    return false;
  }
}

// Obsidian式图片处理
async function handleImagePaste(file: File): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.type.split('/')[1] || 'png';
    const fileName = `${timestamp}_${random}.${extension}`;
    
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    await window.electronAPI.fs.saveImage(base64Data, fileName);
    console.log('图片已保存:', fileName);
    
    return `![[${fileName}]]`;
  } catch (error) {
    console.error('保存图片失败:', error);
    throw error;
  }
}

// 图片引用转换
function processContentForDisplay(content: string): string {
  return content.replace(/!\[\[([^\]]+)\]\]/g, (match, fileName) => {
    return `![${fileName}](attachments/${fileName})`;
  });
}

function convertImageRefsFromMarkdown(markdown: string): string {
  // 对于Obsidian式引用，不需要特殊处理，直接返回
  return markdown;
}

// 生命周期钩子
onMounted(() => {
  // 默认启动WYSIWYG模式
  if (editorMode.value === 'wysiwyg') {
    nextTick(() => {
      initMilkdownEditor();
    });
  }
});

onUnmounted(() => {
  // 清理Milkdown编辑器
  if (milkdownEditor) {
    milkdownEditor.destroy();
    milkdownEditor = null;
  }
});



</script>

<style scoped>
/* 主容器 */
.markdown-editor {
  @apply bg-white dark:bg-dark-900;
}

/* 工具栏样式 */
.editor-toolbar {
  @apply bg-gray-50 dark:bg-dark-800;
}

.mode-btn {
  @apply px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-dark-600 rounded-md transition-colors duration-200;
  @apply flex items-center space-x-2;
}

.mode-btn-active {
  @apply bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
  @apply shadow-sm;
}

.toolbar-btn {
  @apply p-2 rounded hover:bg-gray-200 dark:hover:bg-dark-700;
  @apply text-gray-600 dark:text-gray-400;
  @apply transition-colors duration-200;
}

.toolbar-btn:hover {
  @apply text-gray-800 dark:text-gray-200;
}

/* Milkdown 容器 */
.milkdown-container {
  @apply bg-white dark:bg-dark-900 overflow-y-auto;
}

/* 源码编辑器 */
.source-editor {
  @apply bg-white dark:bg-dark-900;
}

.source-textarea {
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
  @apply font-mono leading-6 select-none;
}

.line-number {
  @apply h-6;
}

/* 预览容器 */
.preview-container {
  @apply bg-white dark:bg-dark-900;
}

/* Prose 样式 */
.prose {
  @apply text-gray-900 dark:text-gray-100;
  font-size: 16px;
  line-height: 1.75;
}

.prose h1 {
  @apply text-gray-900 dark:text-gray-100;
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 0.5rem;
}

.prose h2 {
  @apply text-gray-900 dark:text-gray-100;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

.dark .prose h1 {
  border-bottom-color: #60a5fa;
}

.dark .prose h2 {
  border-bottom-color: #4b5563;
}

.prose h3, .prose h4, .prose h5, .prose h6 {
  @apply text-gray-900 dark:text-gray-100;
}

.prose p {
  @apply text-gray-700 dark:text-gray-300;
}

.prose code {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm;
}

.prose pre {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .prose pre {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.prose pre code {
  @apply bg-transparent p-0;
}

.prose blockquote {
  @apply border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400;
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 0.375rem;
  padding: 1rem;
}

.dark .prose blockquote {
  background-color: rgba(59, 130, 246, 0.1);
}

.prose ul, .prose ol {
  @apply text-gray-700 dark:text-gray-300;
}

.prose a {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.prose table {
  @apply border-collapse border border-gray-300 dark:border-gray-600;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.dark .prose table {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.prose th, .prose td {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2;
}

.prose th {
  @apply bg-gray-100 dark:bg-gray-700 font-semibold;
}

.prose img {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.prose img:hover {
  transform: scale(1.02);
}

/* Milkdown 深层样式 */
:deep(.milkdown) {
  @apply bg-transparent text-gray-900 dark:text-gray-100;
  height: 100%;
  outline: none;
  border: none;
}

:deep(.milkdown .editor) {
  @apply bg-transparent;
  height: 100%;
  outline: none;
}

:deep(.milkdown .ProseMirror) {
  @apply bg-transparent text-gray-900 dark:text-gray-100;
  height: 100%;
  outline: none;
  border: none;
  min-height: 100%;
}

:deep(.milkdown h1) {
  @apply text-gray-900 dark:text-gray-100;
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 0.5rem;
}

:deep(.milkdown h2) {
  @apply text-gray-900 dark:text-gray-100;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

:deep(.dark .milkdown h1) {
  border-bottom-color: #60a5fa;
}

:deep(.dark .milkdown h2) {
  border-bottom-color: #4b5563;
}

:deep(.milkdown h3),
:deep(.milkdown h4),
:deep(.milkdown h5),
:deep(.milkdown h6) {
  @apply text-gray-900 dark:text-gray-100;
}

:deep(.milkdown p) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.milkdown code) {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm;
}

:deep(.milkdown pre) {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(.dark .milkdown pre) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

:deep(.milkdown blockquote) {
  @apply border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400;
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 0.375rem;
  padding: 1rem;
}

:deep(.dark .milkdown blockquote) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.milkdown ul),
:deep(.milkdown ol) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.milkdown a) {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

:deep(.milkdown table) {
  @apply border-collapse border border-gray-300 dark:border-gray-600;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.dark .milkdown table) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

:deep(.milkdown th),
:deep(.milkdown td) {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2;
}

:deep(.milkdown th) {
  @apply bg-gray-100 dark:bg-gray-700 font-semibold;
}

:deep(.milkdown img) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

:deep(.milkdown img:hover) {
  transform: scale(1.02);
}

/* 滚动条样式 */
.milkdown-container::-webkit-scrollbar,
.preview-container::-webkit-scrollbar,
.source-editor::-webkit-scrollbar {
  width: 8px;
}

.milkdown-container::-webkit-scrollbar-track,
.preview-container::-webkit-scrollbar-track,
.source-editor::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.milkdown-container::-webkit-scrollbar-thumb,
.preview-container::-webkit-scrollbar-thumb,
.source-editor::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-500 rounded-full;
}

.milkdown-container::-webkit-scrollbar-thumb:hover,
.preview-container::-webkit-scrollbar-thumb:hover,
.source-editor::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-400;
}
</style>
