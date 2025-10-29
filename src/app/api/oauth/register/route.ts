import { handleRequest } from '@/lib/handle-request';
import { NextResponse } from 'next/server';
import { OAuthClient, OAuthClientScopeEnum } from '@/server/models/oauth-client';
import { flatten } from 'lodash';
import { createClientSchema } from '@/lib/oauth';

export const POST = handleRequest(async req => {
  const body = await req.json();
  const result = createClientSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'invalid_client_metadata',
        error_description: result.error.issues.map(issue => issue.message).join(', '),
      },
      {
        status: 400,
      }
    );
  }

  const scope =
    flatten(
      result.data.scope
        ?.split(' ')
        .filter(Boolean)
        .map(s => s.split('+'))
    ) || Object.values(OAuthClientScopeEnum);
  const oauthClient = await OAuthClient.create({
    redirectUris: result.data.redirect_uris,
    grants: result.data.grant_types,
    scope,
    accessTokenLifetime: 7 * 24 * 60 * 60,
    refreshTokenLifetime: 30 * 24 * 60 * 60,
    name: result.data.client_name,
    uri: result.data.client_uri,
  });

  return NextResponse.json(
    {
      client_id: oauthClient.id,
      client_secret: oauthClient.secret,
      client_id_issued_at: Math.round(oauthClient.createdAt.getTime() / 1000),
      client_secret_expires_at: 0,
      redirect_uris: oauthClient.redirectUris,
      grants: oauthClient.grants,
      scope: oauthClient.scope.join(' '),
      client_name: oauthClient.name,
      client_uri: oauthClient.uri,
    },
    {
      status: 201,
    }
  );
});
