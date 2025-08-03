import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, posts, likes, comments, follows, sessions } from "./schema";

export async function initializeDatabase() {
  try {
    console.log("🔍 Starting database initialization...");
    console.log("🔍 Checking database connection...");
    
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Test basic connectivity
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    // Always force recreation of tables to ensure correct schema
    console.log("🔧 FORCE recreating all tables to ensure correct schema...");
    console.log("⚠️ This will drop ALL existing data!");
    
    await recreateTablesWithCorrectSchema();
    
    // Test the schema after recreation
    console.log("🧪 Testing schema after recreation...");
    await db.execute(sql`SELECT id, email, first_name, last_name FROM users LIMIT 1`);
    console.log("✅ Database initialized with correct schema - firstName/lastName columns exist!");
    
    // Log success prominently
    console.log("🎉 DATABASE INITIALIZATION COMPLETED SUCCESSFULLY!");
    return true;

  } catch (error) {
    console.error("❌ DATABASE INITIALIZATION FAILED!");
    console.error("❌ Error:", error);
    
    // Log more details about the error
    if (error.code) {
      console.error(`❌ Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`❌ Error message: ${error.message}`);
    }
    if (error.stack) {
      console.error(`❌ Stack trace: ${error.stack}`);
    }
    
    // Re-throw to make sure startup fails if DB init fails
    throw error;
  }
}

async function recreateTablesWithCorrectSchema() {
  console.log("🔧 Recreating tables with correct schema...");
  
  try {
    // Drop tables in correct order (reverse of dependencies) with CASCADE to handle foreign keys
    const dropStatements = [
      'DROP TABLE IF EXISTS follows CASCADE',
      'DROP TABLE IF EXISTS comments CASCADE', 
      'DROP TABLE IF EXISTS likes CASCADE',
      'DROP TABLE IF EXISTS posts CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE'
    ];

    console.log("🗑️ Dropping existing tables...");
    for (const statement of dropStatements) {
      console.log(`   ${statement}`);
      await db.execute(sql.raw(statement));
    }

    // Now create tables with correct schema
    await createTablesManually();
    
    console.log("✅ Tables recreated successfully");
  } catch (error) {
    console.error("❌ Failed to recreate tables:", error);
    throw error;
  }
}

async function createTablesManually() {
  console.log("🔧 Creating database tables manually...");
  
  try {
    // Create tables one by one with proper error handling
    console.log("🔧 Creating users table...");
    await db.execute(sql`
      CREATE TABLE users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          profile_image_url VARCHAR,
          bio TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("   ✅ Users table created");

    console.log("🔧 Creating posts table...");
    await db.execute(sql`
      CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          author_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("   ✅ Posts table created");

    console.log("🔧 Creating likes table...");
    await db.execute(sql`
      CREATE TABLE likes (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          post_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
      )
    `);
    console.log("   ✅ Likes table created");

    console.log("🔧 Creating comments table...");
    await db.execute(sql`
      CREATE TABLE comments (
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
    console.log("   ✅ Comments table created");

    console.log("🔧 Creating follows table...");
    await db.execute(sql`
      CREATE TABLE follows (
          id SERIAL PRIMARY KEY,
          follower_id VARCHAR NOT NULL,
          following_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(follower_id, following_id)
      )
    `);
    console.log("   ✅ Follows table created");

    console.log("🔧 Creating sessions table...");
    await db.execute(sql`
      CREATE TABLE sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
      )
    `);
    console.log("   ✅ Sessions table created");

    console.log("🔧 Creating session index...");
    await db.execute(sql`
      CREATE INDEX IDX_session_expire ON sessions (expire)
    `);
    console.log("   ✅ Session index created");

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Failed to create tables manually:", error);
    console.error("Error details:", error);
    throw error;
  }
}
