<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <EditorToolbar
      v-if="showToolbar"
      @command="handleCommand"
      :can-undo="canUndo"
      :can-redo="canRedo"
    />

    <!-- CodeMirror 编辑器容器 -->
    <div class="editor-container">
      <div ref="editorRef" class="codemirror-wrapper"></div>
    </div>

    <!-- 状态栏 -->
    <div class="editor-statusbar">
      <span class="status-item">{{ t('editor.lines') }}: {{ stats.lines }}</span>
      <span class="status-item">{{ t('editor.words') }}: {{ stats.words }}</span>
      <span class="status-item">{{ t('editor.chars') }}: {{ stats.chars }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EditorView, keymap, ViewUpdate, Decoration, DecorationSet, ViewPlugin, WidgetType } from '@codemirror/view';
import { EditorState, StateEffect, StateField, Range } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, syntaxTree } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import EditorToolbar from './EditorToolbar.vue';
import type { EditorOptions } from '@shared/types/editor';

const props = withDefaults(defineProps<{
  modelValue?: string;
  mode?: 'instant' | 'readonly' | 'wysiwyg';
  showToolbar?: boolean;
  options?: Partial<EditorOptions>;
}>(), {
  modelValue: '',
  mode: 'wysiwyg',
  showToolbar: true,
  options: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'save'): void;
}>();

const { t } = useI18n();

const editorRef = ref<HTMLElement>();
let editorView: EditorView | null = null;

const canUndo = ref(false);
const canRedo = ref(false);
const stats = ref({
  lines: 0,
  words: 0,
  chars: 0,
});

// 自定义 Markdown 样式主题
const markdownTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: 'var(--theme-font-sans)',
    color: 'var(--theme-text)',
    backgroundColor: 'var(--theme-background)',
  },
  '.cm-content': {
    padding: '1.5rem',
    caretColor: 'var(--theme-primary)',
    minHeight: '100%',
  },
  '.cm-line': {
    lineHeight: '1.8',
    padding: '0.2rem 0',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--theme-primary)',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--theme-primary)',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--theme-background-secondary)',
  },
  '.cm-gutters': {
    display: 'none',
  },
  // Markdown 样式增强
  '.cm-md-header1': {
    fontSize: '2em',
    fontWeight: '700',
    lineHeight: '1.4',
    color: 'var(--theme-heading)',
  },
  '.cm-md-header2': {
    fontSize: '1.6em',
    fontWeight: '700',
    lineHeight: '1.4',
    color: 'var(--theme-heading)',
  },
  '.cm-md-header3': {
    fontSize: '1.4em',
    fontWeight: '600',
    lineHeight: '1.4',
    color: 'var(--theme-heading)',
  },
  '.cm-md-header4': {
    fontSize: '1.2em',
    fontWeight: '600',
    lineHeight: '1.4',
    color: 'var(--theme-text)',
  },
  '.cm-md-header5': {
    fontSize: '1.1em',
    fontWeight: '600',
    lineHeight: '1.4',
    color: 'var(--theme-text)',
  },
  '.cm-md-header6': {
    fontSize: '1em',
    fontWeight: '600',
    lineHeight: '1.4',
    color: 'var(--theme-text-muted)',
  },
  '.cm-strong': {
    fontWeight: '700',
    color: 'var(--theme-text)',
  },
  '.cm-em': {
    fontStyle: 'italic',
    color: 'var(--theme-text)',
  },
  '.cm-strikethrough': {
    textDecoration: 'line-through',
    color: 'var(--theme-text-muted)',
  },
  '.cm-link': {
    color: 'var(--theme-primary)',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  '.cm-url': {
    color: 'var(--theme-text-muted)',
  },
  '.cm-monospace': {
    fontFamily: 'var(--theme-font-mono)',
    backgroundColor: 'var(--theme-background-secondary)',
    padding: '0.2em 0.4em',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9em',
    color: 'var(--theme-accent)',
  },
  '.cm-quote': {
    color: 'var(--theme-text-secondary)',
    fontStyle: 'italic',
    borderLeft: '4px solid var(--theme-border)',
    paddingLeft: '1rem',
    marginLeft: '0',
  },
  '.cm-list': {
    color: 'var(--theme-text)',
  },
  '.cm-hr': {
    color: 'var(--theme-border)',
  },
});

