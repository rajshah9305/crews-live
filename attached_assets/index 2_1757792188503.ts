// server/src/index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { nanoid } from "nanoid";
import winston from "winston";
import { enhancedCodeGenerationService } from "./services/enhanced-code-generation.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    cerebrasEnabled: !!process.env.CEREBRAS_API_KEY
  });
});

// Service statistics endpoint
app.get('/api/stats', (req, res) => {
  const stats = enhancedCodeGenerationService.getStatistics();
  res.json(stats);
});

// Job status endpoint
app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const status = enhancedCodeGenerationService.getJobStatus(jobId);
  res.json(status);
});

// Active jobs endpoint
app.get('/api/jobs', (req, res) => {
  const jobs = enhancedCodeGenerationService.getActiveJobs();
  res.json(jobs);
});

// Cancel job endpoint
app.delete('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const result = enhancedCodeGenerationService.cancelJob(jobId);
  res.json(result);
});

// Code generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { requirements, framework, language } = req.body;
    
    // Validation
    if (!requirements || !framework || !language) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requirements, framework, language'
      });
    }

    // Generate job ID
    const jobId = nanoid();
    
    // Start async generation
    setImmediate(() => {
      enhancedCodeGenerationService.startGeneration({
        jobId,
        requirements: requirements.trim(),
        framework: framework.trim(),
        language: language.trim()
      });
    });

    res.json({
      success: true,
      jobId,
      message: 'Code generation started',
      estimatedTime: '30-60 seconds'
    });

  } catch (error) {
    logger.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start code generation'
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist/client');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development mode - Vite handles static serving
  app.get('/', (req, res) => {
    res.json({
      message: 'CrewCodeGen Live API Server',
      status: 'Development Mode',
      docs: '/api/health for health check',
      endpoints: {
        health: 'GET /api/health',
        stats: 'GET /api/stats',
        generate: 'POST /api/generate',
        jobs: 'GET /api/jobs',
        jobStatus: 'GET /api/jobs/:jobId',
        cancelJob: 'DELETE /api/jobs/:jobId'
      }
    });
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.IO connection handling
const activeConnections = new Map<string, any>();

io.on('connection', (socket) => {
  const clientId = socket.id;
  
  logger.info(`Client connected: ${clientId}`);
  activeConnections.set(clientId, {
    socket,
    connectedAt: new Date(),
    lastActivity: new Date()
  });

  // Send connection confirmation
  socket.emit('connection_established', {
    clientId,
    status: 'connected',
    timestamp: new Date().toISOString()
  });

  // Handle client disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
    activeConnections.delete(clientId);
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    const connection = activeConnections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
      socket.emit('pong', { timestamp: new Date().toISOString() });
    }
  });

  // Update last activity on any message
  socket.onAny(() => {
    const connection = activeConnections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  });
});

// Enhanced code generation service event handlers
enhancedCodeGenerationService.on('generation_started', (data) => {
  io.emit('generation_started', {
    type: 'generation_started',
    data,
    timestamp: new Date().toISOString()
  });
  logger.info(`🚀 Generation started: ${data.jobId}`);
});

enhancedCodeGenerationService.on('agent_started', (data) => {
  io.emit('agent_started', {
    type: 'agent_started',
    data,
    timestamp: new Date().toISOString()
  });
  logger.info(`👤 Agent started: ${data.role} for job ${data.jobId}`);
});

enhancedCodeGenerationService.on('agent_completed', (data) => {
  io.emit('agent_completed', {
    type: 'agent_completed',
    data,
    timestamp: new Date().toISOString()
  });
  logger.info(`✅ Agent completed: ${data.role} for job ${data.jobId}`);
});

enhancedCodeGenerationService.on('generation_completed', (data) => {
  io.emit('generation_completed', {
    type: 'generation_completed',
    data,
    timestamp: new Date().toISOString()
  });
  logger.info(`🎉 Generation completed: ${data.jobId} (${data.duration}ms)`);
});

enhancedCodeGenerationService.on('generation_failed', (data) => {
  io.emit('generation_failed', {
    type: 'generation_failed',
    data,
    timestamp: new Date().toISOString()
  });
  logger.error(`❌ Generation failed: ${data.jobId} - ${data.error}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 CrewCodeGen Live server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 WebSocket server ready for connections`);
  
  if (process.env.CEREBRAS_API_KEY) {
    logger.info(`🤖 Cerebras API integration: ENABLED`);
  } else {
    logger.warn(`🤖 Cerebras API integration: DISABLED (simulation mode)`);
  }
  
  logger.info(`📊 Enhanced multi-agent system: READY`);
  logger.info(`🎯 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;

