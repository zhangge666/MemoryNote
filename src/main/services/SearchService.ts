/**
 * 搜索服务
 * 阶段 10: 搜索系统
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { FileSystemService } from './FileSystemService';
import type {
  SearchOptions,
  SearchResult,
  SearchMatch,
  SearchHistoryItem,
  ISearchEngine,
} from '../../shared/types/search';
import type { Note } from '../../shared/types/note';

/**
 * 默认搜索引擎 - 基于 SQLite FTS5
 */
class DefaultSearchEngine implements ISearchEngine {
  name = 'default';
  private dbManager: DatabaseManager;
  private fsService: FileSystemService;

  constructor(dbManager: DatabaseManager, fsService: FileSystemService) {
    this.dbManager = dbManager;
    this.fsService = fsService;
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { keyword, caseSensitive, regex, tags, dateRange, limit = 50 } = options;
    
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const results: SearchResult[] = [];
    const searchKeyword = keyword.trim();

    try {
      // 1. 使用 FTS5 搜索标题和摘要
      let ftsQuery = searchKeyword;
      
      // FTS5 查询语法处理
      if (!regex) {
        // 普通搜索：转换为 FTS5 前缀匹配
        ftsQuery = searchKeyword.split(/\s+/).map(term => `${term}*`).join(' ');
      }

      // 构建 SQL 查询
      let sql = `
        SELECT n.*, notes_fts.rank
        FROM notes n
        LEFT JOIN notes_fts ON n.rowid = notes_fts.rowid
        WHERE notes_fts MATCH ?
      `;
      const params: any[] = [ftsQuery];

      // 日期范围筛选
      if (dateRange) {
        sql += ' AND n.updated_at >= ? AND n.updated_at <= ?';
        params.push(dateRange.from, dateRange.to);
      }

      // 按相关性排序
      sql += ' ORDER BY notes_fts.rank LIMIT ?';
      params.push(limit);

      const ftsResults = await this.dbManager.query<any>(sql, params);

      // 处理 FTS 结果
      for (const row of ftsResults) {
        const note = this.rowToNote(row);
        
        // 读取文件内容进行精确匹配
        let content = '';
        try {
          content = await this.fsService.readNote(note.filePath);
        } catch {
          content = note.excerpt || '';
        }

        const matches = this.findMatches(content, searchKeyword, caseSensitive, regex);
        
        // 标题匹配
        const titleMatches = this.findMatches(note.title, searchKeyword, caseSensitive, regex);
        
        results.push({
          note: { ...note, content },
          matches: [...titleMatches, ...matches],
          score: Math.abs(row.rank || 0) + matches.length * 0.1,
        });
      }

      // 2. 如果 FTS 结果不足，进行文件内容搜索
      if (results.length < limit) {
        const additionalResults = await this.searchInFiles(
          searchKeyword,
          caseSensitive,
          regex,
          limit - results.length,
          results.map(r => r.note.id)
        );
        results.push(...additionalResults);
      }

      // 3. 标签筛选
      if (tags && tags.length > 0) {
        const taggedNoteIds = await this.getNoteIdsByTags(tags);
        return results.filter(r => taggedNoteIds.includes(r.note.id));
      }

      // 按分数排序
      results.sort((a, b) => b.score - a.score);

      return results.slice(0, limit);
    } catch (error) {
      console.error('[SearchService] FTS search failed, falling back to file search:', error);
      
      // 降级到纯文件搜索
      return this.searchInFiles(searchKeyword, caseSensitive, regex, limit, []);
    }
  }

