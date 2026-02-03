import { runQuery } from './database.js';

async function migrate() {
    console.log('Starting migration: Add account_id to messages table');

    try {
        // Add account_id column to messages table
        await runQuery(`
            ALTER TABLE messages 
            ADD COLUMN account_id INTEGER DEFAULT NULL REFERENCES accounts(id) ON DELETE CASCADE
        `);
        console.log('Success: Added account_id column to messages table');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('Column account_id already exists in messages table');
        } else {
            console.error('Error adding account_id column:', error);
        }
    }

    console.log('Migration completed');
}

migrate();
