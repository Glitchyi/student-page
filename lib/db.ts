import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      teacher_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrate existing students table if it has AUTOINCREMENT
  // This will recreate the table without AUTOINCREMENT if needed
  try {
    const tableSql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='students'`).get() as { sql: string } | undefined;
    
    if (tableSql?.sql?.includes('AUTOINCREMENT')) {
      // Recreate table without AUTOINCREMENT
      db.exec(`
        CREATE TABLE IF NOT EXISTS students_new (
          id INTEGER PRIMARY KEY,
          teacher_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.exec(`INSERT INTO students_new SELECT * FROM students`);
      db.exec(`DROP TABLE students`);
      db.exec(`ALTER TABLE students_new RENAME TO students`);
    }
  } catch (e) {
    // Migration failed, continue with new table structure
  }

  // Student academics table (one record per student)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_academics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE,
      percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // Student values table (two records per student: Leadership and Bhavan's Values)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      value_type TEXT NOT NULL CHECK(value_type IN ('Leadership and Responsibility', 'Bhavan''s Values')),
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(student_id, value_type)
    )
  `);

  // Student events table (modified structure)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      event_category TEXT NOT NULL CHECK(event_category IN ('Literary', 'Sports', 'Arts', 'Science/Maths')),
      achievement_level TEXT NOT NULL,
      is_group INTEGER NOT NULL CHECK(is_group IN (0, 1)),
      points INTEGER NOT NULL,
      remark TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // Migration: Update existing student_events table if it has old structure
  try {
    const tableInfo = db.pragma('table_info(student_events)') as any[];
    const hasEventType = tableInfo.some((col: any) => col.name === 'event_type');
    const hasEventCategory = tableInfo.some((col: any) => col.name === 'event_category');
    
    if (hasEventType && !hasEventCategory) {
      // Migrate old structure to new structure
      db.exec(`
        CREATE TABLE IF NOT EXISTS student_events_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          event_category TEXT NOT NULL DEFAULT 'Literary',
          achievement_level TEXT NOT NULL,
          is_group INTEGER NOT NULL CHECK(is_group IN (0, 1)),
          points INTEGER NOT NULL,
          remark TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);
      
      // Copy data: event_type becomes achievement_level, set default category
      db.exec(`
        INSERT INTO student_events_new (id, student_id, event_category, achievement_level, is_group, points, remark, created_at)
        SELECT id, student_id, 'Literary' as event_category, 
               COALESCE(event_type, 'National Winner') as achievement_level,
               is_group, points, COALESCE(remark, '') as remark, created_at
        FROM student_events
      `);
      
      db.exec(`DROP TABLE student_events`);
      db.exec(`ALTER TABLE student_events_new RENAME TO student_events`);
    }
  } catch (e) {
    // Migration failed, continue
  }

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_student_events_student_id ON student_events(student_id);
  `);
}

// Initialize on import
initDatabase();

// User queries
export const userQueries = {
  create: db.prepare(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `),
  
  findByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
  
  getAllTeachers: db.prepare(`
    SELECT id, email, name, created_at FROM users WHERE role = 'teacher'
  `),
  
  delete: db.prepare(`
    DELETE FROM users WHERE id = ?
  `),
  
  updatePassword: db.prepare(`
    UPDATE users SET password_hash = ? WHERE id = ?
  `),
};

// Helper function to generate a unique random 5-digit student ID
function generateRandomStudentId(): number {
  const min = 10000;
  const max = 99999;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
    const existing = db.prepare(`SELECT id FROM students WHERE id = ?`).get(randomId);
    if (!existing) {
      return randomId;
    }
    attempts++;
  }
  
  // Fallback: if we can't find a unique ID, throw an error
  throw new Error('Unable to generate unique student ID. Too many students in database.');
}

// Student queries
export const studentQueries = {
  create: db.prepare(`
    INSERT INTO students (id, teacher_id, name)
    VALUES (?, ?, ?)
  `),
  
  // Helper function to create student with random ID
  createWithRandomId(teacherId: number, name: string) {
    const randomId = generateRandomStudentId();
    const result = this.create.run(randomId, teacherId, name);
    return { lastInsertRowid: randomId, changes: result.changes };
  },
  
  findById: db.prepare(`
    SELECT * FROM students WHERE id = ?
  `),
  
  findByTeacherId: db.prepare(`
    SELECT * FROM students WHERE teacher_id = ? ORDER BY created_at DESC
  `),
  
  update: db.prepare(`
    UPDATE students 
    SET name = ?, updated_at = datetime('now')
    WHERE id = ? AND teacher_id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM students WHERE id = ? AND teacher_id = ?
  `),
  
  getAll: db.prepare(`
    SELECT s.*, u.name as teacher_name, u.email as teacher_email
    FROM students s
    JOIN users u ON s.teacher_id = u.id
    ORDER BY s.created_at DESC
  `),
};

