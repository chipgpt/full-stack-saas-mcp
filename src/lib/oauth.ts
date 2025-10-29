import OAuth2Server, {
  AuthorizationCode,
  Client,
  RefreshToken,
  Token,
} from '@node-oauth/oauth2-server';
import { OAuthAccessToken } from '../server/models/oauth-access-token';
import { OAuthAuthorizationCode } from '../server/models/oauth-authorization-code';
import { OAuthClient, OAuthClientScopeEnum } from '../server/models/oauth-client';
import { User } from '../server/models/user';
import axios from 'axios';
import { z } from 'zod';
import { isSSRFSafeURL } from 'ssrfcheck';
import { resolve } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getClientMetadata, setClientMetadata } from '@/server/utils/aws';

export const oauthServer = new OAuth2Server({
  allowEmptyState: true,
  model: {
    async getClient(clientId: string, clientSecret?: string) {
      return getClient(clientId, clientSecret);
    },
    async saveAuthorizationCode(code: AuthorizationCode, client: Client, user: User) {
      await OAuthAuthorizationCode.create({
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        scope: code.scope || [],
        clientId: client.id,
        userId: user.id,
        codeChallenge: code.codeChallenge,
        codeChallengeMethod: code.codeChallengeMethod,
      });
      return code;
    },
    async getAuthorizationCode(authorizationCode: string) {
      const code = await OAuthAuthorizationCode.findOne({
        where: { authorizationCode },
        include: [
          {
            model: User,
            as: 'user',
          },
          {
            model: OAuthClient,
            as: 'client',
          },
        ],
      });
      if (!code || !code.user || !code.client) throw new Error('Authorization code not found');
      return {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        scope: code.scope,
        client: code.client,
        user: code.user,
        codeChallenge: code.codeChallenge || undefined,
        codeChallengeMethod: code.codeChallengeMethod || undefined,
      };
    },
    async revokeAuthorizationCode(code: AuthorizationCode) {
      const res = await OAuthAuthorizationCode.destroy({
        where: { authorizationCode: code.authorizationCode },
      });
      return res === 1;
    },
    async revokeToken(token: RefreshToken) {
      const res = await OAuthAccessToken.destroy({ where: { refreshToken: token.refreshToken } });
      return res === 1;
    },
    async saveToken(token: Token, client: Client, user: User) {
      await OAuthAccessToken.create({
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        clientId: client.id,
        userId: user.id,
      });

      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: client,
        user: user,

        // other formats, i.e. for Zapier
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
      };
    },
    async getAccessToken(accessToken: string) {
      const token = await OAuthAccessToken.findOne({
        where: { accessToken },
        include: [
          {
            model: User,
            as: 'user',
          },
          {
            model: OAuthClient,
            as: 'client',
          },
        ],
      });
      if (!token || !token.user || !token.client) throw new Error('Access token not found');
      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        client: token.client,
        user: token.user,
      };
    },
    async getRefreshToken(refreshToken: string) {
      const token = await OAuthAccessToken.findOne({
        where: { refreshToken },
        include: [
          {
            model: User,
            as: 'user',
          },
          {
            model: OAuthClient,
            as: 'client',
          },
        ],
      });
      if (!token || !token.user || !token.client) throw new Error('Refresh token not found');
      return {
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: token.client,
        user: token.user,
      };
    },
    async validateScope(user, client, scope) {
      if (!scope?.every(s => VALID_SCOPES.indexOf(s as OAuthClientScopeEnum) >= 0)) {
        return false;
      }
      return scope;
    },
    async verifyScope(token, requestedScopes) {
      if (!token.scope) {
        return false;
      }
      const authorizedScopes = token.scope;
      return requestedScopes.every(scope => authorizedScopes.includes(scope));
    },
    async validateRedirectUri(redirectUri, client) {
      return !!client.redirectUris?.includes(redirectUri);
    },
  }, // See https://github.com/oauthjs/node-oauth2-server for specification
});

const VALID_SCOPES = Object.values(OAuthClientScopeEnum);

