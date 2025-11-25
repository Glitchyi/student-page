#!/usr/bin/env tsx

/**
 * Script to clear all data from the database
 * WARNING: This will delete ALL students, events, and user accounts!
 * 
 * Usage:
 *   tsx scripts/clear-database.ts [--confirm]
 * 
 * The --confirm flag is required to actually clear the database.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');

if (!confirmed) {
  console.error('⚠️  WARNING: This will delete ALL data from the database!');
  console.error('');
  console.error('To confirm, run:');
  console.error('  tsx scripts/clear-database.ts --confirm');
  console.error('');
  console.error('This will delete:');
  console.error('  - All students');
  console.error('  - All achievements/events');
  console.error('  - All user accounts (teachers and admins)');
  process.exit(1);
}

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'database.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found:', dbPath);
  process.exit(1);
}

try {
  const db = new Database(dbPath);

  console.log('Clearing database...');

  // Delete all data (order matters due to foreign keys)
  db.exec('DELETE FROM student_events');
  console.log('✓ Deleted all achievements/events');

  db.exec('DELETE FROM students');
  console.log('✓ Deleted all students');

  db.exec('DELETE FROM users');
  console.log('✓ Deleted all users');

  // Reset auto-increment sequences (if any)
  db.exec('DELETE FROM sqlite_sequence WHERE name IN ("users", "students", "student_events")');

  db.close();

  console.log('');
  console.log('✅ Database cleared successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Create an admin account: npm run create-admin <email> <password> <name>');
  console.log('  2. Teachers can register at /register');
  console.log('  3. Start adding students and achievements');
} catch (error: any) {
  console.error('Failed to clear database:', error.message);
  process.exit(1);
}


