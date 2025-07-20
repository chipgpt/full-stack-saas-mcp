import express from 'express';
import cors from 'cors';
import { sessionHandler, transportHandler } from './transport-handler';
import { oauthAuthorizationServer, oauthMetadata } from './oauth';
import { OAuthAccessToken } from '../models/oauth-access-token';
import { getSequelizeConnection } from '../models';
import { IUser, User } from '../models/user';
import { rateLimit } from 'express-rate-limit';

// Initialize the DB connection
const sequelize = getSequelizeConnection(false);
sequelize.sync({ alter: { drop: false } });

export interface ISession {
  userId: string;
  sessionType: string;
  scope: string[];
  expiresAt: Date;
  user: IUser;
  // Other things you want in the session
}

// Cache for OAuth 2.1 tokens
const sessionCache = new Map<string, ISession>();

declare global {
  namespace Express {
    export interface Request {
      authInfo?: ISession;
    }
  }
}

const app = express();

// Rate limit requests to 10 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 10, // Limit each IP to 10 requests per `windowMs`
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// OAuth 2.1 token validation
app.use(async (req, res, next) => {
  const [type, token] = (req.headers.authorization || '').split(' ') || [];
  if (!token || type !== 'Bearer') {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  if (token) {
    const cachedToken = sessionCache.get(token);
    if (cachedToken) {
      req.authInfo = cachedToken;
      next();
      return;
    }

    const oauthAccessToken = await OAuthAccessToken.findOne({
      where: { accessToken: token },
      include: [{ model: User, as: 'user' }],
    });
    if (!oauthAccessToken?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const newSession: ISession = {
      userId: oauthAccessToken.userId,
      sessionType: 'oauth',
      scope: oauthAccessToken.scope,
      expiresAt: oauthAccessToken.accessTokenExpiresAt,
      user: oauthAccessToken.user.get({ plain: true }),
    };
    sessionCache.set(token, newSession);

    req.authInfo = newSession;
  }

  next();
});

// Handle POST requests for client-to-server communication
app.post('/mcp', (req, res) => transportHandler(req.authInfo)(req, res));

// Handle POST requests for client-to-server communication for the vault
app.post('/mcp/vault', (req, res) => transportHandler(req.authInfo, 'vault')(req, res));

// Handle GET requests for server-to-client notifications via SSE
app.get(['/mcp', '/mcp/vault'], sessionHandler);

// Handle DELETE requests for session termination
app.delete(['/mcp', '/mcp/vault'], sessionHandler);

app.listen(3333, () => {
  console.log('MCP server is running on port 3333');
});