// 自定义语法高亮
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '2em', fontWeight: '700', color: 'var(--theme-heading)' },
  { tag: tags.heading2, fontSize: '1.6em', fontWeight: '700', color: 'var(--theme-heading)' },
  { tag: tags.heading3, fontSize: '1.4em', fontWeight: '600', color: 'var(--theme-heading)' },
  { tag: tags.heading4, fontSize: '1.2em', fontWeight: '600', color: 'var(--theme-text)' },
  { tag: tags.heading5, fontSize: '1.1em', fontWeight: '600', color: 'var(--theme-text)' },
  { tag: tags.heading6, fontSize: '1em', fontWeight: '600', color: 'var(--theme-text-muted)' },
  { tag: tags.strong, fontWeight: '700', color: 'var(--theme-text)' },
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--theme-text)' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: 'var(--theme-text-muted)' },
  { tag: tags.link, color: 'var(--theme-primary)', textDecoration: 'none' },
  { tag: tags.url, color: 'var(--theme-text-muted)' },
  { tag: tags.monospace, fontFamily: 'var(--theme-font-mono)', backgroundColor: 'var(--theme-background-secondary)', padding: '0.2em 0.4em', borderRadius: 'var(--radius-sm)', fontSize: '0.9em', color: 'var(--theme-accent)' },
  { tag: tags.quote, color: 'var(--theme-text-secondary)', fontStyle: 'italic' },
  { tag: tags.list, color: 'var(--theme-text)' },
  { tag: tags.contentSeparator, color: 'var(--theme-border)' },
]);

