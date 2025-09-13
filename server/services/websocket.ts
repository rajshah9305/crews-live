import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketEvent } from '../../shared/types.js';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  joinTime: Date;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientConnection>();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: false 
    });

    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const connection: ClientConnection = {
        id: clientId,
        ws,
        joinTime: new Date(),
      };

      this.clients.set(clientId, connection);
      console.log(`Client connected: ${clientId} (${this.clients.size} total)`);

      // Send connection confirmation
      this.sendToClient(clientId, {
        type: 'connection_established',
        data: { 
          clientId, 
          serverTime: new Date().toISOString(),
          connectedClients: this.clients.size
        },
        timestamp: new Date().toISOString(),
      });

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId} (${this.clients.size} remaining)`);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    console.log('WebSocket server initialized on path: /ws');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any) {
    console.log(`Message from ${clientId}:`, message);
    
    // Handle different message types
    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong' as any,
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
        break;
      
      case 'subscribe_job':
        // Client wants to subscribe to updates for a specific job
        console.log(`Client ${clientId} subscribed to job ${message.jobId}`);
        break;
        
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  sendToClient(clientId: string, event: WebSocketEvent) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(event));
    }
  }

  broadcast(event: WebSocketEvent) {
    const message = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getClientInfo() {
    return Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      joinTime: client.joinTime,
      readyState: client.ws.readyState,
    }));
  }
}

export const webSocketService = new WebSocketService();

export const broadcastToClients = (event: WebSocketEvent) => {
  webSocketService.broadcast(event);
};

export const sendToClient = (clientId: string, event: WebSocketEvent) => {
  webSocketService.sendToClient(clientId, event);
};
