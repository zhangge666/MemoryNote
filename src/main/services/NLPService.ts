/**
 * NLP 服务
 * 阶段 12: NLP 与 LLM 系统
 * 
 * 提供文本向量化和语义搜索功能
 * 使用 Embedding + VectorStore 架构
 */

import * as path from 'path';
import type {
  VectorSearchResult,
  VectorIndexStatus,
  INLPService,
  EmbeddingConfig,
  IEmbeddingProvider,
} from '../../shared/types/ai';
import { DEFAULT_AI_CONFIG, EMBEDDING_PROVIDER_DEFAULTS } from '../../shared/types/ai';
import type { Note } from '../../shared/types/note';
import { DatabaseManager } from '../database/DatabaseManager';
import { FileSystemService } from './FileSystemService';
import { SimpleVectorStore, type VectorMetadata } from './SimpleVectorStore';
import { createEmbeddingProvider } from './embedding';
import { ConfigService } from './ConfigService';

/**
 * NLP 服务实现
 */
export class NLPService implements INLPService {
  private static instance: NLPService | null = null;
  
  private dbManager: DatabaseManager;
  private fsService: FileSystemService;
  private embeddingProvider: IEmbeddingProvider | null = null;
  private vectorStore: SimpleVectorStore | null = null;
  private embeddingConfig: EmbeddingConfig;
  private isBuilding = false;
  private lastUpdated = 0;
  private workspacePath: string = '';

  constructor(dbManager: DatabaseManager, fsService: FileSystemService) {
    this.dbManager = dbManager;
    this.fsService = fsService;
    this.embeddingConfig = { ...DEFAULT_AI_CONFIG.nlp.embedding };
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
    if (NLPService.instance) {
      NLPService.instance.dispose();
    }
    NLPService.instance = null;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 初始化向量存储
      await this.initVectorStore();
      
      console.log('[NLPService] Initialized with provider:', this.embeddingConfig.provider);
    } catch (error) {
      console.error('[NLPService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const configService = ConfigService.getInstance();
      const appConfig = await configService.get('app');
      this.workspacePath = appConfig?.workspace || '';
      
      const aiConfig = await configService.get('ai');
      if (aiConfig?.nlp?.embedding) {
        this.embeddingConfig = { ...this.embeddingConfig, ...aiConfig.nlp.embedding };
      }
    } catch (error) {
      console.warn('[NLPService] Failed to load config, using defaults:', error);
    }
  }

  /**
   * 初始化向量存储
   */
  private async initVectorStore(): Promise<void> {
    const indexPath = path.join(
      this.workspacePath || '.',
      '.memorynote',
      'vector-index'
    );

    this.vectorStore = new SimpleVectorStore({
      indexPath,
      dimensions: this.embeddingConfig.dimensions || 384,
    });

    await this.vectorStore.initialize();
  }

  /**
   * 初始化 Embedding 提供商
   */
  private async initEmbeddingProvider(): Promise<void> {
    if (this.embeddingProvider) {
      return;
    }
    
    this.embeddingProvider = await createEmbeddingProvider(this.embeddingConfig);
  }

  /**
   * 向量化文本
   */
  async vectorize(text: string): Promise<number[]> {
    if (!this.embeddingProvider) {
      await this.initEmbeddingProvider();
    }

    const result = await this.embeddingProvider!.embed(text);
    return result.embedding;
  }

  /**
   * 语义搜索
   */
  async semanticSearch(query: string, limit = 10): Promise<VectorSearchResult[]> {
    console.log('[NLPService] Semantic search:', query);
    
    if (!this.embeddingProvider || !this.vectorStore) {
      await this.initialize();
      await this.initEmbeddingProvider();
    }

    try {
      // 向量化查询
      const queryResult = await this.embeddingProvider!.embed(query);
      const queryVector = queryResult.embedding;
      
      // 向量搜索
      const results = await this.vectorStore!.search(queryVector, limit * 2); // 多取一些以便去重
      
      // 去重（同一笔记可能有多个 chunk）
      const noteIds = new Set<string>();
      const searchResults: VectorSearchResult[] = [];
      
      for (const result of results) {
        const noteId = result.metadata.noteId;
        
        // 跳过已处理的笔记
        if (noteIds.has(noteId)) continue;
        noteIds.add(noteId);
        
        // 获取笔记详情
        const note = await this.getNoteById(noteId);
        if (!note) continue;
        
        // 生成摘要
        const content = await this.fsService.readNote(note.filePath).catch(() => '');
        const excerpt = this.generateExcerpt(content, query);
        
        searchResults.push({
          note,
          similarity: result.score,
          excerpt,
        });
        
        if (searchResults.length >= limit) break;
      }
      
      console.log(`[NLPService] Found ${searchResults.length} results`);
      return searchResults;
    } catch (error) {
      console.error('[NLPService] Semantic search failed:', error);
      return [];
    }
  }

