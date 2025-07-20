import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { registerResources, registerTools, registerVaultTools } from './tools';
import { CONFIG } from '../config';
import { deleteSession, getSession, setSession } from '../utils/aws';
import { ISession } from '.';

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export const transportHandler =
  (user?: ISession, path?: string) => async (req: Request, res: Response) => {
    // Check for existing session ID
    const sessionId = String(req.headers['mcp-session-id'] || '');
    let transport: StreamableHTTPServerTransport;

    // Check if session ID is valid
    if (sessionId) {
      const session = await getSession(sessionId);
      if (!session.Items?.length) {
        // Invalid session
        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Session ID is not valid',
          },
          id: null,
        });
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
      transport = createTransport(sessionId);
      if (sessionId) {
        // @ts-ignore - This is a hack to make the transport work
        transport._initialized = true;
      }

      // Create a new MCP server
      const server = new McpServer({
        name: 'chipgpt-mcp',
        version: '1.0.0',
      });

      // Register resources and tools
      if (path === 'vault') {
        registerVaultTools(server, user);
      } else {
        registerResources(server, user);
        registerTools(server, user);
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
export const sessionHandler = async (req: Request, res: Response) => {
  const sessionId = String(req.headers['mcp-session-id'] || '');

  if (sessionId) {
    // Check DynamoDB for session
    const session = await getSession(sessionId);
    if (session.Items?.length) {
      // If transport exists, handle request
      if (transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res);
        return;
      } else if (req.method === 'GET') {
        // If transport does not exist, create new transport
        const transport = createTransport(sessionId);
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
const createTransport = (sessionId?: string) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId || randomUUID(),
    onsessioninitialized: async sessionId => {
      // Store the transport by session ID
      transports[sessionId] = transport;
      await setSession(sessionId, sessionId);
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

  return transport;
};
