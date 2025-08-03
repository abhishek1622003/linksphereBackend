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
    // Initialize database first
    const { initializeDatabase } = await import("./dbInit");
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.log("⚠️ Starting server anyway (database issues may persist)");
    
    app.listen(port, () => {
      console.log(`⚠️ Server running on port ${port} (with database issues)`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
    });
  }
}

startServer();
