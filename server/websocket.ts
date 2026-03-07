// WebSocket server for real-time data communication
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { log } from './vite';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface ClientInfo {
  id: string;
  userId?: string;
  ws: WebSocket;
  lastActivity: Date;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientInfo> = new Map();
  private userClients: Map<string, Set<string>> = new Map(); // userId -> clientIds

  constructor() {
    this.setupHeartbeat();
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info) => {
        // Add any authentication logic here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    log('WebSocket server initialized on path: /ws');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();
    const clientInfo: ClientInfo = {
      id: clientId,
      ws,
      lastActivity: new Date()
    };

    this.clients.set(clientId, clientInfo);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      data: { clientId, status: 'connected' },
      timestamp: new Date().toISOString()
    });

    // Setup message handlers
    ws.on('message', (message: string) => {
      this.handleMessage(clientId, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      console.error(`Client ${clientId} WebSocket error:`, error);
      this.handleDisconnection(clientId);
    });

    log(`WebSocket client connected: ${clientId}`);
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, message: string) {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message);
      const clientInfo = this.clients.get(clientId);
      
      if (!clientInfo) return;

      clientInfo.lastActivity = new Date();

      switch (parsedMessage.type) {
        case 'authenticate':
          this.handleAuthentication(clientId, parsedMessage.data);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          });
          break;
        default:
          log(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error(`Error parsing message from client ${clientId}:`, error);
    }
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(clientId: string, data: any) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;

    const { userId } = data;
    if (userId) {
      // Remove from old user mapping if exists
      if (clientInfo.userId) {
        const oldUserClients = this.userClients.get(clientInfo.userId);
        if (oldUserClients) {
          oldUserClients.delete(clientId);
        }
      }

      // Update client info
      clientInfo.userId = userId;

      // Add to new user mapping
      if (!this.userClients.has(userId)) {
        this.userClients.set(userId, new Set());
      }
      this.userClients.get(userId)!.add(clientId);

      // Send authentication success
      this.sendToClient(clientId, {
        type: 'authenticated',
        data: { userId, status: 'success' },
        timestamp: new Date().toISOString()
      });

      log(`Client ${clientId} authenticated as user: ${userId}`);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;

    // Remove from user mapping
    if (clientInfo.userId) {
      const userClients = this.userClients.get(clientInfo.userId);
      if (userClients) {
        userClients.delete(clientId);
        if (userClients.size === 0) {
          this.userClients.delete(clientInfo.userId);
        }
      }
    }

    // Remove client
    this.clients.delete(clientId);
    log(`WebSocket client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo || clientInfo.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      clientInfo.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.handleDisconnection(clientId);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage, excludeClientId?: string) {
    let sentCount = 0;
    
    this.clients.forEach((clientInfo, clientId) => {
      if (clientId !== excludeClientId && this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    log(`Broadcasted message to ${sentCount} clients`);
    return sentCount;
  }

  /**
   * Send message to specific user's all connected clients
   */
  sendToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.userClients.get(userId);
    if (!userClients) return 0;

    let sentCount = 0;
    userClients.forEach(clientId => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    return sentCount;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get authenticated users count
   */
  getAuthenticatedUsersCount(): number {
    return this.userClients.size;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup heartbeat to clean up inactive connections
   */
  private setupHeartbeat() {
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach((clientInfo, clientId) => {
        if (now.getTime() - clientInfo.lastActivity.getTime() > inactiveThreshold) {
          log(`Removing inactive client: ${clientId}`);
          clientInfo.ws.terminate();
          this.handleDisconnection(clientId);
        }
      });
    }, 60000); // Check every minute
  }

  /**
   * Send expense update to all clients
   */
  broadcastExpenseUpdate(action: 'created' | 'updated' | 'deleted', expense: any, userId?: string) {
    const message: WebSocketMessage = {
      type: 'expense_update',
      data: {
        action,
        expense,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      userId
    };

    if (userId) {
      this.sendToUser(userId, message);
    } else {
      this.broadcast(message);
    }
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }) {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      userId
    };

    return this.sendToUser(userId, message);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
