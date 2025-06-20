import pkg from 'pg';
const { Client } = pkg;

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        photo_url VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create designers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS designers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        company VARCHAR(255),
        bio TEXT,
        experience TEXT,
        skills TEXT[],
        portfolio_url VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        location VARCHAR(255),
        availability VARCHAR(255),
        rate VARCHAR(255),
        social_links JSONB,
        additional_info TEXT,
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create other necessary tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id),
        slug VARCHAR(255) UNIQUE,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS list_designers (
        id SERIAL PRIMARY KEY,
        list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
        designer_id INTEGER REFERENCES designers(id) ON DELETE CASCADE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(list_id, designer_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables created successfully');
    
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

setupDatabase().catch(console.error);