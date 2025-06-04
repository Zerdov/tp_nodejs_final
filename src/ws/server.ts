// wsServer.ts
import WebSocket, { WebSocketServer } from 'ws';
import { getAuthenticatedUser } from '../utils/auth';
import http from 'http';
import { User } from '../models/users';
import { getSharedUsersForPath } from '../models/files';

type Client = {
  userId: string;
  socket: WebSocket;
};

const clients: Client[] = [];

export const setupWebSocketServer = (server: http.Server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    try {
      // Authentification ici AVANT upgrade
      const user = await getAuthenticatedUser(request);
      if (!user) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, user);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request: any, user: User) => {
    const userId = user.id;

    clients.push({ userId, socket: ws });

    ws.on('close', () => {
      const index = clients.findIndex(c => c.socket === ws);
      if (index !== -1) clients.splice(index, 1);
    });
  });

  return wss;
};

export const notifyUsersForPath = async (filePath: string, data: any) => {
  const userIds = await getSharedUsersForPath(filePath);

  clients.forEach(({ userId, socket }) => {
    if (userIds.includes(userId) && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  });
};
