import { handleRequest } from '@/lib/handle-request';
import { NextResponse } from 'next/server';
import z from 'zod';
import { OAuthClient } from '@/server/models/oauth-client';
import { flatten } from 'lodash';

export const POST = handleRequest(async req => {
  const body = await req.json();
  const result = z
    .object({
      redirect_uris: z.array(z.string().url()).min(1),
      token_endpoint_auth_method: z.enum(['none', 'client_secret_basic', 'client_secret_post']),
      grant_types: z.array(z.string()).min(1),
      response_types: z.array(z.enum(['code', 'token'])).min(1),
      client_name: z.string().min(1),
      client_uri: z.string().url().optional(),
      scope: z.string().default('read').optional(),
    })
    .safeParse(body);
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

  const scope = flatten(result.data.scope?.split(' ').filter(Boolean).map(s => s.split('+'))) || ['read', 'write'];
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
      client_id_issued_at: oauthClient.createdAt.getTime() / 1000,
      client_secret_expires_at: 0,
      redirect_uris: oauthClient.redirectUris,
      scope: oauthClient.scope.join(' '),
    },
    {
      status: 201,
    }
  );
});
