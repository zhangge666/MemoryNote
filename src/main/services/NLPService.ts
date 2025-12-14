/**
 * NLP 服务
 * 阶段 12: NLP 与 LLM 系统
 * 
 * 提供文本向量化和语义搜索功能
 * 当前使用简单的 TF-IDF 实现，后续可替换为更复杂的向量数据库
 */

import type {
  VectorSearchResult,
  VectorIndexStatus,
  INLPService,
} from '../../shared/types/ai';
import type { Note } from '../../shared/types/note';
import { DatabaseManager } from '../database/DatabaseManager';
import { FileSystemService } from './FileSystemService';

/**
 * 简单的文本向量化实现（TF-IDF 风格）
 * 后续可替换为 OpenAI embeddings 或本地模型
 */
class SimpleVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private vocabIndex = 0;

  /**
   * 分词
   */
  tokenize(text: string): string[] {
    // 简单分词：中文按字符，英文按空格
    const tokens: string[] = [];
    
    // 移除 Markdown 标记
    const cleanText = text
      .replace(/[#*_`\[\]()]/g, ' ')
      .replace(/\n/g, ' ')
      .toLowerCase();
    
    // 中文字符
    const chinesePattern = /[\u4e00-\u9fa5]/g;
    const chineseChars = cleanText.match(chinesePattern) || [];
    tokens.push(...chineseChars);
    
    // 英文单词
    const englishText = cleanText.replace(chinesePattern, ' ');
    const englishWords = englishText.split(/\s+/).filter(w => w.length > 1);
    tokens.push(...englishWords);
    
    return tokens;
  }

  /**
   * 更新词汇表
   */
  updateVocabulary(tokens: string[]): void {
    for (const token of tokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabIndex++);
      }
    }
  }

  /**
   * 计算 TF 向量
   */
  computeTF(tokens: string[]): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    const tokenCount = tokens.length;
    
    for (const token of tokens) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        vector[idx] += 1 / tokenCount;
      }
    }
    
    return vector;
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }

  /**
   * 重置词汇表
   */
  reset(): void {
    this.vocabulary.clear();
    this.idf.clear();
    this.vocabIndex = 0;
  }
}

/**
 * 文档索引项
 */
interface IndexedDocument {
  noteId: string;
  title: string;
  content: string;
  vector: number[];
  tokens: string[];
  updatedAt: number;
}

/**
 * NLP 服务实现
 */
export class NLPService implements INLPService {
  private static instance: NLPService | null = null;
  
  private dbManager: DatabaseManager;
  private fsService: FileSystemService;
  private vectorizer: SimpleVectorizer;
  private index: Map<string, IndexedDocument> = new Map();
  private isBuilding = false;
  private lastUpdated = 0;

  constructor(dbManager: DatabaseManager, fsService: FileSystemService) {
    this.dbManager = dbManager;
    this.fsService = fsService;
    this.vectorizer = new SimpleVectorizer();
  }

  /**
   * 获取单例实例
   */
  static getInstance(dbManager?: DatabaseManager, fsService?: FileSystemService): NLPService {
    if (!NLPService.instance) {
      if (!dbManager || !fsService) {
        throw new Error('NLPService requires DatabaseManager and FileSystemService for initialization');
      }
      NLPService.instance = new NLPService(dbManager, fsService);
    }
    return NLPService.instance;
  }

  /**
   * 重置实例
   */
  static resetInstance(): void {
    NLPService.instance = null;
  }

  /**
   * 向量化文本
   */
  async vectorize(text: string): Promise<number[]> {
    const tokens = this.vectorizer.tokenize(text);
    this.vectorizer.updateVocabulary(tokens);
    return this.vectorizer.computeTF(tokens);
  }

  /**
   * 语义搜索
   */
  async semanticSearch(query: string, limit = 10): Promise<VectorSearchResult[]> {
    console.log('[NLPService] Semantic search:', query);
    
    // 如果索引为空，先构建
    if (this.index.size === 0) {
      await this.rebuildIndex();
    }
    
    // 向量化查询
    const queryTokens = this.vectorizer.tokenize(query);
    const queryVector = this.vectorizer.computeTF(queryTokens);
    
    // 计算相似度
    const results: Array<{ noteId: string; similarity: number; doc: IndexedDocument }> = [];
    
    for (const [noteId, doc] of this.index) {
      const similarity = this.vectorizer.cosineSimilarity(queryVector, doc.vector);
      if (similarity > 0.01) { // 阈值过滤
        results.push({ noteId, similarity, doc });
      }
    }
    
    // 排序
    results.sort((a, b) => b.similarity - a.similarity);
    
    // 获取笔记详情并返回结果
    const searchResults: VectorSearchResult[] = [];
    
    for (const result of results.slice(0, limit)) {
      try {
        const note = await this.getNoteById(result.noteId);
        if (note) {
          // 生成摘要
          const excerpt = this.generateExcerpt(result.doc.content, query);
          searchResults.push({
            note,
            similarity: result.similarity,
            excerpt,
          });
        }
      } catch (error) {
        console.error(`[NLPService] Failed to get note ${result.noteId}:`, error);
      }
    }
    
    console.log(`[NLPService] Found ${searchResults.length} results`);
    return searchResults;
  }

