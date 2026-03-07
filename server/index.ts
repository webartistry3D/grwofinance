import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import websocketService from "./websocket";
import { onlineUsersManager } from "./online-users";
import { initializeDatabase } from "./db";
import path from "path";
import fs from "fs";

/*import { exec } from "child_process";

if (process.env.RUN_DB_MIGRATION === "true") {
  exec("npx prisma db push", (error, stdout, stderr) => {
    if (error) {
      console.error(`Migration error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Migration stderr: ${stderr}`);
      return;
    }
    console.log(`Migration stdout: ${stdout}`);
  });
}*/

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000'
  ];
  
  if (process.env.NODE_ENV === 'development' && origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create HTTP server for WebSocket support
const server = createServer(app);

// Serve static files from local storage directory (for local storage driver)
// This must be configured before other middleware
const uploadsPath = path.join(process.cwd(), 'uploads', 'dev');
console.log('🔍 Serving static files from:', uploadsPath);
app.use('/uploads/dev', express.static(uploadsPath));

// Add middleware to log static file requests
app.use('/uploads/dev', (req, res, next) => {
  console.log('🔸 Static file request:', req.method, req.url);
  const fullPath = path.join(uploadsPath, req.url);
  console.log('🔸 Full path:', fullPath);
  console.log('🔸 File exists:', fs.existsSync(fullPath));
  next();
});

// Add a test route to verify static file serving
app.get('/test-static', (req, res) => {
  const testImagePath = path.join(uploadsPath, 'receipts', 'd4cddc05-3ff9-41e8-ac3e-4564c4d51df5', '2026', '02', '14bcea1e-a47a-470b-a053-857dc08191b6.jpg');
  console.log('🔍 Test image path:', testImagePath);
  console.log('🔍 Image exists:', fs.existsSync(testImagePath));
  res.json({ 
    uploadsPath,
    testImagePath,
    imageExists: fs.existsSync(testImagePath)
  });
});

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("🚀 Starting GrwoFinance Server...");
  
  // Initialize database tables
  try {
    await initializeDatabase();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    // Continue with server startup even if database init fails
  }
  
  // Initialize WebSocket service
  websocketService.initialize(server);
  console.log("✅ WebSocket service initialized");
  
  const httpServer = await registerRoutes(app);
  console.log("✅ Routes registered successfully");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Backend error:", err); // <-- log full error
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message, stack: err.stack }); // <-- include stack for dev
  });

  // In development, Vite handles both frontend and API proxy
  // In production, serve static files
  if (app.get("env") === "development") {
    console.log("🔧 Development mode: Setting up Vite...");
    await setupVite(app, server);
    console.log("✅ Vite setup completed");
  } else {
    console.log("🏭 Production mode: Serving static files...");
    serveStatic(app);
    console.log("✅ Static file serving enabled");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log("🎉 GrwoFinance Server started successfully!");
    console.log(`📊 Backend API: http://localhost:${port}`);
    console.log(`🎯 Frontend: http://localhost:5173`);
    console.log(`� WebSocket: ws://localhost:${port}/ws`);
    console.log(`💚 Development environment ready`);
    console.log(`🔗 Database: Connected to PostgreSQL`);
    console.log(`⚡ Server is running and ready to accept connections`);
    
    // Initialize real-time online users tracking
    onlineUsersManager.initialize(server);
    console.log("🟢 Real-time online users tracking initialized");
  });
})();
