/**
 * 简单向量存储服务
 * 使用 JSON 文件存储向量，避免依赖外部库
 */

import * as fs from 'fs';
import * as path from 'path';

export interface VectorMetadata {
  noteId: string;
  title: string;
  chunkIndex?: number;
  updatedAt: number;
}

export interface StoredVector {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
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
 * 简单向量存储服务
 * 使用 JSON 文件存储向量数据
 */
export class SimpleVectorStore {
  private config: VectorStoreConfig;
  private vectors: StoredVector[] = [];
  private initialized = false;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  /**
   * 初始化向量存储
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

      // 加载现有数据
      if (fs.existsSync(this.config.indexPath)) {
        const data = fs.readFileSync(this.config.indexPath, 'utf-8');
        this.vectors = JSON.parse(data);
        console.log(`[SimpleVectorStore] Loaded ${this.vectors.length} vectors`);
      } else {
        console.log('[SimpleVectorStore] Created new vector store');
      }

      this.initialized = true;
      console.log(`[SimpleVectorStore] Initialized at ${this.config.indexPath}`);
    } catch (error) {
      console.error('[SimpleVectorStore] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 保存数据到文件
   */
  private async saveToFile(): Promise<void> {
    try {
      const data = JSON.stringify(this.vectors, null, 2);
      fs.writeFileSync(this.config.indexPath, data, 'utf-8');
    } catch (error) {
      console.error('[SimpleVectorStore] Failed to save to file:', error);
      throw error;
    }
  }

  /**
   * 添加向量到索引
   */
  async add(id: string, vector: number[], metadata: VectorMetadata): Promise<void> {
    if (!this.initialized) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // 先删除已存在的同 ID 项
      await this.delete(id);

      // 添加新向量
      this.vectors.push({
        id,
        vector,
        metadata,
      });

      // 保存到文件
      await this.saveToFile();
    } catch (error) {
      console.error(`[SimpleVectorStore] Failed to add vector ${id}:`, error);
      throw error;
    }
  }

  /**
   * 批量添加向量
   */
  async addBatch(items: Array<{ id: string; vector: number[]; metadata: VectorMetadata }>): Promise<void> {
    if (!this.initialized) {
      throw new Error('VectorStore not initialized');
    }

    try {
      for (const item of items) {
        // 先删除已存在的
        const existingIndex = this.vectors.findIndex(v => v.id === item.id);
        if (existingIndex >= 0) {
          this.vectors.splice(existingIndex, 1);
        }

        // 添加新向量
        this.vectors.push(item);
      }

      // 保存到文件
      await this.saveToFile();
    } catch (error) {
      console.error('[SimpleVectorStore] Failed to add batch:', error);
      throw error;
    }
  }

  /**
   * 删除向量
   */
  async delete(id: string): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      const index = this.vectors.findIndex(v => v.id === id);
      if (index >= 0) {
        this.vectors.splice(index, 1);
        await this.saveToFile();
      }
    } catch (error) {
      console.error(`[SimpleVectorStore] Failed to delete vector ${id}:`, error);
    }
  }

  /**
   * 按笔记 ID 删除所有相关向量
   */
  async deleteByNoteId(noteId: string): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      const initialLength = this.vectors.length;
      this.vectors = this.vectors.filter(v => v.metadata.noteId !== noteId);
      
      if (this.vectors.length !== initialLength) {
        await this.saveToFile();
        console.log(`[SimpleVectorStore] Deleted ${initialLength - this.vectors.length} vectors for note ${noteId}`);
      }
    } catch (error) {
      console.error(`[SimpleVectorStore] Failed to delete vectors for note ${noteId}:`, error);
    }
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 相似度搜索
   */
  async search(queryVector: number[], limit = 10): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      throw new Error('VectorStore not initialized');
    }

    try {
      // 计算所有向量的相似度
      const similarities = this.vectors.map(vector => ({
        id: vector.id,
        score: this.cosineSimilarity(queryVector, vector.vector),
        metadata: vector.metadata,
      }));

      // 按相似度排序并返回前 N 个结果
      similarities.sort((a, b) => b.score - a.score);
      return similarities.slice(0, limit);
    } catch (error) {
      console.error('[SimpleVectorStore] Search failed:', error);
      return [];
    }
  }

  /**
   * 获取索引统计
   */
  async getStats(): Promise<{ count: number; dimensions: number }> {
    return {
      count: this.vectors.length,
      dimensions: this.config.dimensions,
    };
  }

  /**
   * 清空索引
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      this.vectors = [];
      await this.saveToFile();
      console.log('[SimpleVectorStore] Index cleared');
    } catch (error) {
      console.error('[SimpleVectorStore] Failed to clear index:', error);
      throw error;
    }
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    this.vectors = [];
    this.initialized = false;
    console.log('[SimpleVectorStore] Disposed');
  }

  /**
   * 是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<VectorStoreConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // 如果维度改变，清空索引
    if (newConfig.dimensions && newConfig.dimensions !== this.config.dimensions) {
      console.log('[SimpleVectorStore] Dimensions changed, clearing index');
      await this.clear();
    }
  }
}