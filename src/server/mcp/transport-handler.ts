import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { registerTools, registerVaultTools } from './tools';
import { CONFIG } from '../config';
import { deleteSession, getSession, setSession } from '../utils/aws';
import { IUserSession } from '.';
import { registerResources, registerVaultResources } from './resources';

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export const transportHandler =
  (userSession?: IUserSession, path?: string) => async (req: Request, res: Response) => {
    // Check for existing session ID
    const sessionId = String(req.headers['mcp-session-id'] || '');
    let transport: StreamableHTTPServerTransport;

    // Check if session ID is valid
    let mcpSession;
    if (sessionId) {
      const sessionKey = `${sessionId}-${userSession?.userId || ''}`;
      mcpSession = await getSession(sessionKey);
      if (!mcpSession) {
        // Invalid session
        res.set('WWW-Authenticate', 'Bearer realm="Service"');
        res.status(401).send({ error: 'unauthorized_request' });
        return;
      }
    }

    // Set up the transport
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (sessionId || isInitializeRequest(req.body)) {
      // Revive the session into a new transport
      // or create a new transport if no session ID is provided
      const { transport: tmpTransport, session: tmpMcpSession } = await createTransport(
        sessionId,
        userSession?.userId
      );
      transport = tmpTransport;
      mcpSession = tmpMcpSession;
      if (sessionId) {
        // @ts-ignore - This is a hack to make the transport work
        transport._initialized = true;
      }

      // Create a new MCP server
      const server = new McpServer(
        {
          name: 'chipgpt-mcp-server',
          version: '1.0.0',
        },
        {
          // Enable notification debouncing for specific methods
          // https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#improving-network-efficiency-with-notification-debouncing
          debouncedNotificationMethods: [
            'notifications/tools/list_changed',
            'notifications/resources/list_changed',
            'notifications/prompts/list_changed',
          ],
        }
      );

      // Register resources and tools
      if (path === 'vault') {
        registerVaultResources(server);
        registerVaultTools(server, mcpSession, userSession);
      } else {
        registerResources(server);
        registerTools(server, mcpSession, userSession);
      }

      // Connect the transport to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  };

// Reusable handler for GET and DELETE requests
export const sessionHandler = (userSession?: IUserSession) => async (req: Request, res: Response) => {
  const sessionId = String(req.headers['mcp-session-id'] || '');

  if (sessionId) {
    // Check DynamoDB for session
    const sessionKey = `${sessionId}-${userSession?.userId || ''}`;
    const session = await getSession(sessionKey);
    if (session) {
      // If transport exists, handle request
      if (transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res);
        return;
      } else if (req.method === 'GET') {
        // If transport does not exist, create new transport
        const { transport } = await createTransport(sessionId, userSession?.userId);
        await transport.handleRequest(req, res);
        return;
      } else {
        // If transport does not exist and method is DELETE, delete session from DynamoDB
        await deleteSession(sessionId);
        res.status(200).send('Session deleted');
        return;
      }
    }
  }

  res.status(400).send('Invalid or missing session ID');
};

// Create a new transport
const createTransport = async (sessionId?: string, userId?: string) => {
  sessionId = sessionId || randomUUID();
  const sessionKey = `${sessionId}-${userId || ''}`;

  // Get or create session
  const session = (await getSession(sessionKey)) || {
    id: sessionId,
    // Store any session state here
  };

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
    onsessioninitialized: async sessionId => {
      // Store the transport by session ID
      transports[sessionId] = transport;
      await setSession(sessionKey, session);
    },
    // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
    // locally, make sure to set enableDnsRebindingProtection: true
    ...(CONFIG.nodeEnv === 'production'
      ? {}
      : {
          enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        }),
  });

  // Clean up transport when closed
  transport.onclose = async () => {
    if (transport.sessionId) {
      delete transports[transport.sessionId];
      // TODO: Do we want to do this? What if they close the transport but want to reconnect same session?
      // await deleteSession(transport.sessionId);
    }
  };

  if (sessionId) {
    transport.sessionId = sessionId;
    transports[sessionId] = transport;
  }

  return { session, transport };
};
