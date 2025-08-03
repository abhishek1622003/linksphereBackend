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
  res.json({ message: "LinkSphere API Server", status: "running" });
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
    
    // Initialize database first - REQUIRED for proper operation
    console.log("📊 Initializing database...");
    const { initializeDatabase } = await import("./dbInit");
    await initializeDatabase();
    console.log("🎉 Database initialization completed!");
    
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`🛠️ Debug recreate DB: POST http://localhost:${port}/debug/recreate-db`);
    });
  } catch (error) {
    console.error("❌ CRITICAL: Failed to start server with database:", error);
    console.error("❌ Database initialization error:", error.message);
    console.error("❌ This is a critical error that prevents proper operation!");
    
    // Still start server but with warnings
    console.log("⚠️ Starting server in degraded mode...");
    
    app.listen(port, () => {
      console.log(`⚠️ Server running on port ${port} (DATABASE ISSUES PRESENT!)`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`🛠️ Debug recreate DB: POST http://localhost:${port}/debug/recreate-db`);
      console.log("❌ WARNING: Database is not properly initialized!");
    });
  }
}

startServer();
