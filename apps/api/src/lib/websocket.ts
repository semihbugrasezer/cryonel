// apps/api/src/lib/websocket.ts
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import { authLogger } from './logger';
import { env } from './env';

interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    isAlive?: boolean;
}

export class CryonelWebSocketServer {
    private wss: WebSocketServer;
    private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

    constructor(server: HttpServer) {
        this.wss = new WebSocketServer({
            server,
            path: '/ws',
            verifyClient: this.verifyClient.bind(this)
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.setupHeartbeat();

        authLogger.info('WebSocket server initialized');
    }

    private verifyClient(info: any): boolean {
        try {
            const url = new URL(info.req.url, 'http://localhost');
            const token = url.searchParams.get('token');

            if (!token) {
                authLogger.warn('WebSocket connection rejected: no token provided');
                return false;
            }

            const decoded = verify(token, env.JWT_SECRET) as any;
            info.req.userId = decoded.sub;
            return true;
        } catch (error) {
            authLogger.warn({ error: error instanceof Error ? error.message : String(error) }, 'WebSocket connection rejected: invalid token');
            return false;
        }
    }

    private handleConnection(ws: AuthenticatedWebSocket, req: any) {
        const userId = req.userId;
        ws.userId = userId;
        ws.isAlive = true;

        // Add client to user's connection list
        if (!this.clients.has(userId)) {
            this.clients.set(userId, []);
        }
        this.clients.get(userId)!.push(ws);

        authLogger.info({ userId, totalConnections: this.wss.clients.size }, 'WebSocket client connected');

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            data: { message: 'Connected to CRYONEL WebSocket server' }
        }));

        // Handle messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(ws, message);
            } catch (error) {
                authLogger.warn({ userId, error: error instanceof Error ? error.message : String(error) }, 'Invalid WebSocket message format');
            }
        });

        // Handle pong responses
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Handle disconnection
        ws.on('close', () => {
            this.removeClient(userId, ws);
            authLogger.info({ userId, totalConnections: this.wss.clients.size }, 'WebSocket client disconnected');
        });

        ws.on('error', (error) => {
            authLogger.error({ userId, error: error.message }, 'WebSocket error');
            this.removeClient(userId, ws);
        });
    }

    private handleMessage(ws: AuthenticatedWebSocket, message: any) {
        const { type, data } = message;

        switch (type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }));
                break;

            case 'subscribe':
                // Handle subscription to specific channels (trades, performance, etc.)
                if (data.channel) {
                    // Store subscription info (could be enhanced with Redis for multi-instance)
                    authLogger.info({ userId: ws.userId, channel: data.channel }, 'Client subscribed to channel');
                }
                break;

            case 'unsubscribe':
                // Handle unsubscription
                if (data.channel) {
                    authLogger.info({ userId: ws.userId, channel: data.channel }, 'Client unsubscribed from channel');
                }
                break;

            default:
                authLogger.warn({ userId: ws.userId, type }, 'Unknown WebSocket message type');
        }
    }

    private removeClient(userId: string, ws: AuthenticatedWebSocket) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const index = userClients.indexOf(ws);
            if (index > -1) {
                userClients.splice(index, 1);
            }
            if (userClients.length === 0) {
                this.clients.delete(userId);
            }
        }
    }

    private setupHeartbeat() {
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
                if (!ws.isAlive) {
                    authLogger.info({ userId: ws.userId }, 'Terminating inactive WebSocket connection');
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds

        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }

    // Public methods to broadcast messages
    public broadcastToUser(userId: string, message: any) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const messageStr = JSON.stringify(message);
            userClients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(messageStr);
                }
            });
        }
    }

    public broadcastToAll(message: any) {
        const messageStr = JSON.stringify(message);
        this.wss.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    // Send trade updates
    public sendTradeUpdate(userId: string, trade: any) {
        this.broadcastToUser(userId, {
            type: 'trade_update',
            data: trade
        });
    }

    // Send performance updates
    public sendPerformanceUpdate(userId: string, performance: any) {
        this.broadcastToUser(userId, {
            type: 'performance_update',
            data: performance
        });
    }

    // Send connection status updates
    public sendConnectionUpdate(userId: string, connections: any) {
        this.broadcastToUser(userId, {
            type: 'connection_update',
            data: connections
        });
    }

    public getStats() {
        return {
            totalConnections: this.wss.clients.size,
            authenticatedUsers: this.clients.size,
            userConnections: Array.from(this.clients.entries()).map(([userId, clients]) => ({
                userId,
                connections: clients.length
            }))
        };
    }
}

// Export singleton instance
let wsServer: CryonelWebSocketServer | null = null;

export function initializeWebSocketServer(server: HttpServer): CryonelWebSocketServer {
    if (!wsServer) {
        wsServer = new CryonelWebSocketServer(server);
    }
    return wsServer;
}

export function getWebSocketServer(): CryonelWebSocketServer | null {
    return wsServer;
}
