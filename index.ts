import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "LinkSphere API Server v4 - EMERGENCY FIX", status: "running", timestamp: new Date().toISOString() });
});

// EMERGENCY FIX: Direct database table creation
app.get("/fix-database-now", async (req, res) => {
  try {
    console.log("🚨 EMERGENCY FIX: Creating users table with correct schema...");
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    
    // First, let's see what tables exist
    const tables = await db.execute(sql.raw(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `));
    console.log("📋 Existing tables:", tables);
    
    // Drop and recreate users table with correct schema
    console.log("🗑️ Dropping users table...");
    await db.execute(sql.raw('DROP TABLE IF EXISTS users CASCADE'));
    
    console.log("🔧 Creating users table with correct schema...");
    await db.execute(sql.raw(`
      CREATE TABLE users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          profile_image_url TEXT,
          bio TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `));
    
    // Verify the table was created correctly
    console.log("🔍 Verifying table schema...");
    const schema = await db.execute(sql.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `));
    
    console.log("✅ Users table created successfully with schema:", schema);
    res.json({ 
      message: "Database fix completed successfully", 
      status: "success",
      schema: schema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Database fix failed:", error);
    res.status(500).json({ 
      message: "Database fix failed", 
      error: error.message,
      stack: error.stack
    });
  }
});

// Health check endpoint for Render
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const { db } = await import("./db");
    if (!db) {
      throw new Error("Database not initialized");
    }
    // Simple query to test connection
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    });
  }
});

// Debug endpoint to manually recreate database
app.post("/debug/recreate-db", async (req, res) => {
  try {
    console.log("🔄 Manual database recreation requested");
    const { initializeDatabase } = await import("./dbInit");
    await initializeDatabase();
    res.json({ message: "Database recreated successfully" });
  } catch (error) {
    console.error("❌ Manual database recreation failed:", error);
    res.status(500).json({ 
      message: "Database recreation failed", 
      error: error.message,
      code: error.code 
    });
  }
});

// Register API routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error(`Error ${status}: ${message}`);
  res.status(status).json({ message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server with database initialization
const port = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    console.log("🚀 Starting LinkSphere server...");
    
    // TEMPORARILY DISABLED: Database initialization during startup
    // We'll use the emergency endpoint instead
    console.log("⚠️ Database initialization DISABLED during startup");
    console.log("📝 Use GET /emergency/create-tables to create database tables");
    
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`� Emergency tables: GET http://localhost:${port}/emergency/create-tables`);
    });
  } catch (error) {
    console.error("❌ CRITICAL: Failed to start server:", error);
    
    app.listen(port, () => {
      console.log(`⚠️ Server running on port ${port} (ERROR STATE)`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
    });
  }
}

startServer();
