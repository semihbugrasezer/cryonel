#!/usr/bin/env tsx
// apps/api/src/scripts/migrate.ts
import { db } from "../lib/db";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Get migration files
    const migrationsDir = join(__dirname, "../migrations");
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure order

    console.log(`Found ${migrationFiles.length} migration files`);

    // Skip first migration if tables already exist
    const existingTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    const startIndex = existingTables.rows.length > 0 ? 1 : 0;
    console.log(`Starting from migration index: ${startIndex}`);

    for (let i = startIndex; i < migrationFiles.length; i++) {
      const file = migrationFiles[i];
      console.log(`Running migration: ${file}`);

      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf8');

      // Execute the entire migration file as one transaction
      try {
        await db.query('BEGIN');
        await db.query(sql);
        await db.query('COMMIT');
        console.log(`✓ Completed: ${file}`);
      } catch (error) {
        await db.query('ROLLBACK');
        console.error(`✗ Failed: ${file}`, error);
        throw error;
      }
    }

    console.log("All migrations completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };