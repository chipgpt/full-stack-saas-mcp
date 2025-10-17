import express from 'express';
import cors from 'cors';
import { sessionHandler, transportHandler } from './transport-handler';
import { oauthAuthorizationServer, oauthMetadata } from './oauth';
import { getSequelizeConnection } from '../models';
import { IUser } from '../models/user';
import { rateLimit } from 'express-rate-limit';
import { OAuthError, Request, Response, UnauthorizedRequestError } from '@node-oauth/oauth2-server';
import { oauthServer } from '../../lib/oauth';

// Initialize the DB connection
const sequelize = getSequelizeConnection(false);
sequelize.sync({ alter: { drop: false } });

export interface IUserSession {
  userId: string;
  sessionType: string;
  scope: string[];
  expiresAt?: Date;
  user: IUser;
  // Other things you want in the session
}

// Cache for OAuth 2.1 tokens
const sessionCache = new Map<string, IUserSession>();

declare global {
  namespace Express {
    export interface Request {
      authInfo?: IUserSession;
    }
  }
}

const app = express();

// Add CORS middleware before your MCP routes
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id', 'mcp-protocol-version'],
  })
);

// OAuth 2.1 endpoints
app.use('/.well-known/oauth-authorization-server/mcp', oauthAuthorizationServer);
app.use('/.well-known/oauth-authorization-server', oauthAuthorizationServer);
app.use('/.well-known/oauth-protected-resource/mcp', oauthMetadata);
app.use('/.well-known/oauth-protected-resource', oauthMetadata);

// Health check endpoint for AWS Load Balancer
app.get(['/', '/health'], (req, res) => {
  res.send('MCP Server is running');
});

// Rate limit requests to 10 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 20, // Limit each IP to 20 requests per `windowMs`
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth 2.1 token validation
app.use(async (req, res, next) => {
  const [, token] = (req.headers.authorization || '').split(' ') || [];

  if (token) {
    const cachedToken = sessionCache.get(token);
    if (cachedToken) {
      req.authInfo = cachedToken;
      next();
      return;
    }
  }

  // Authenticate the access token
  // inspiration: https://github.com/node-oauth/express-oauth-server/blob/master/index.js
  const request = new Request(req);
  const response = new Response(res);
  let oauthAccessToken;
  try {
    oauthAccessToken = await oauthServer.authenticate(request, response);
  } catch (e) {
    if (e instanceof OAuthError) {
      res.set(response.headers);
      res.status(e.code);

      if (e instanceof UnauthorizedRequestError) {
        res.send();
        return;
      }

      res.send({ error: e.name, error_description: e.message });
      return;
    }
    throw e;
  }

  const newSession: IUserSession = {
    userId: oauthAccessToken.user.id,
    sessionType: 'oauth',
    scope: oauthAccessToken.scope || [],
    expiresAt: oauthAccessToken.accessTokenExpiresAt,
    user: oauthAccessToken.user.get({ plain: true }),
  };
  sessionCache.set(token, newSession);

  req.authInfo = newSession;

  next();
});

// Handle POST requests for client-to-server communication
app.post('/mcp', (req, res) => transportHandler(req.authInfo)(req, res));

// Handle POST requests for client-to-server communication for the vault
app.post('/mcp/vault', (req, res) => transportHandler(req.authInfo, 'vault')(req, res));

// Handle GET requests for server-to-client notifications via SSE
app.get(['/mcp', '/mcp/vault'], (req, res) => sessionHandler(req.authInfo)(req, res));

// Handle DELETE requests for session termination
app.delete(['/mcp', '/mcp/vault'], (req, res) => sessionHandler(req.authInfo)(req, res));

app.listen(3333, () => {
  console.log('MCP server is running on port 3333');
});