// 隐藏 Markdown 语法标记的插件
const hideMarkdownMarks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const { state } = view;
      const cursor = state.selection.main;
      
      // 获取当前光标所在的行
      const currentLine = state.doc.lineAt(cursor.head);

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (node) => {
            const { from, to, type } = node;
            const line = state.doc.lineAt(from);
            
            // 如果光标在这一行，不隐藏标记
            if (line.number === currentLine.number) {
              return;
            }

            const text = state.doc.sliceString(from, to);
            
            // 隐藏标题标记 (#)
            if (type.name === 'HeaderMark') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏粗体标记 (**)
            else if (type.name === 'EmphasisMark' && text.startsWith('**')) {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏斜体标记 (*)
            else if (type.name === 'EmphasisMark' && text === '*') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏删除线标记 (~~)
            else if (type.name === 'StrikethroughMark') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏行内代码标记 (`)
            else if (type.name === 'CodeMark') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏链接标记 ([ ] ( ))
            else if (type.name === 'LinkMark' || type.name === 'URL') {
              if (text === '[' || text === ']' || text === '(' || text === ')') {
                decorations.push(
                  Decoration.mark({
                    class: 'cm-hidden-mark',
                  }).range(from, to)
                );
              }
            }
            
            // 隐藏列表标记 (- 或 1.)
            else if (type.name === 'ListMark') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
            
            // 隐藏引用标记 (>)
            else if (type.name === 'QuoteMark') {
              decorations.push(
                Decoration.mark({
                  class: 'cm-hidden-mark',
                }).range(from, to)
              );
            }
          },
        });
      }

      return Decoration.set(decorations, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// 初始化编辑器
function initEditor() {
  if (!editorRef.value) return;

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      // 基础功能
      history(),
      EditorView.lineWrapping,
      
      // Markdown 支持
      markdown({ base: markdownLanguage }),
      
      // 主题
      markdownTheme,
      syntaxHighlighting(markdownHighlight),
      
      // 隐藏 Markdown 标记（仅在 wysiwyg 模式）
      ...(props.mode === 'wysiwyg' ? [hideMarkdownMarks] : []),
      
      // 按键绑定
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            emit('save');
            return true;
          },
        },
      ]),
      
      // 更新监听
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          emit('update:modelValue', newValue);
          emit('change', newValue);
          updateStats(newValue);
        }
        
        // 更新撤销/重做状态
        canUndo.value = update.view.state.field(history, false) !== undefined;
        canRedo.value = canUndo.value;
      }),
      
      // 只读模式
      ...(props.mode === 'readonly' ? [EditorView.editable.of(false)] : []),
    ],
  });

  editorView = new EditorView({
    state: startState,
    parent: editorRef.value,
  });
  
  // 初始化统计
  updateStats(props.modelValue);
}

// 更新统计信息
function updateStats(text: string) {
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  
  stats.value = { lines, words, chars };
}

// 处理工具栏命令
function handleCommand(command: string) {
  if (!editorView) return;
  
  const view = editorView;
  const state = view.state;
  const selection = state.selection.main;
  const selectedText = state.doc.sliceString(selection.from, selection.to);
  
  let replacement = '';
  let newCursorPos = selection.from;
  
  switch (command) {
    case 'bold':
      replacement = selectedText ? `**${selectedText}**` : '**粗体**';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 4 : 2);
      break;
      
    case 'italic':
      replacement = selectedText ? `*${selectedText}*` : '*斜体*';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 2 : 1);
      break;
      
    case 'strikethrough':
      replacement = selectedText ? `~~${selectedText}~~` : '~~删除线~~';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 4 : 2);
      break;
      
    case 'code':
      replacement = selectedText ? `\`${selectedText}\`` : '`代码`';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 2 : 1);
      break;
      
    case 'code-block':
      replacement = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '```\n代码块\n```';
      newCursorPos = selection.from + 4;
      break;
      
    case 'link':
      replacement = selectedText ? `[${selectedText}](url)` : '[链接](url)';
      newCursorPos = selection.from + replacement.length - 4;
      break;
      
    case 'image':
      replacement = selectedText ? `![${selectedText}](url)` : '![图片](url)';
      newCursorPos = selection.from + replacement.length - 4;
      break;
      
    case 'heading-1':
      replacement = selectedText ? `# ${selectedText}` : '# 一级标题';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 2 : 2);
      break;
      
    case 'heading-2':
      replacement = selectedText ? `## ${selectedText}` : '## 二级标题';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 3 : 3);
      break;
      
    case 'heading-3':
      replacement = selectedText ? `### ${selectedText}` : '### 三级标题';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 4 : 4);
      break;
      
    case 'quote':
      replacement = selectedText ? `> ${selectedText}` : '> 引用';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 2 : 2);
      break;
      
    case 'unordered-list':
      replacement = selectedText ? `- ${selectedText}` : '- 列表项';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 2 : 2);
      break;
      
    case 'ordered-list':
      replacement = selectedText ? `1. ${selectedText}` : '1. 列表项';
      newCursorPos = selection.from + (selectedText ? selectedText.length + 3 : 3);
      break;
      
    case 'hr':
      replacement = '\n---\n';
      newCursorPos = selection.from + replacement.length;
      break;
      
    case 'table':
      replacement = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n';
      newCursorPos = selection.from + 2;
      break;
  }
  
  if (replacement) {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: replacement,
      },
      selection: { anchor: newCursorPos },
    });
    view.focus();
  }
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue,
      },
    });
  }
});

// 监听模式变化
watch(() => props.mode, (newMode) => {
  if (editorView) {
    editorView.dispatch({
      effects: StateEffect.reconfigure.of(
        newMode === 'readonly' ? [EditorView.editable.of(false)] : []
      ),
    });
  }
});

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
});
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--theme-background);
}

.editor-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.codemirror-wrapper {
  height: 100%;
  overflow: auto;
}

.codemirror-wrapper :deep(.cm-editor) {
  height: 100%;
  outline: none;
}

.codemirror-wrapper :deep(.cm-scroller) {
  overflow: auto;
  font-family: inherit;
}

/* 状态栏 */
.editor-statusbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background: var(--theme-background-secondary);
  border-top: 1px solid var(--theme-border);
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.status-item {
  white-space: nowrap;
}

/* 隐藏 Markdown 语法标记 */
.codemirror-wrapper :deep(.cm-hidden-mark) {
  font-size: 0;
  opacity: 0;
  display: inline-block;
  width: 0;
  overflow: hidden;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .codemirror-wrapper :deep(.cm-activeLine) {
    background: var(--theme-background-secondary);
  }
}
</style>