// Student academics queries
export const studentAcademicsQueries = {
  create: db.prepare(`
    INSERT INTO student_academics (student_id, percentage)
    VALUES (?, ?)
  `),
  
  findByStudentId: db.prepare(`
    SELECT * FROM student_academics WHERE student_id = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM student_academics WHERE id = ?
  `),
  
  upsert: db.prepare(`
    INSERT INTO student_academics (student_id, percentage)
    VALUES (?, ?)
    ON CONFLICT(student_id) DO UPDATE SET
      percentage = excluded.percentage,
      updated_at = datetime('now')
  `),
  
  update: db.prepare(`
    UPDATE student_academics 
    SET percentage = ?, updated_at = datetime('now')
    WHERE student_id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM student_academics WHERE student_id = ?
  `),
  
  getAll: db.prepare(`
    SELECT sa.*, s.name as student_name, s.teacher_id, u.name as teacher_name, u.email as teacher_email
    FROM student_academics sa
    JOIN students s ON sa.student_id = s.id
    JOIN users u ON s.teacher_id = u.id
    ORDER BY sa.updated_at DESC
  `),
};

// Student values queries
export const studentValuesQueries = {
  create: db.prepare(`
    INSERT INTO student_values (student_id, value_type, score)
    VALUES (?, ?, ?)
  `),
  
  findByStudentId: db.prepare(`
    SELECT * FROM student_values WHERE student_id = ? ORDER BY value_type
  `),
  
  findByStudentIdAndType: db.prepare(`
    SELECT * FROM student_values WHERE student_id = ? AND value_type = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM student_values WHERE id = ?
  `),
  
  upsert: db.prepare(`
    INSERT INTO student_values (student_id, value_type, score)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, value_type) DO UPDATE SET
      score = excluded.score,
      updated_at = datetime('now')
  `),
  
  update: db.prepare(`
    UPDATE student_values 
    SET score = ?, updated_at = datetime('now')
    WHERE student_id = ? AND value_type = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM student_values WHERE id = ?
  `),
  
  getAll: db.prepare(`
    SELECT sv.*, s.name as student_name, s.teacher_id, u.name as teacher_name, u.email as teacher_email
    FROM student_values sv
    JOIN students s ON sv.student_id = s.id
    JOIN users u ON s.teacher_id = u.id
    ORDER BY sv.updated_at DESC
  `),
};

// Student event queries
export const studentEventQueries = {
  create: db.prepare(`
    INSERT INTO student_events (student_id, event_category, achievement_level, is_group, points, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  findByStudentId: db.prepare(`
    SELECT * FROM student_events WHERE student_id = ? ORDER BY created_at DESC
  `),
  
  findById: db.prepare(`
    SELECT * FROM student_events WHERE id = ?
  `),
  
  update: db.prepare(`
    UPDATE student_events 
    SET event_category = ?, achievement_level = ?, is_group = ?, points = ?, remark = ?
    WHERE id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM student_events WHERE id = ?
  `),
  
  getByStudentId: db.prepare(`
    SELECT se.*, s.name as student_name, s.teacher_id, u.name as teacher_name
    FROM student_events se
    JOIN students s ON se.student_id = s.id
    JOIN users u ON s.teacher_id = u.id
    WHERE se.student_id = ?
    ORDER BY se.created_at DESC
  `),
  
  getAll: db.prepare(`
    SELECT se.*, s.name as student_name, s.teacher_id, u.name as teacher_name, u.email as teacher_email
    FROM student_events se
    JOIN students s ON se.student_id = s.id
    JOIN users u ON s.teacher_id = u.id
    ORDER BY se.created_at DESC
  `),
};

// Transaction helpers
export const transactions = {
  createStudentWithData: db.transaction((student: { teacher_id: number; name: string }, data: {
    academics?: { percentage: number };
    events?: Array<{ event_category: string; achievement_level: string; is_group: number; points: number; remark: string }>;
    values?: Array<{ value_type: string; score: number }>;
  }) => {
    const randomId = generateRandomStudentId();
    studentQueries.create.run(randomId, student.teacher_id, student.name);
    const studentId = randomId;
    
    // Create academics if provided
    if (data.academics) {
      studentAcademicsQueries.upsert.run(studentId, data.academics.percentage);
    }
    
    // Create events if provided
    if (data.events) {
      for (const event of data.events) {
        studentEventQueries.create.run(
          studentId,
          event.event_category,
          event.achievement_level,
          event.is_group,
          event.points,
          event.remark
        );
      }
    }
    
    // Create values if provided
    if (data.values) {
      for (const value of data.values) {
        studentValuesQueries.upsert.run(studentId, value.value_type, value.score);
      }
    }
    
    return studentId;
  }),
};

export default db;

