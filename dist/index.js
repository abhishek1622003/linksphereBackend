"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const drizzle_orm_1 = require("drizzle-orm");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
// Middleware - Flexible CORS for deployment debugging
app.use((0, cors_1.default)({
    origin: true, // Allow all origins temporarily for debugging
    credentials: false, // Disable credentials to avoid CORS conflicts
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
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
    res.json({ message: "LinkSphere API Server v7 - FINAL BUILD", status: "running", timestamp: new Date().toISOString() });
});
// REAL FIX: Add missing name column to existing users table
app.get("/add-name-column", async (req, res) => {
    try {
        console.log("� Adding missing 'name' column to users table...");
        const { db } = await Promise.resolve().then(() => __importStar(require("./db")));
        const { sql } = await Promise.resolve().then(() => __importStar(require("drizzle-orm")));
        // Check current table structure
        console.log("📋 Checking current table structure...");
        const columns = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `));
        console.log("Current columns:", columns);
        // Check if name column already exists
        const hasNameColumn = columns.some(col => col.column_name === 'name');
        if (hasNameColumn) {
            console.log("✅ Name column already exists!");
            return res.json({
                message: "Name column already exists",
                status: "already_fixed",
                columns: columns
            });
        }
        // Add the missing name column
        console.log("➕ Adding name column...");
        await db.execute(sql.raw(`
      ALTER TABLE users 
      ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'User'
    `));
        // Verify the column was added
        const updatedColumns = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `));
        console.log("✅ Name column added successfully!");
        res.json({
            message: "Name column added successfully",
            status: "fixed",
            before: columns,
            after: updatedColumns
        });
    }
    catch (error) {
        console.error("❌ Failed to add name column:", error);
        res.status(500).json({
            message: "Failed to add name column",
            error: error.message,
            stack: error.stack
        });
    }
});
// Health check endpoint for Render
app.get("/health", async (req, res) => {
    try {
        // Test database connection
        const { db } = await Promise.resolve().then(() => __importStar(require("./db")));
        if (!db) {
            throw new Error("Database not initialized");
        }
        // Simple query to test connection
        await db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected"
        });
    }
    catch (error) {
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
        const { initializeDatabase } = await Promise.resolve().then(() => __importStar(require("./dbInit")));
        await initializeDatabase();
        res.json({ message: "Database recreated successfully" });
    }
    catch (error) {
        console.error("❌ Manual database recreation failed:", error);
        res.status(500).json({
            message: "Database recreation failed",
            error: error.message,
            code: error.code
        });
    }
});
// Debug endpoint to check database schema
app.get("/debug/schema", async (req, res) => {
    try {
        console.log("🔍 Checking database schema...");
        const { db } = await Promise.resolve().then(() => __importStar(require("./db")));
        const { sql } = await Promise.resolve().then(() => __importStar(require("drizzle-orm")));
        // Check current table structure
        const columns = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `));
        res.json({
            message: "Database schema check",
            status: "success",
            userTableColumns: columns,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("❌ Failed to check schema:", error);
        res.status(500).json({
            message: "Failed to check schema",
            error: error.message,
            stack: error.stack
        });
    }
});
// DEBUG: Test endpoint to manually check profile update
app.post('/api/debug/test-profile-update', async (req, res) => {
    try {
        console.log("🧪 DEBUG: Testing profile update manually");
        // Import here to avoid circular dependencies
        const { verifyFirebaseToken } = await Promise.resolve().then(() => __importStar(require("./middleware/auth")));
        const { storage } = await Promise.resolve().then(() => __importStar(require("./storage")));
        // Verify token manually
        const authResult = await new Promise((resolve, reject) => {
            verifyFirebaseToken(req, res, (error) => {
                if (error)
                    reject(error);
                else
                    resolve(req.user);
            });
        });
        const userId = req.user.uid;
        // Test data
        const testData = {
            firstName: "TestFirst",
            lastName: "TestLast",
            bio: "Test bio from debug endpoint"
        };
        console.log("🧪 Test user ID:", userId);
        console.log("🧪 Test data:", JSON.stringify(testData, null, 2));
        // Check current user data first
        console.log("🧪 Checking current user data...");
        const currentUser = await storage.getUser(userId);
        console.log("🧪 Current user:", JSON.stringify(currentUser, null, 2));
        // Try the update
        console.log("🧪 Attempting update...");
        const updatedUser = await storage.updateUserProfile(userId, testData);
        console.log("🧪 Update result:", JSON.stringify(updatedUser, null, 2));
        res.json({
            message: "Debug test completed",
            currentUser,
            testData,
            updatedUser
        });
    }
    catch (error) {
        console.error("🧪 DEBUG ERROR:", error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});
// DEBUG: Check database schema for users table
app.get('/api/debug/check-schema', async (req, res) => {
    try {
        console.log("🧪 DEBUG: Checking database schema");
        const { db } = await Promise.resolve().then(() => __importStar(require("./db")));
        const { sql } = await Promise.resolve().then(() => __importStar(require("drizzle-orm")));
        // Check table structure
        const columns = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `));
        console.log("🧪 Users table columns:", columns);
        // Check if we have any users
        const userCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM users`));
        console.log("🧪 Total users:", userCount);
        // Check a sample user
        const sampleUser = await db.execute(sql.raw(`
      SELECT id, email, first_name, last_name, bio, created_at, updated_at 
      FROM users 
      LIMIT 1
    `));
        console.log("🧪 Sample user:", sampleUser);
        res.json({
            message: "Schema check completed",
            columns,
            userCount: userCount[0],
            sampleUser: sampleUser[0] || null
        });
    }
    catch (error) {
        console.error("🧪 SCHEMA DEBUG ERROR:", error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});
// EMERGENCY FIX: Make first_name and last_name nullable
app.get('/api/debug/fix-columns', async (req, res) => {
    try {
        console.log("🔧 EMERGENCY FIX: Making name columns nullable");
        const { db } = await Promise.resolve().then(() => __importStar(require("./db")));
        const { sql } = await Promise.resolve().then(() => __importStar(require("drizzle-orm")));
        // Make first_name and last_name nullable
        console.log("🔧 Making first_name nullable...");
        await db.execute(sql.raw(`
      ALTER TABLE users 
      ALTER COLUMN first_name DROP NOT NULL
    `));
        console.log("🔧 Making last_name nullable...");
        await db.execute(sql.raw(`
      ALTER TABLE users 
      ALTER COLUMN last_name DROP NOT NULL
    `));
        // Set default values for existing users with empty names
        console.log("🔧 Setting default names for existing users...");
        await db.execute(sql.raw(`
      UPDATE users 
      SET first_name = 'User', last_name = 'Name'
      WHERE first_name = '' OR first_name IS NULL OR last_name = '' OR last_name IS NULL
    `));
        // Check the result
        const updatedColumns = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      AND column_name IN ('first_name', 'last_name')
      ORDER BY column_name
    `));
        console.log("✅ Columns fixed successfully!");
        res.json({
            message: "Emergency fix completed",
            updatedColumns
        });
    }
    catch (error) {
        console.error("❌ EMERGENCY FIX ERROR:", error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});
// Register API routes
(0, routes_1.registerRoutes)(app);
// Error handling middleware
app.use((err, _req, res, _next) => {
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
    }
    catch (error) {
        console.error("❌ CRITICAL: Failed to start server:", error);
        app.listen(port, () => {
            console.log(`⚠️ Server running on port ${port} (ERROR STATE)`);
            console.log(`🌐 Health check: http://localhost:${port}/health`);
        });
    }
}
startServer();
// Force build - v3.1 Mon Aug  4 01:07:09 IST 2025