  /**
   * 添加文档到索引
   */
  async addToIndex(noteId: string, content: string): Promise<void> {
    console.log(`[NLPService] Adding to index: ${noteId}`);
    
    if (!this.embeddingProvider || !this.vectorStore) {
      await this.initialize();
      await this.initEmbeddingProvider();
    }

    try {
      const note = await this.getNoteById(noteId);
      const title = note?.title || '';
      const fullContent = `${title}\n${content}`;
      
      // 向量化
      const result = await this.embeddingProvider!.embed(fullContent);
      
      // 添加到向量存储
      const metadata: VectorMetadata = {
        noteId,
        title,
        updatedAt: Date.now(),
      };
      
      await this.vectorStore!.add(noteId, result.embedding, metadata);
      this.lastUpdated = Date.now();
    } catch (error) {
      console.error(`[NLPService] Failed to add to index:`, error);
      throw error;
    }
  }

  /**
   * 从索引中移除文档
   */
  async removeFromIndex(noteId: string): Promise<void> {
    console.log(`[NLPService] Removing from index: ${noteId}`);
    
    if (!this.vectorStore) {
      return;
    }

    await this.vectorStore.deleteByNoteId(noteId);
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
      if (!this.embeddingProvider || !this.vectorStore) {
        await this.initialize();
        await this.initEmbeddingProvider();
      }
      
      // 清空现有索引
      await this.vectorStore!.clear();
      
      // 获取所有笔记
      const notes = await this.getAllNotes();
      console.log(`[NLPService] Found ${notes.length} notes to index`);
      
      // 批量处理
      const batchSize = this.embeddingConfig.batchSize || 32;
      let indexed = 0;
      
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        const texts: string[] = [];
        const validNotes: Note[] = [];
        
        // 读取内容
        for (const note of batch) {
          try {
            const content = await this.fsService.readNote(note.filePath);
            texts.push(`${note.title}\n${content}`);
            validNotes.push(note);
          } catch (error) {
            console.warn(`[NLPService] Failed to read note ${note.id}:`, error);
          }
        }
        
        if (texts.length === 0) continue;
        
        // 批量向量化
        const embedResult = await this.embeddingProvider!.embedBatch(texts);
        
        // 批量添加到向量存储
        const items = embedResult.embeddings.map((embedding, idx) => ({
          id: validNotes[idx].id,
          vector: embedding,
          metadata: {
            noteId: validNotes[idx].id,
            title: validNotes[idx].title,
            updatedAt: Date.now(),
          } as VectorMetadata,
        }));
        
        await this.vectorStore!.addBatch(items);
        indexed += items.length;
        
        console.log(`[NLPService] Indexed ${indexed}/${notes.length} notes`);
      }
      
      this.lastUpdated = Date.now();
      console.log(`[NLPService] Index rebuilt: ${indexed} documents`);
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * 获取索引状态
   */
  async getIndexStatus(): Promise<VectorIndexStatus> {
    const totalNotes = await this.getNoteCount();
    const stats = this.vectorStore ? await this.vectorStore.getStats() : { count: 0, dimensions: 384 };
    
    return {
      totalDocuments: totalNotes,
      indexedDocuments: stats.count,
      lastUpdated: this.lastUpdated,
      isBuilding: this.isBuilding,
      embeddingProvider: this.embeddingConfig.provider,
      model: this.embeddingConfig.model,
      dimensions: stats.dimensions,
    };
  }

  /**
   * 设置 Embedding 配置
   */
  async setEmbeddingConfig(config: EmbeddingConfig): Promise<void> {
    console.log('[NLPService] Setting embedding config:', config.provider, config.model);
    
    const dimensionsChanged = config.dimensions !== this.embeddingConfig.dimensions;
    const providerChanged = config.provider !== this.embeddingConfig.provider;
    
    // 更新配置
    this.embeddingConfig = { ...this.embeddingConfig, ...config };
    
    // 保存配置
    try {
      const configService = ConfigService.getInstance();
      const aiConfig = await configService.get('ai') || {};
      aiConfig.nlp = aiConfig.nlp || {};
      aiConfig.nlp.embedding = this.embeddingConfig;
      await configService.set('ai', aiConfig);
    } catch (error) {
      console.error('[NLPService] Failed to save config:', error);
    }
    
    // 释放旧的提供商
    if (providerChanged && this.embeddingProvider) {
      await this.embeddingProvider.dispose();
      this.embeddingProvider = null;
    }
    
    // 维度变化时需要更新向量存储
    if (dimensionsChanged && this.vectorStore) {
      await this.vectorStore.updateConfig({
        dimensions: config.dimensions,
      });
    }
  }

  /**
   * 获取 Embedding 配置
   */
  getEmbeddingConfig(): EmbeddingConfig {
    return { ...this.embeddingConfig };
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    if (this.embeddingProvider) {
      await this.embeddingProvider.dispose();
      this.embeddingProvider = null;
    }
    
    if (this.vectorStore) {
      await this.vectorStore.dispose();
      this.vectorStore = null;
    }
    
    console.log('[NLPService] Disposed');
  }

  /**
   * 生成摘要
   */
  private generateExcerpt(content: string, query: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const lines = content.split('\n').filter(l => l.trim());
    
    // 找到包含查询词最多的行
    let bestLine = lines[0] || '';
    let bestScore = 0;
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (lineLower.includes(word)) {
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
