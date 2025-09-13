import type { Express } from "express";
import { createServer, type Server } from "http";
import { nanoid } from "nanoid";
import { storage } from "./storage.js";
import { webSocketService } from "./services/websocket.js";
import { crewService } from "./services/crew.js";
import { GenerationRequest } from "../shared/types.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  webSocketService.initialize(httpServer);

  // API Routes
  app.post('/api/generate', async (req, res) => {
    try {
      const { requirements, framework, language } = req.body;
      
      if (!requirements || !framework || !language) {
        return res.status(400).json({ 
          error: 'Missing required fields: requirements, framework, language' 
        });
      }

      const jobId = `job_${nanoid()}`;
      const request: GenerationRequest = {
        jobId,
        requirements: requirements.trim(),
        framework,
        language,
        timestamp: new Date(),
      };

      // Start generation asynchronously
      crewService.startGeneration(request).catch(error => {
        console.error('Generation failed:', error);
      });

      res.json({ 
        success: true, 
        jobId,
        message: 'Code generation started',
        estimatedTime: '2-3 minutes'
      });
    } catch (error) {
      console.error('Generation request failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const jobStatus = crewService.getJobStatus(jobId);
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobStatus);
  });

  app.get('/api/jobs', (req, res) => {
    const activeJobs = crewService.getAllActiveJobs();
    res.json({ jobs: activeJobs });
  });

  app.get('/api/metrics', (req, res) => {
    const metrics = crewService.getSystemMetrics();
    const wsClients = webSocketService.getConnectedClients();
    
    res.json({
      ...metrics,
      connectedClients: wsClients,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connectedClients: webSocketService.getConnectedClients(),
    });
  });

  return httpServer;
}
