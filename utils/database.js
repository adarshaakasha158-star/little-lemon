import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'little-lemon.db';
let databasePromise;

async function createDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'mains',
      image TEXT NOT NULL DEFAULT '',
      cached_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items(category);
  `);

  return database;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = createDatabase().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
}

export async function getCachedMenuItems() {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT id, name, description, price, category, image FROM menu_items ORDER BY name COLLATE NOCASE ASC'
  );
}

export async function cacheMenuItems(items) {
  const database = await getDatabase();
  const cachedAt = Date.now();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('DELETE FROM menu_items');

    for (const item of items) {
      await transaction.runAsync(
        `INSERT INTO menu_items (id, name, description, price, category, image, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           price = excluded.price,
           category = excluded.category,
           image = excluded.image,
           cached_at = excluded.cached_at`,
        item.id,
        item.name,
        item.description,
        item.price,
        item.category,
        item.image,
        cachedAt
      );
    }
  });
}
