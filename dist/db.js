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
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const serverless_1 = require("@neondatabase/serverless");
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const schema = __importStar(require("./schema"));
// Use the default WebSocket constructor in serverless environments
if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set. Using placeholder - database operations will fail.");
    process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}
let pool = null;
exports.pool = pool;
let db = null;
exports.db = db;
try {
    exports.pool = pool = new serverless_1.Pool({ connectionString: process.env.DATABASE_URL });
    exports.db = db = (0, neon_serverless_1.drizzle)({ client: pool, schema });
    console.log("✅ Database connection initialized");
}
catch (error) {
    console.error("❌ Database connection failed:", error);
    exports.pool = pool = null;
    exports.db = db = null;
}
