import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Note, Tag } from '../database/DatabaseManager';

export const useNotesStore = defineStore('notes', () => {
  // 状态
  const notes = ref<Note[]>([]);
  const tags = ref<Tag[]>([]);
  const currentNote = ref<Note | null>(null);
  const searchQuery = ref('');
  const selectedCategory = ref<string>('');
  const selectedTags = ref<string[]>([]);
  const isLoading = ref(false);

  // 计算属性
  const filteredNotes = computed(() => {
    let filtered = notes.value;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        (note.tags && note.tags.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory.value) {
      filtered = filtered.filter(note => note.category === selectedCategory.value);
    }

    // 标签过滤
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(note => {
        if (!note.tags) return false;
        const noteTags = note.tags.split(',').map(tag => tag.trim());
        return selectedTags.value.some(tag => noteTags.includes(tag));
      });
    }

    return filtered;
  });

  const categories = computed(() => {
    const cats = new Set<string>();
    notes.value.forEach(note => {
      if (note.category) {
        cats.add(note.category);
      }
    });
    return Array.from(cats);
  });

  const recentNotes = computed(() => {
    return notes.value
      .slice()
      .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
      .slice(0, 10);
  });

  // 方法
  async function loadNotes() {
    try {
      isLoading.value = true;
      notes.value = await window.electronAPI.notes.getAll();
    } catch (error) {
      console.error('加载笔记失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadTags() {
    try {
      tags.value = await window.electronAPI.tags.getAll();
    } catch (error) {
      console.error('加载标签失败:', error);
      throw error;
    }
  }

  async function createNote(noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const newNote = await window.electronAPI.notes.create(noteData);
      notes.value.unshift(newNote);
      return newNote;
    } catch (error) {
      console.error('创建笔记失败:', error);
      throw error;
    }
  }

  async function updateNote(id: number, updates: Partial<Note>) {
    try {
      const updatedNote = await window.electronAPI.notes.update(id, updates);
      if (updatedNote) {
        const index = notes.value.findIndex(note => note.id === id);
        if (index > -1) {
          notes.value[index] = updatedNote;
        }
        
        // 更新当前笔记
        if (currentNote.value?.id === id) {
          currentNote.value = updatedNote;
        }
      }
      return updatedNote;
    } catch (error) {
      console.error('更新笔记失败:', error);
      throw error;
    }
  }

  async function deleteNote(id: number) {
    try {
      const success = await window.electronAPI.notes.delete(id);
      if (success) {
        const index = notes.value.findIndex(note => note.id === id);
        if (index > -1) {
          notes.value.splice(index, 1);
        }
        
        // 如果删除的是当前笔记，清空当前笔记
        if (currentNote.value?.id === id) {
          currentNote.value = null;
        }
      }
      return success;
    } catch (error) {
      console.error('删除笔记失败:', error);
      throw error;
    }
  }

  async function searchNotes(query: string) {
    try {
      isLoading.value = true;
      const results = await window.electronAPI.notes.search(query);
      return results;
    } catch (error) {
      console.error('搜索笔记失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadNoteById(id: number) {
    try {
      const note = await window.electronAPI.notes.getById(id);
      if (note) {
        currentNote.value = note;
      }
      return note;
    } catch (error) {
      console.error('加载笔记失败:', error);
      throw error;
    }
  }

  async function createTag(tagData: Omit<Tag, 'id' | 'created_at'>) {
    try {
      const newTag = await window.electronAPI.tags.create(tagData);
      tags.value.push(newTag);
      return newTag;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  }

  function setCurrentNote(note: Note | null) {
    currentNote.value = note;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setSelectedCategory(category: string) {
    selectedCategory.value = category;
  }

  function setSelectedTags(tagList: string[]) {
    selectedTags.value = tagList;
  }

  function clearFilters() {
    searchQuery.value = '';
    selectedCategory.value = '';
    selectedTags.value = [];
  }

  return {
    // 状态
    notes,
    tags,
    currentNote,
    searchQuery,
    selectedCategory,
    selectedTags,
    isLoading,
    
    // 计算属性
    filteredNotes,
    categories,
    recentNotes,
    
    // 方法
    loadNotes,
    loadTags,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    loadNoteById,
    createTag,
    setCurrentNote,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTags,
    clearFilters,
  };
});
