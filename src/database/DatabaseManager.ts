import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface Note {
  id?: number;
  title: string;
  content: string;
  tags?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  file_path?: string;
  parent_id?: number; // 父文件夹ID
  is_folder?: boolean; // 是否为文件夹
}

export interface ReviewRecord {
  id?: number;
  note_id: number;
  quality: number; // 0-5
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string;
  created_at?: string;
}

export interface Tag {
  id?: number;
  name: string;
  color?: string;
  created_at?: string;
}

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');
    
    // 确保数据目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'memorynote.db');
  }

  async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath);
      
      // 启用外键约束
      this.db.exec('PRAGMA foreign_keys = ON');
      
      // 创建表
      this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // 笔记表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        category TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加新字段
    this.migrateDatabase();

    // 标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 复习记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS review_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        quality INTEGER NOT NULL CHECK(quality >= 0 AND quality <= 5),
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 1,
        repetition_count INTEGER NOT NULL DEFAULT 0,
        next_review_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
      )
    `);

    // 设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes(tags)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_review_records_note_id ON review_records(note_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_review_records_next_review ON review_records(next_review_at)');
  }

  private migrateDatabase(): void {
    if (!this.db) return;

    try {
      // 检查是否存在 parent_id 字段
      const tableInfo = this.db.prepare("PRAGMA table_info(notes)").all() as any[];
      const hasParentId = tableInfo.some(col => col.name === 'parent_id');
      const hasIsFolder = tableInfo.some(col => col.name === 'is_folder');

      if (!hasParentId) {
        console.log('Adding parent_id column to notes table...');
        this.db.exec('ALTER TABLE notes ADD COLUMN parent_id INTEGER');
      }

      if (!hasIsFolder) {
        console.log('Adding is_folder column to notes table...');
        this.db.exec('ALTER TABLE notes ADD COLUMN is_folder INTEGER DEFAULT 0');
      }

      // 创建外键约束（如果需要）
      if (hasParentId && !this.hasParentIdConstraint()) {
        console.log('Note: Foreign key constraint for parent_id cannot be added to existing table.');
        console.log('Consider recreating the database for full constraint support.');
      }

      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Database migration failed:', error);
      throw error;
    }
  }

  private hasParentIdConstraint(): boolean {
    if (!this.db) return false;
    
    try {
      const foreignKeys = this.db.prepare("PRAGMA foreign_key_list(notes)").all() as any[];
      return foreignKeys.some(fk => fk.from === 'parent_id');
    } catch {
      return false;
    }
  }

  // 笔记相关方法
  createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Note {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO notes (title, content, tags, category, file_path, parent_id, is_folder)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      note.title, 
      note.content, 
      note.tags || '', 
      note.category || '', 
      note.file_path || '',
      note.parent_id || null,
      note.is_folder ? 1 : 0
    );
    
    return this.getNoteById(result.lastInsertRowid as number)!;
  }

  // 创建文件夹
  createFolder(title: string, parentId?: number): Note {
    return this.createNote({
      title,
      content: '',
      parent_id: parentId,
      is_folder: true,
      category: 'folder'
    });
  }

  // 获取指定文件夹下的所有项目
  getItemsByParentId(parentId?: number): Note[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = parentId 
      ? this.db.prepare('SELECT * FROM notes WHERE parent_id = ? ORDER BY is_folder DESC, title ASC')
      : this.db.prepare('SELECT * FROM notes WHERE parent_id IS NULL ORDER BY is_folder DESC, title ASC');
    
    return parentId ? stmt.all(parentId) as Note[] : stmt.all() as Note[];
  }

  // 获取树形结构
  getNotesTree(): Note[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const allNotes = this.getAllNotes();
    const noteMap = new Map<number, Note & { children: Note[] }>();
    const rootNotes: (Note & { children: Note[] })[] = [];
    
    // 创建带children属性的笔记映射
    allNotes.forEach(note => {
      noteMap.set(note.id!, { ...note, children: [] });
    });
    
    // 构建树形结构
    allNotes.forEach(note => {
      const noteWithChildren = noteMap.get(note.id!)!;
      if (note.parent_id) {
        const parent = noteMap.get(note.parent_id);
        if (parent) {
          parent.children.push(noteWithChildren);
        } else {
          rootNotes.push(noteWithChildren);
        }
      } else {
        rootNotes.push(noteWithChildren);
      }
    });
    
    return rootNotes;
  }

  getNoteById(id: number): Note | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
    return stmt.get(id) as Note || null;
  }

  getAllNotes(): Note[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
    return stmt.all() as Note[];
  }

  updateNote(id: number, updates: Partial<Note>): Note | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    
    if (fields.length === 0) return this.getNoteById(id);
    
    const stmt = this.db.prepare(`
      UPDATE notes 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(...values, id);
    return this.getNoteById(id);
  }

  deleteNote(id: number): boolean {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  searchNotes(query: string): Note[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM notes 
      WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
      ORDER BY updated_at DESC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as Note[];
  }

  // 标签相关方法
  createTag(tag: Omit<Tag, 'id' | 'created_at'>): Tag {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
    const result = stmt.run(tag.name, tag.color || '#3b82f6');
    
    return this.getTagById(result.lastInsertRowid as number)!;
  }

  getTagById(id: number): Tag | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM tags WHERE id = ?');
    return stmt.get(id) as Tag || null;
  }

  getAllTags(): Tag[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM tags ORDER BY name');
    return stmt.all() as Tag[];
  }

  // 复习记录相关方法
  createReviewRecord(record: Omit<ReviewRecord, 'id' | 'created_at'>): ReviewRecord {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO review_records (note_id, quality, ease_factor, interval_days, repetition_count, next_review_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      record.note_id,
      record.quality,
      record.ease_factor,
      record.interval_days,
      record.repetition_count,
      record.next_review_at
    );
    
    return this.getReviewRecordById(result.lastInsertRowid as number)!;
  }

  getReviewRecordById(id: number): ReviewRecord | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM review_records WHERE id = ?');
    return stmt.get(id) as ReviewRecord || null;
  }

  getReviewRecordsByNoteId(noteId: number): ReviewRecord[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM review_records WHERE note_id = ? ORDER BY created_at DESC');
    return stmt.all(noteId) as ReviewRecord[];
  }

  getDueReviews(): ReviewRecord[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT rr.*, n.title, n.content 
      FROM review_records rr
      JOIN notes n ON rr.note_id = n.id
      WHERE rr.next_review_at <= datetime('now')
      ORDER BY rr.next_review_at
    `);
    
    return stmt.all() as ReviewRecord[];
  }

  // 设置相关方法
  getSetting(key: string): string | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  setSetting(key: string, value: string): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(key, value);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
