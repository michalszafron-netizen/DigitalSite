import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'digitalsite.db');
const db = new sqlite3.Database(dbPath);

const runQuery = (query: string) => {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                // Ignore "duplicate column name" error
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column already exists: ${query}`);
                    resolve(true);
                } else {
                    reject(err);
                }
            } else {
                resolve(true);
            }
        });
    });
};

async function migrate() {
    try {
        console.log('Running migration...');
        await runQuery("ALTER TABLE products ADD COLUMN details TEXT");
        await runQuery("ALTER TABLE services ADD COLUMN details TEXT");
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        db.close();
    }
}

migrate();