  /**
   * 添加文档到索引
   */
  async addToIndex(noteId: string, content: string): Promise<void> {
    console.log(`[NLPService] Adding to index: ${noteId}`);
    
    try {
      const note = await this.getNoteById(noteId);
      const title = note?.title || '';
      const fullContent = `${title} ${content}`;
      
      const tokens = this.vectorizer.tokenize(fullContent);
      this.vectorizer.updateVocabulary(tokens);
      const vector = this.vectorizer.computeTF(tokens);
      
      this.index.set(noteId, {
        noteId,
        title,
        content,
        vector,
        tokens,
        updatedAt: Date.now(),
      });
      
      this.lastUpdated = Date.now();
    } catch (error) {
      console.error(`[NLPService] Failed to add to index:`, error);
    }
  }

  /**
   * 从索引中移除文档
   */
  async removeFromIndex(noteId: string): Promise<void> {
    console.log(`[NLPService] Removing from index: ${noteId}`);
    this.index.delete(noteId);
    this.lastUpdated = Date.now();
  }

  /**
   * 重建索引
   */
  async rebuildIndex(): Promise<void> {
    if (this.isBuilding) {
      console.log('[NLPService] Index rebuild already in progress');
      return;
    }
    
    console.log('[NLPService] Rebuilding index...');
    this.isBuilding = true;
    
    try {
      // 清空现有索引
      this.index.clear();
      this.vectorizer.reset();
      
      // 获取所有笔记
      const notes = await this.getAllNotes();
      console.log(`[NLPService] Found ${notes.length} notes to index`);
      
      // 第一遍：收集所有 token 更新词汇表
      const noteContents: Array<{ note: Note; content: string; tokens: string[] }> = [];
      
      for (const note of notes) {
        try {
          const content = await this.fsService.readNote(note.filePath);
          const fullContent = `${note.title} ${content}`;
          const tokens = this.vectorizer.tokenize(fullContent);
          this.vectorizer.updateVocabulary(tokens);
          noteContents.push({ note, content, tokens });
        } catch (error) {
          console.error(`[NLPService] Failed to read note ${note.id}:`, error);
        }
      }
      
      // 第二遍：生成向量
      for (const { note, content, tokens } of noteContents) {
        const vector = this.vectorizer.computeTF(tokens);
        this.index.set(note.id, {
          noteId: note.id,
          title: note.title,
          content,
          vector,
          tokens,
          updatedAt: Date.now(),
        });
      }
      
      this.lastUpdated = Date.now();
      console.log(`[NLPService] Index rebuilt: ${this.index.size} documents`);
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * 获取索引状态
   */
  async getIndexStatus(): Promise<VectorIndexStatus> {
    const totalNotes = await this.getNoteCount();
    return {
      totalDocuments: totalNotes,
      indexedDocuments: this.index.size,
      lastUpdated: this.lastUpdated,
      isBuilding: this.isBuilding,
    };
  }

  /**
   * 生成摘要
   */
  private generateExcerpt(content: string, query: string): string {
    const queryTokens = new Set(this.vectorizer.tokenize(query));
    const lines = content.split('\n').filter(l => l.trim());
    
    // 找到包含查询词最多的行
    let bestLine = lines[0] || '';
    let bestScore = 0;
    
    for (const line of lines) {
      const lineTokens = this.vectorizer.tokenize(line);
      let score = 0;
      for (const token of lineTokens) {
        if (queryTokens.has(token)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }
    
    // 截断
    if (bestLine.length > 200) {
      bestLine = bestLine.substring(0, 200) + '...';
    }
    
    return bestLine;
  }

  /**
   * 获取所有笔记
   */
  private async getAllNotes(): Promise<Note[]> {
    try {
      const rows = await this.dbManager.query<any>(`
        SELECT * FROM notes 
        WHERE deleted_at IS NULL 
        ORDER BY updated_at DESC
      `);
      return rows.map(this.rowToNote);
    } catch (error) {
      console.error('[NLPService] Failed to get notes:', error);
      return [];
    }
  }

  /**
   * 获取笔记数量
   */
  private async getNoteCount(): Promise<number> {
    try {
      const result = await this.dbManager.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL'
      );
      return result?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 根据 ID 获取笔记
   */
  private async getNoteById(noteId: string): Promise<Note | null> {
    try {
      const row = await this.dbManager.queryOne<any>(
        'SELECT * FROM notes WHERE id = ?',
        [noteId]
      );
      return row ? this.rowToNote(row) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 数据库行转笔记对象
   */
  private rowToNote(row: any): Note {
    return {
      id: row.id,
      title: row.title,
      filePath: row.file_path,
      folderId: row.folder_id,
      excerpt: row.excerpt,
      wordCount: row.word_count || 0,
      isPinned: row.is_pinned === 1,
      isArchived: row.is_archived === 1,
      isFavorite: row.is_favorite === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      accessedAt: row.accessed_at,
      tags: [],
    };
  }
}
