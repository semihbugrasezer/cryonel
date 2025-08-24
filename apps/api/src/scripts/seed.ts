#!/usr/bin/env ts-node

import { Pool } from 'pg';
import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'seed' }
});

// Database connection
const pg = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'cryonel_user',
    password: process.env.POSTGRES_PASSWORD || 'cryonel_secure_password',
    database: process.env.POSTGRES_DB || 'cryonel',
    connectionTimeoutMillis: 30000
});

// Seed data
const seedData = {
    users: [
        {
            email: 'admin@cryonel.com',
            password: 'admin123456',
            twofa_enabled: false
        },
        {
            email: 'demo@cryonel.com',
            password: 'demo123456',
            twofa_enabled: false
        }
    ]
};

async function seedDatabase() {
    try {
        logger.info('Starting database seeding...');

        // Check if users already exist
        const existingUsers = await pg.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers.rows[0].count) > 0) {
            logger.info('Database already seeded, skipping...');
            return;
        }

        // Insert seed users
        for (const user of seedData.users) {
            // In production, you would hash the password here
            // For now, we'll use a simple hash placeholder
            const passwordHash = `placeholder_hash_${user.password}`;

            await pg.query(
                'INSERT INTO users (email, pw_hash, twofa_enabled) VALUES ($1, $2, $3)',
                [user.email, passwordHash, user.twofa_enabled]
            );

            logger.info(`Created user: ${user.email}`);
        }

        logger.info('Database seeding completed successfully');
    } catch (error) {
        logger.error('Error seeding database:', error);
        throw error;
    } finally {
        await pg.end();
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            logger.info('Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Seeding failed:', error);
            process.exit(1);
        });
}

export default seedDatabase;
