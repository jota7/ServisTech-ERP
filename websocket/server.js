/**
 * =============================================================================
 * SERVISTECH ERP V4.0 - WebSocket Server
 * Real-time notifications and live updates
 * =============================================================================
 */

const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

// Configuration
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Redis client for pub/sub
const redis = new Redis(REDIS_URL);
const redisSubscriber = new Redis(REDIS_URL);

// Connected clients map: userId -> WebSocket
const clients = new Map();

// Store rooms: storeId -> Set of userIds
const storeRooms = new Map();

// =============================================================================
// HTTP Server for health checks
// =============================================================================
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: clients.size,
      uptime: process.uptime()
    }));
    return;
  }

  // Metrics endpoint
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connections: clients.size,
      stores: storeRooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// =============================================================================
// WebSocket Server
// =============================================================================
const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
  console.log(`[WS] New connection from ${req.socket.remoteAddress}`);

  let userId = null;
  let storeId = null;
  let userRole = null;

  // Authentication timeout
  const authTimeout = setTimeout(() => {
    if (!userId) {
      console.log('[WS] Authentication timeout, closing connection');
      ws.close(4001, 'Authentication timeout');
    }
  }, 30000);

  // Handle messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          // Authenticate user
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET);
            userId = decoded.userId;
            storeId = decoded.storeId;
            userRole = decoded.role;
            
            clearTimeout(authTimeout);
            
            // Store client connection
            clients.set(userId, ws);
            
            // Join store room
            if (storeId) {
              if (!storeRooms.has(storeId)) {
                storeRooms.set(storeId, new Set());
              }
              storeRooms.get(storeId).add(userId);
            }
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              userId,
              storeId,
              timestamp: new Date().toISOString()
            }));
            
            console.log(`[WS] User ${userId} authenticated, store: ${storeId}`);
          } catch (err) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              error: 'Invalid token'
            }));
            ws.close(4002, 'Invalid token');
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        case 'subscribe_store':
          // Subscribe to store-specific updates
          if (userId && message.storeId) {
            if (!storeRooms.has(message.storeId)) {
              storeRooms.set(message.storeId, new Set());
            }
            storeRooms.get(message.storeId).add(userId);
            ws.send(JSON.stringify({
              type: 'subscribed',
              storeId: message.storeId
            }));
          }
          break;

        case 'unsubscribe_store':
          if (userId && message.storeId && storeRooms.has(message.storeId)) {
            storeRooms.get(message.storeId).delete(userId);
          }
          break;

        default:
          console.log(`[WS] Unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    clearTimeout(authTimeout);
    
    if (userId) {
      clients.delete(userId);
      
      // Remove from store rooms
      if (storeId && storeRooms.has(storeId)) {
        storeRooms.get(storeId).delete(userId);
        if (storeRooms.get(storeId).size === 0) {
          storeRooms.delete(storeId);
        }
      }
      
      console.log(`[WS] User ${userId} disconnected`);
    }
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error('[WS] WebSocket error:', err);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket server connected. Please authenticate.',
    timestamp: new Date().toISOString()
  }));
});

// =============================================================================
// Redis Pub/Sub for cross-server communication
// =============================================================================

// Subscribe to notification channels
redisSubscriber.subscribe('notifications', 'store_updates', 'rate_updates');

redisSubscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    
    switch (channel) {
      case 'notifications':
        // Send to specific user
        if (data.userId && clients.has(data.userId)) {
          clients.get(data.userId).send(JSON.stringify({
            type: 'notification',
            ...data
          }));
        }
        break;

      case 'store_updates':
        // Broadcast to all users in store
        if (data.storeId && storeRooms.has(data.storeId)) {
          const storeUsers = storeRooms.get(data.storeId);
          storeUsers.forEach(userId => {
            if (clients.has(userId)) {
              clients.get(userId).send(JSON.stringify({
                type: 'store_update',
                ...data
              }));
            }
          });
        }
        break;

      case 'rate_updates':
        // Broadcast rate updates to all connected clients
        clients.forEach((ws, userId) => {
          ws.send(JSON.stringify({
            type: 'rate_update',
            ...data
          });
        });
        break;
    }
  } catch (err) {
    console.error('[WS] Error processing Redis message:', err);
  }
});

// =============================================================================
// Helper functions for broadcasting
// =============================================================================

/**
 * Send notification to specific user
 */
function notifyUser(userId, notification) {
  redis.publish('notifications', JSON.stringify({
    userId,
    ...notification
  }));
}

/**
 * Broadcast update to all users in a store
 */
function broadcastToStore(storeId, update) {
  redis.publish('store_updates', JSON.stringify({
    storeId,
    ...update
  }));
}

/**
 * Broadcast rate update to all clients
 */
function broadcastRateUpdate(rateData) {
  redis.publish('rate_updates', JSON.stringify(rateData));
}

// Export functions for use by other modules
module.exports = {
  notifyUser,
  broadcastToStore,
  broadcastRateUpdate
};

// =============================================================================
// Start server
// =============================================================================
server.listen(PORT, () => {
  console.log(`[WS] WebSocket server running on port ${PORT}`);
  console.log(`[WS] Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WS] SIGTERM received, closing server...');
  
  // Close all client connections
  clients.forEach((ws) => ws.close());
  
  // Close Redis connections
  redis.disconnect();
  redisSubscriber.disconnect();
  
  server.close(() => {
    console.log('[WS] Server closed');
    process.exit(0);
  });
});