export async function getClient(clientId: string, clientSecret?: string) {
  let url;
  try {
    url = new URL(clientId);
  } catch {}

  // If the clientId is a valid url, do SSRF check and fetch client metadata
  if (url) {
    // # 2. Check the cache
    const cachedClientMetadata = await getClientMetadata(url.toString());
    if (cachedClientMetadata) {
      return convertClientMetadataToOAuthClient(cachedClientMetadata);
    }

    // # 2. If it's a domain name then resolve the IP to check it directly
    if (!isIP(url.hostname)) {
      // Resolve the IP from DNS
      const resolvedIps = await resolve(url.hostname, 'A');
      const ipAddress = resolvedIps.find(Boolean);
      if (!ipAddress) {
        throw new Error('Client URL is not valid');
      }
      // Replace the hostname with the resolved IP Address
      url.hostname = ipAddress;
    }

    // # 3. Perform SSRF check on the IP
    const isSafe = isSSRFSafeURL(url.toString(), {
      allowedProtocols: ['https'],
      autoPrependProtocol: false,
    });
    if (!isSafe) {
      throw new Error('Client URL is not allowed');
    }

    // # 4. Send request using resolved IP that was checked
    let response;
    try {
      response = await axios.get(url.toString(), {
        timeout: 5000,
        maxContentLength: 5120,
        maxRedirects: 0, // Avoid SSRF redirect attacks
        headers: {
          Accept: 'application/json',
          // use the original url domain hostname
          Host: new URL(clientId).hostname,
        },
      });
    } catch (e) {
      throw new Error('Unable to fetch client metadata');
    }

    // # 5. Check the response is a JSON
    if (
      !String(response.headers['content-type'] || '')
        .split(';')
        .map(s => s.trim())
        .includes('application/json')
    ) {
      throw new Error('Client URL must return a JSON response');
    }

    // # 6. Validate the response is a valid client metadata
    const result = cimdMetadataSchema.safeParse(response.data);
    if (!result.success) {
      throw new Error(
        `Client metadata is invalid: ${result.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    // # 7. Validate the client ID matches the requested client ID
    if (result.data.client_id !== clientId) {
      throw new Error('Client ID mismatch');
    }

    // # 8. Save the client metadata to the cache and database
    await setClientMetadata(url.toString(), result.data);
    const oauthClient = convertClientMetadataToOAuthClient(result.data);
    await OAuthClient.upsert(oauthClient);

    return oauthClient;
  }

  const client = await OAuthClient.findOne({
    where: {
      id: clientId,
      ...(clientSecret && { secret: clientSecret }),
    },
  });
  if (!client) throw new Error('Client not found');

  return {
    id: client.id,
    redirectUris: client.redirectUris,
    grants: client.grants,
    accessTokenLifetime: client.accessTokenLifetime,
    refreshTokenLifetime: client.refreshTokenLifetime,
    name: client.name,
    uri: client.uri,
    scope: client.scope,
  };
}

function convertClientMetadataToOAuthClient(clientMetadata: IOauthClientMetadata) {
  return {
    id: clientMetadata.client_id,
    redirectUris: clientMetadata.redirect_uris,
    grants: clientMetadata.grant_types || [],
    accessTokenLifetime: 7 * 24 * 60 * 60,
    refreshTokenLifetime: 30 * 24 * 60 * 60,
    name: clientMetadata.client_name,
    uri: clientMetadata.client_uri,
    scope: clientMetadata.scope?.split(' ') || [],
  };
}

export const createClientSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  token_endpoint_auth_method: z.enum(['none', 'client_secret_basic', 'client_secret_post']),
  grant_types: z.array(z.enum(['authorization_code', 'refresh_token'])).min(1),
  response_types: z.array(z.enum(['code', 'token'])).min(1),
  client_name: z.string().optional(),
  client_uri: z.string().url().optional(),
  logo_uri: z.string().url().optional(),
  scope: z.string().default('read').optional(),
  contacts: z.array(z.string()).optional(),
  tos_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  jwks_uri: z.string().url().optional(),
  jwks: z.object({ keys: z.array(z.object({})) }).optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
});

export const cimdMetadataSchema = z.object({
  client_id: z.string(),
  redirect_uris: z.array(z.string().url()).min(1),
  client_name: z.string().optional(),
  logo_uri: z.string().url().optional(),
  client_uri: z.string().url().optional(),
  tos_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.enum(['code', 'token'])).optional(),
  post_logout_redirect_uris: z.array(z.string().url()).optional(),
  scope: z.string().default('read').optional(),
  token_endpoint_auth_method: z
    .enum(['none', 'client_secret_basic', 'client_secret_post'])
    .optional(),
});

export type IOauthClientMetadata = z.infer<typeof cimdMetadataSchema>;
