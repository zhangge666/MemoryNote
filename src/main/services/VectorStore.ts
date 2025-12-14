/**
 * 向量存储服务
 * 使用 vectra 进行向量索引和相似度搜索
 */

import * as fs from 'fs';
import * as path from 'path';
import { LocalIndex } from 'vectra';

export interface VectorMetadata {
  noteId: string;
  title: string;
  chunkIndex?: number;
  updatedAt: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export interface VectorStoreConfig {
  indexPath: string;
  dimensions: number;
}

/**
 * 向量存储服务
 * 封装 vectra 提供向量索引功能
 */
export class VectorStore {
  private index: LocalIndex | null = null;
  private config: VectorStoreConfig;
  private initialized = false;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  /**
   * 初始化向量索引
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 确保目录存在
      const indexDir = path.dirname(this.config.indexPath);
      if (!fs.existsSync(indexDir)) {
        fs.mkdirSync(indexDir, { recursive: true });
      }

      // 创建或加载索引
      this.index = new LocalIndex(this.config.indexPath);

      // 检查索引是否存在
      if (await this.index.isIndexCreated()) {
        console.log('[VectorStore] Loading existing index');
      } else {
        console.log('[VectorStore] Creating new index');
        await this.index.createIndex();
      }

      this.initialized = true;
      console.log(`[VectorStore] Initialized at ${this.config.indexPath}`);
    } catch (error) {
      console.error('[VectorStore] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 添加向量到索引
   */
  async add(id: string, vector: number[], metadata: VectorMetadata): Promise<void> {
    if (!this.index) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // 先删除已存在的同 ID 项
      await this.delete(id);

      // 插入新向量 (使用 any 绕过类型检查)
      await this.index.insertItem({
        id,
        vector,
        metadata: metadata as any,
      });
    } catch (error) {
      console.error(`[VectorStore] Failed to add vector ${id}:`, error);
      throw error;
    }
  }

  /**
   * 批量添加向量
   */
  async addBatch(items: Array<{ id: string; vector: number[]; metadata: VectorMetadata }>): Promise<void> {
    if (!this.index) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // 开始批量操作
      await this.index.beginUpdate();

      for (const item of items) {
        // 先删除已存在的
        try {
          await this.index.deleteItem(item.id);
        } catch {
          // 忽略不存在的项
        }

        // 插入新向量 (使用 any 绕过类型检查)
        await this.index.insertItem({
          id: item.id,
          vector: item.vector,
          metadata: item.metadata as any,
        });
      }

      // 结束批量操作
      await this.index.endUpdate();
    } catch (error) {
      console.error('[VectorStore] Failed to add batch:', error);
      throw error;
    }
  }

  /**
   * 删除向量
   */
  async delete(id: string): Promise<void> {
    if (!this.index) {
      throw new Error('VectorStore not initialized');
    }

    try {
      await this.index.deleteItem(id);
    } catch {
      // 忽略不存在的项
    }
  }

  /**
   * 按笔记 ID 删除所有相关向量
   */
  async deleteByNoteId(noteId: string): Promise<void> {
    if (!this.index) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // 列出所有项并过滤
      const items = await this.index.listItems();
      const toDelete = items.filter(item => 
                (item.metadata as unknown as VectorMetadata)?.noteId === noteId
      );

      for (const item of toDelete) {
        await this.index.deleteItem(item.id);
      }

      console.log(`[VectorStore] Deleted ${toDelete.length} vectors for note ${noteId}`);
    } catch (error) {
      console.error(`[VectorStore] Failed to delete vectors for note ${noteId}:`, error);
    }
  }

  /**
   * 相似度搜索
   * @param queryVector 查询向量
   * @param limit 返回结果数量
   * @param queryText 可选的查询文本（用于 BM25 混合搜索）
   */
  async search(queryVector: number[], limit = 10, queryText = ''): Promise<VectorSearchResult[]> {
    if (!this.index) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // vectra queryItems 签名: (vector, query, topK, filter?, isBm25?)
      const results = await this.index.queryItems(queryVector, queryText, limit);

      return results.map(result => ({
        id: result.item.id,
        score: result.score,
        metadata: result.item.metadata as unknown as VectorMetadata,
      }));
    } catch (error) {
      console.error('[VectorStore] Search failed:', error);
      return [];
    }
  }

  /**
   * 获取索引统计
   */
  async getStats(): Promise<{ count: number; dimensions: number }> {
    if (!this.index) {
      return { count: 0, dimensions: this.config.dimensions };
    }

    try {
      const items = await this.index.listItems();
      return {
        count: items.length,
        dimensions: this.config.dimensions,
      };
    } catch {
      return { count: 0, dimensions: this.config.dimensions };
    }
  }

  /**
   * 清空索引
   */
  async clear(): Promise<void> {
    if (!this.index) {
      return;
    }

    try {
      // 删除并重新创建索引
      await this.index.deleteIndex();
      await this.index.createIndex();
      console.log('[VectorStore] Index cleared');
    } catch (error) {
      console.error('[VectorStore] Failed to clear index:', error);
      throw error;
    }
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    this.index = null;
    this.initialized = false;
    console.log('[VectorStore] Disposed');
  }

  /**
   * 是否已初始化
   */
  isReady(): boolean {
    return this.initialized && this.index !== null;
  }

  /**
   * 更新配置（维度改变时需要重建索引）
   */
  async updateConfig(newConfig: Partial<VectorStoreConfig>): Promise<void> {
    const dimensionsChanged = newConfig.dimensions && newConfig.dimensions !== this.config.dimensions;

    this.config = { ...this.config, ...newConfig };

    if (dimensionsChanged) {
      console.log('[VectorStore] Dimensions changed, need to rebuild index');
      await this.clear();
    }
  }
}
