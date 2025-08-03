import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, posts, likes, comments, follows, sessions } from "./schema";

export async function initializeDatabase() {
  try {
    console.log("🔍 Checking database connection...");
    
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Test basic connectivity
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    // Check if users table exists and has correct schema
    try {
      // Try to query with name column specifically
      await db.execute(sql`SELECT id, email, name FROM users LIMIT 1`);
      console.log("✅ Users table exists with correct schema");
      return true;
    } catch (error) {
      console.warn("⚠️ Users table issue:", error.message);
      
      // Check if table exists but has wrong schema
      try {
        await db.execute(sql`SELECT * FROM users LIMIT 1`);
        console.log("📝 Users table exists but may have wrong schema - recreating...");
        await recreateTablesWithCorrectSchema();
      } catch (tableError) {
        console.log("📝 Users table does not exist - creating all tables...");
        await createTablesManually();
      }
      
      // Test again
      await db.execute(sql`SELECT id, email, name FROM users LIMIT 1`);
      console.log("✅ Users table created with correct schema");
      return true;
    }

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

async function recreateTablesWithCorrectSchema() {
  console.log("🔧 Recreating tables with correct schema...");
  
  try {
    // Drop tables in correct order (reverse of dependencies)
    const dropStatements = [
      'DROP TABLE IF EXISTS follows CASCADE',
      'DROP TABLE IF EXISTS comments CASCADE', 
      'DROP TABLE IF EXISTS likes CASCADE',
      'DROP TABLE IF EXISTS posts CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE'
    ];

    for (const statement of dropStatements) {
      console.log("🗑️ ", statement);
      await db.execute(sql.raw(statement));
    }

    // Now create tables with correct schema
    await createTablesManually();
    
  } catch (error) {
    console.error("❌ Failed to recreate tables:", error);
    throw error;
  }
}

async function createTablesManually() {
  console.log("🔧 Creating database tables manually...");
  
  try {
    // Create tables one by one with proper error handling
    console.log("� Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          profile_image_url TEXT,
          bio TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("🔧 Creating posts table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          author_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("🔧 Creating likes table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS likes (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          post_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
      )
    `);

    console.log("🔧 Creating comments table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          author_id VARCHAR NOT NULL,
          post_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);

    console.log("🔧 Creating follows table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS follows (
          id SERIAL PRIMARY KEY,
          follower_id VARCHAR NOT NULL,
          following_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(follower_id, following_id)
      )
    `);

    console.log("🔧 Creating sessions table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
      )
    `);

    console.log("🔧 Creating session index...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)
    `);

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Failed to create tables manually:", error);
    throw error;
  }
}
