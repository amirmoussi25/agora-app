import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database', 'sqlite.db'));

export const initSQLiteDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      user_type TEXT CHECK(user_type IN ('client', 'mairie')) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expires INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT,
      last_name TEXT,
      birth_date DATE,
      mairie_name TEXT,
      street_number TEXT,
      street_name TEXT,
      postal_code TEXT,
      city TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      booking_id TEXT NOT NULL,
      stripe_payment_intent_id TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'eur',
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Ajouter la colonne avatar si elle n'existe pas
    PRAGMA table_info(user_profiles);
  `);
  
  // Vérifier si la colonne avatar existe, sinon l'ajouter
  const columns = db.prepare("PRAGMA table_info(user_profiles)").all();
  const avatarExists = columns.some((col: any) => col.name === 'avatar');
  
  if (!avatarExists) {
    db.exec("ALTER TABLE user_profiles ADD COLUMN avatar TEXT;");
  }
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  `);
};

initSQLiteDatabase();

export { db };