#!/usr/bin/env tsx
// apps/api/scripts/migrate.ts
import { db } from "../src/lib/db";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function runMigrations() {
    try {
        console.log("Starting database migrations...");

        // Get migration files
        const migrationsDir = join(__dirname, "../src/migrations");
        const migrationFiles = readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure order

        console.log(`Found ${migrationFiles.length} migration files`);

        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);

            const migrationPath = join(migrationsDir, file);
            const sql = readFileSync(migrationPath, 'utf8');

            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(stmt => stmt.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    await db.query(statement);
                }
            }

            console.log(`✓ Completed: ${file}`);
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
