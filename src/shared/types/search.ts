/**
 * 搜索系统类型定义
 * 阶段 10: 搜索系统
 */

import type { Note } from './note';

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否使用正则表达式 */
  regex?: boolean;
  /** 按标签筛选 */
  tags?: string[];
  /** 日期范围筛选 */
  dateRange?: {
    from: number;
    to: number;
  };
  /** 结果数量限制 */
  limit?: number;
  /** 偏移量（分页用） */
  offset?: number;
}

/**
 * 搜索匹配项
 */
export interface SearchMatch {
  /** 匹配的内容片段 */
  content: string;
  /** 行号 */
  lineNumber: number;
  /** 起始列 */
  columnStart: number;
  /** 结束列 */
  columnEnd: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 匹配的笔记 */
  note: Note;
  /** 匹配项列表 */
  matches: SearchMatch[];
  /** 相关性得分 */
  score: number;
}

/**
 * 搜索历史记录
 */
export interface SearchHistoryItem {
  /** 搜索关键词 */
  keyword: string;
  /** 搜索时间戳 */
  timestamp: number;
  /** 结果数量 */
  resultCount?: number;
}

/**
 * 搜索引擎接口（可扩展）
 */
export interface ISearchEngine {
  /** 引擎名称 */
  name: string;
  /** 执行搜索 */
  search(options: SearchOptions): Promise<SearchResult[]>;
}

/**
 * 搜索统计
 */
export interface SearchStats {
  /** 总搜索次数 */
  totalSearches: number;
  /** 今日搜索次数 */
  searchesToday: number;
  /** 最近搜索 */
  recentSearches: string[];
}
