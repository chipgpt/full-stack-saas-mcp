import { Request, Response } from 'express';
import { CONFIG } from '../config';

export const oauthMetadata = (req: Request, res: Response) => {
  const metadata = {
    resource_name: 'chipgpt MCP',
    resource_documentation: `${CONFIG.oauth.authorizationServer}/mcp`,
    resource:
      CONFIG.nodeEnv === 'production'
        ? 'https://mcp.chipgpt.biz/mcp'
        : req.protocol + '://' + req.host + '/mcp',
    authorization_servers: [CONFIG.oauth.authorizationServer],
    bearer_methods_supported: ['header'],
    scopes_supported: ['read', 'write'],
    resource_policy_uri: 'https://chipgpt.biz/privacy-policy',
    resource_tos_uri: 'https://chipgpt.biz/terms-of-service',
  };

  res.json(metadata);
};

export const oauthAuthorizationServer = (req: Request, res: Response) => {
  const metadata = {
    issuer: `${CONFIG.oauth.authorizationServer}`,
    authorization_endpoint: `${CONFIG.oauth.authorizationServer}/authorize`,
    token_endpoint: `${CONFIG.oauth.authorizationServer}/api/oauth/token`,
    registration_endpoint: `${CONFIG.oauth.authorizationServer}/api/oauth/register`,
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    scopes_supported: ['read'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    op_policy_uri: `${CONFIG.oauth.authorizationServer}/privacy-policy`,
    op_tos_uri: `${CONFIG.oauth.authorizationServer}/terms-of-service`,
  };

  res.json(metadata);
};
