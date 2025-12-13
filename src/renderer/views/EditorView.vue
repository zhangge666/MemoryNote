<template>
  <div class="editor-view">
    <MarkdownEditor
      v-model="content"
      :mode="mode"
      :show-toolbar="true"
      @change="handleChange"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useTabStore } from '@renderer/stores/tab';
import { useReviewStore, type PendingCard } from '@renderer/stores/review';
import { noteService } from '@renderer/services/NoteService';
import MarkdownEditor from '@renderer/components/editor/MarkdownEditor.vue';
import type { Tab } from '@shared/types/tab';

const props = defineProps<{
  tab: Tab;
}>();

const tabStore = useTabStore();
const reviewStore = useReviewStore();
const content = ref(props.tab.data?.content || '');
const originalContent = ref(props.tab.data?.content || ''); // 保存原始内容用于比较
const mode = ref<'instant' | 'readonly' | 'wysiwyg'>('wysiwyg');

// 使用计算属性获取实时的tab数据
const currentTab = computed(() => tabStore.findTabById(props.tab.id));

// 监听标签数据变化（深度监听）
watch(() => currentTab.value?.data?.content, (newContent) => {
  if (newContent !== undefined && newContent !== content.value) {
    console.log('📝 Content synced from other tab:', newContent.substring(0, 50));
    content.value = newContent;
  }
}, { deep: true });

// 监听内容变化，检查是否与原始内容相同
watch(content, (newContent) => {
  const isDirty = newContent !== originalContent.value;
  tabStore.setTabDirty(props.tab.id, isDirty);
  
  if (isDirty) {
    console.log('📝 Content is dirty');
  } else {
    console.log('✅ Content restored to original state');
  }
});

function handleChange(newContent: string) {
  content.value = newContent;
  
  // 使用TabStore的updateTabContent方法同步到所有相同笔记的标签
  // 这会触发响应式更新
  tabStore.updateTabContent(props.tab.id, newContent);
  
  // 自动保存逻辑
  // TODO: 实现自动保存到文件系统（可以加个防抖）
  console.log('Content changed, will sync to other tabs...');
}

async function handleSave() {
  if (!props.tab.data?.noteId) {
    console.warn('No noteId found, cannot save');
    return;
  }

  const noteId = props.tab.data.noteId;
  const noteTitle = props.tab.title;
  const oldContent = originalContent.value;
  const newContent = content.value;

  try {
    console.log('💾 Saving note:', noteId);
    
    // 保存到文件系统和数据库
    await noteService.updateNote({
      id: noteId,
      content: newContent,
    });
    
    // 更新原始内容为当前内容
    originalContent.value = newContent;
    
    // 清除修改标记
    tabStore.setTabDirty(props.tab.id, false);
    
    console.log('✅ Note saved successfully');
    
    // 检查是否需要生成复习卡片
    if (oldContent !== newContent) {
      await generateReviewCards(noteId, noteTitle, oldContent, newContent);
    }
  } catch (error) {
    console.error('❌ Failed to save note:', error);
    // TODO: 显示错误通知
  }
}

/**
 * 生成复习卡片
 */
async function generateReviewCards(
  noteId: string, 
  noteTitle: string,
  oldContent: string, 
  newContent: string
) {
  try {
    // 获取复习配置
    const reviewConfig = await window.ipc.config.get('review');
    const autoGenerate = reviewConfig?.autoGenerateCards ?? true;
    
    if (autoGenerate) {
      // 自动模式：调用 generateCardsFromDiff 直接保存到数据库
      const cards = await reviewStore.generateCardsFromDiff(noteId, oldContent, newContent);
      
      if (cards.length > 0) {
        console.log(`✅ Auto-saved ${cards.length} review cards to database`);
      } else {
        console.log('📝 No changes detected for review cards');
      }
    } else {
      // 手动模式：创建待审核卡片（不保存到数据库）
      // 简化处理：为内容变更创建一个待审核卡片
      const pendingCards: PendingCard[] = [];
      
      // 简单的 diff 检测：如果内容有变化，创建一个变更卡片
      if (newContent.length > oldContent.length) {
        // 有新增内容
        const addedContent = getAddedContent(oldContent, newContent);
        if (addedContent.trim()) {
          pendingCards.push({
            id: `pending-${noteId}-${Date.now()}-0`,
            noteId: noteId,
            noteTitle: noteTitle,
            content: addedContent.slice(0, 200) + (addedContent.length > 200 ? '...' : ''),
            type: 'added',
            metadata: {},
          });
        }
      } else if (newContent !== oldContent) {
        // 内容修改
        const modifiedContent = getModifiedContent(oldContent, newContent);
        if (modifiedContent.trim()) {
          pendingCards.push({
            id: `pending-${noteId}-${Date.now()}-0`,
            noteId: noteId,
            noteTitle: noteTitle,
            content: modifiedContent.slice(0, 200) + (modifiedContent.length > 200 ? '...' : ''),
            type: 'modified',
            metadata: {},
          });
        }
      }
      
      if (pendingCards.length > 0) {
        reviewStore.addPendingCards(pendingCards);
        console.log(`⏳ Added ${pendingCards.length} cards to pending review`);
      } else {
        console.log('📝 No significant changes for review cards');
      }
    }
  } catch (error) {
    console.error('❌ Failed to generate review cards:', error);
  }
}

/**
 * 获取新增的内容
 */
function getAddedContent(oldContent: string, newContent: string): string {
  // 简化实现：找出新内容中比旧内容多的部分
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const addedLines: string[] = [];
  for (const line of newLines) {
    if (!oldLines.includes(line) && line.trim()) {
      addedLines.push(line);
    }
  }
  
  return addedLines.join('\n');
}

/**
 * 获取修改的内容
 */
function getModifiedContent(oldContent: string, newContent: string): string {
  // 简化实现：返回新内容的摘要
  const lines = newContent.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    return lines.slice(0, 3).join('\n');
  }
  return newContent.slice(0, 200);
}
</script>

<style scoped>
.editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