  /**
   * 在文件中搜索
   */
  private async searchInFiles(
    keyword: string,
    caseSensitive?: boolean,
    regex?: boolean,
    limit = 50,
    excludeIds: string[] = []
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      // 获取所有笔记
      const notes = await this.dbManager.query<any>(`
        SELECT * FROM notes 
        WHERE id NOT IN (${excludeIds.map(() => '?').join(',') || "''"})
        ORDER BY updated_at DESC
        LIMIT 200
      `, excludeIds);

      for (const row of notes) {
        if (results.length >= limit) break;

        const note = this.rowToNote(row);
        
        // 读取文件内容
        let content = '';
        try {
          content = await this.fsService.readNote(note.filePath);
        } catch {
          continue;
        }

        // 搜索匹配
        const contentMatches = this.findMatches(content, keyword, caseSensitive, regex);
        const titleMatches = this.findMatches(note.title, keyword, caseSensitive, regex);
        const allMatches = [...titleMatches, ...contentMatches];

        if (allMatches.length > 0) {
          results.push({
            note: { ...note, content },
            matches: allMatches,
            score: titleMatches.length * 2 + contentMatches.length,
          });
        }
      }
    } catch (error) {
      console.error('[SearchService] File search failed:', error);
    }

    return results;
  }

  /**
   * 查找匹配项
   */
  private findMatches(
    text: string,
    keyword: string,
    caseSensitive?: boolean,
    useRegex?: boolean
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    
    if (!text || !keyword) return matches;

    try {
      let pattern: RegExp;
      
      if (useRegex) {
        pattern = new RegExp(keyword, caseSensitive ? 'g' : 'gi');
      } else {
        // 转义特殊字符
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }

      const lines = text.split('\n');
      
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let match: RegExpExecArray | null;
        
        while ((match = pattern.exec(line)) !== null) {
          // 获取上下文（前后各20个字符）
          const start = Math.max(0, match.index - 20);
          const end = Math.min(line.length, match.index + match[0].length + 20);
          const context = line.substring(start, end);

          matches.push({
            content: (start > 0 ? '...' : '') + context + (end < line.length ? '...' : ''),
            lineNumber: lineIdx + 1,
            columnStart: match.index,
            columnEnd: match.index + match[0].length,
          });

          // 限制每个文件的匹配数量
          if (matches.length >= 10) break;
        }

        if (matches.length >= 10) break;
      }
    } catch (error) {
      console.error('[SearchService] Match finding failed:', error);
    }

    return matches;
  }

  /**
   * 根据标签获取笔记 ID
   */
  private async getNoteIdsByTags(tags: string[]): Promise<string[]> {
    if (tags.length === 0) return [];

    const placeholders = tags.map(() => '?').join(',');
    const rows = await this.dbManager.query<{ note_id: string }>(`
      SELECT DISTINCT nt.note_id 
      FROM note_tags nt
      JOIN tags t ON nt.tag_id = t.id
      WHERE t.name IN (${placeholders})
    `, tags);

    return rows.map(r => r.note_id);
  }

  /**
   * 将数据库行转换为 Note 对象
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

/**
 * 搜索服务
 */
export class SearchService {
  private dbManager: DatabaseManager;
  private fsService: FileSystemService;
  private searchEngine: ISearchEngine;
  private static instance: SearchService | null = null;

  constructor(dbManager: DatabaseManager, fsService: FileSystemService) {
    this.dbManager = dbManager;
    this.fsService = fsService;
    this.searchEngine = new DefaultSearchEngine(dbManager, fsService);
  }

  /**
   * 获取单例实例
   */
  static getInstance(dbManager?: DatabaseManager, fsService?: FileSystemService): SearchService {
    if (!SearchService.instance) {
      if (!dbManager || !fsService) {
        throw new Error('SearchService requires DatabaseManager and FileSystemService for initialization');
      }
      SearchService.instance = new SearchService(dbManager, fsService);
    }
    return SearchService.instance;
  }

  /**
   * 重置实例（用于工作区切换）
   */
  static resetInstance(): void {
    SearchService.instance = null;
  }

  /**
   * 执行搜索
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    console.log('[SearchService] Searching:', options.keyword);
    const startTime = Date.now();
    
    const results = await this.searchEngine.search(options);
    
    console.log(`[SearchService] Found ${results.length} results in ${Date.now() - startTime}ms`);
    
    // 添加到搜索历史
    if (options.keyword.trim()) {
      await this.addSearchHistory(options.keyword.trim());
    }
    
    return results;
  }

  /**
   * 设置搜索引擎
   */
  setSearchEngine(engine: ISearchEngine): void {
    this.searchEngine = engine;
  }

