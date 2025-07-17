import OAuth2Server, {
  AuthorizationCode,
  Client,
  RefreshToken,
  Token,
} from '@node-oauth/oauth2-server';
import { OAuthAccessToken } from '@/server/models/oauth-access-token';
import { OAuthAuthorizationCode } from '@/server/models/oauth-authorization-code';
import { OAuthClient } from '@/server/models/oauth-client';
import { User } from '@/server/models/user';

export const oauthServer = new OAuth2Server({
  model: {
    async getClient(clientId: string, clientSecret?: string) {
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
      };
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
        client: { id: code.client.id, grants: code.client.grants },
        user: { id: code.user.id },
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
        client: { id: client.id, grants: client.grants },
        user: { id: user.id },

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
        client: { id: token.client.id, grants: token.client.grants },
        user: { id: token.user.id },
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
        client: { id: token.client.id, grants: token.client.grants },
        user: { id: token.user.id },
      };
    },
  }, // See https://github.com/oauthjs/node-oauth2-server for specification
});
