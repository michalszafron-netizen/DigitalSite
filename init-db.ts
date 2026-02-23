import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'digitalsite.db');
const db = new sqlite3.Database(dbPath);

const runQuery = (query: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
};

const getQuery = (query: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

async function init() {
    try {
        console.log('Initializing database...');

        // Products table
        await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        oldPrice REAL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        file_path TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Submissions table
        await runQuery(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'NEW',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Services table
        await runQuery(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        duration TEXT NOT NULL,
        price TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Seed products
        const productRow: any = await getQuery("SELECT count(*) as count FROM products");
        if (productRow && productRow.count === 0) {
            console.log('Seeding initial products...');
            const initialProducts = [
                ['Jak skutecznie przebranżowić się do IT w 2026', 'Kompletny przewodnik dla osób szukających nowej ścieżki.', 49, null, 'PDF', 'E-booki'],
                ['Trudne pytania na rozmowie o pracę', 'Gotowe schematy odpowiedzi na 50 pytań.', 39, null, 'PDF', 'E-booki'],
                ['Audyt profilu LinkedIn - 50 kroków', 'Zmień swój profil w magnes na rekruterów.', 19, null, 'PDF', 'E-booki'],
                ['Nowoczesne CV - 3 profesjonalne szablony', 'Pliki Word + Figma.', 59, null, 'ZIP', 'Narzędzia'],
                ['Cold Mailing do Rekruterów', 'Jak pisać, żeby odpisali.', 29, null, 'PDF', 'Narzędzia'],
                ['Kalkulator opłacalności: B2B vs UoP', 'Arkusz Excel.', 15, null, 'LINK', 'Narzędzia'],
                ['Minikurs: Jak negocjować podwyżkę', 'Nagranie wideo + notatki.', 99, null, 'VIDEO', 'Kursy'],
                ['Webinar: Pułapki w CV', 'Skonfrontuj swoje błędy z rekruterem.', 35, null, 'VIDEO', 'Kursy'],
                ['Baza Danych: 150 firm zdalnych', 'Baza Notion z filtrami.', 45, null, 'NOTION', 'Bazy'],
                ['Pakiet VIP Kariera', 'Wszystko w jednej paczce.', 199, 389, 'ZIP', 'Bundle']
            ];

            for (const p of initialProducts) {
                await runQuery("INSERT INTO products (title, description, price, oldPrice, type, category) VALUES (?, ?, ?, ?, ?, ?)", p);
            }
        }

        // Seed services
        const serviceRow: any = await getQuery("SELECT count(*) as count FROM services");
        if (serviceRow && serviceRow.count === 0) {
            console.log('Seeding initial services...');
            const initialServices = [
                ['Konsultacja wstępna', '15 min', '0 zł', 'Wstępne omówienie Twojej sytuacji i potrzeb kariery.'],
                ['Symulacja rekrutacji', '60 min', '250 zł', 'Pełny feedback i trening odpowiedzi na trudne pytania.'],
                ['Strategia zmiany', '45 min', '200 zł', 'Mapowanie Twojej ścieżki przebranżowienia krok po kroku.']
            ];

            for (const s of initialServices) {
                await runQuery("INSERT INTO services (title, duration, price, description) VALUES (?, ?, ?, ?)", s);
            }
        }

        console.log('Database initialization complete.');
    } catch (err) {
        console.error('Initialization error:', err);
    } finally {
        db.close();
        console.log('Database handle closed.');
    }
}

init();