  /**
   * 获取搜索引擎
   */
  getSearchEngine(): ISearchEngine {
    return this.searchEngine;
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
    try {
      // 确保搜索历史表存在
      await this.ensureHistoryTable();

      const rows = await this.dbManager.query<any>(`
        SELECT keyword, timestamp, result_count
        FROM search_history
        ORDER BY timestamp DESC
        LIMIT ?
      `, [limit]);

      return rows.map(row => ({
        keyword: row.keyword,
        timestamp: row.timestamp,
        resultCount: row.result_count,
      }));
    } catch (error) {
      console.error('[SearchService] Failed to get search history:', error);
      return [];
    }
  }

  /**
   * 添加搜索历史
   */
  async addSearchHistory(keyword: string, resultCount?: number): Promise<void> {
    try {
      await this.ensureHistoryTable();

      // 检查是否已存在
      const existing = await this.dbManager.queryOne<any>(
        'SELECT id FROM search_history WHERE keyword = ?',
        [keyword]
      );

      if (existing) {
        // 更新时间戳和结果数
        await this.dbManager.execute(
          'UPDATE search_history SET timestamp = ?, result_count = ? WHERE keyword = ?',
          [Date.now(), resultCount || 0, keyword]
        );
      } else {
        // 插入新记录
        await this.dbManager.execute(
          'INSERT INTO search_history (keyword, timestamp, result_count) VALUES (?, ?, ?)',
          [keyword, Date.now(), resultCount || 0]
        );
      }

      // 保留最近 100 条记录
      await this.dbManager.execute(`
        DELETE FROM search_history 
        WHERE id NOT IN (
          SELECT id FROM search_history ORDER BY timestamp DESC LIMIT 100
        )
      `);
    } catch (error) {
      console.error('[SearchService] Failed to add search history:', error);
    }
  }

  /**
   * 清空搜索历史
   */
  async clearSearchHistory(): Promise<void> {
    try {
      await this.ensureHistoryTable();
      await this.dbManager.execute('DELETE FROM search_history');
    } catch (error) {
      console.error('[SearchService] Failed to clear search history:', error);
    }
  }

  /**
   * 构建搜索索引（为语义搜索预留）
   */
  async buildIndex(): Promise<void> {
    console.log('[SearchService] Building search index...');
    
    try {
      // 重建 FTS 索引
      const notes = await this.dbManager.query<any>('SELECT rowid, title, excerpt FROM notes');
      
      // 清空 FTS 表
      await this.dbManager.execute('DELETE FROM notes_fts');
      
      // 重新插入
      for (const note of notes) {
        await this.dbManager.execute(
          'INSERT INTO notes_fts (rowid, title, excerpt) VALUES (?, ?, ?)',
          [note.rowid, note.title, note.excerpt || '']
        );
      }
      
      console.log(`[SearchService] Index rebuilt for ${notes.length} notes`);
    } catch (error) {
      console.error('[SearchService] Failed to build index:', error);
      throw error;
    }
  }

  /**
   * 更新单个笔记的索引（为语义搜索预留）
   */
  async updateIndex(noteId: string): Promise<void> {
    // FTS 索引通过触发器自动更新
    // 此方法预留给语义搜索引擎使用
    console.log(`[SearchService] Index update triggered for note: ${noteId}`);
  }

  /**
   * 确保搜索历史表存在
   */
  private async ensureHistoryTable(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        result_count INTEGER DEFAULT 0
      )
    `);
    
    // 创建索引
    await this.dbManager.execute(`
      CREATE INDEX IF NOT EXISTS idx_search_history_keyword ON search_history(keyword)
    `);
    await this.dbManager.execute(`
      CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp DESC)
    `);
  }
}
