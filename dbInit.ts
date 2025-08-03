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

    // Try to query the users table to see if it exists
    try {
      await db.select().from(users).limit(1);
      console.log("✅ Users table exists and is accessible");
    } catch (error) {
      console.warn("⚠️ Users table may not exist or has issues:", error.message);
      
      // Log the specific error for debugging
      if (error.code === '42P01') {
        console.error("❌ Table does not exist - database migration needed");
      } else if (error.code === '42703') {
        console.error("❌ Column does not exist - schema mismatch");
      }
      
      throw error;
    }

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
