import { NextResponse } from 'next/server';
import { OAuthClientScopeEnum } from '../../../app/lib/oauth';
import { CONFIG } from '../../../server/config';

export async function GET() {
  return NextResponse.json(
    {
      issuer: CONFIG.oauth.authorizationServer,
      authorization_endpoint: `${CONFIG.oauth.authorizationServer}/authorize`,
      token_endpoint: `${CONFIG.oauth.authorizationServer}/api/oauth/token`,
      registration_endpoint: `${CONFIG.oauth.authorizationServer}/api/oauth/register`,
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      scopes_supported: Object.values(OAuthClientScopeEnum),
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      op_policy_uri: `${CONFIG.oauth.authorizationServer}/privacy-policy`,
      op_tos_uri: `${CONFIG.oauth.authorizationServer}/terms-of-service`,
      client_id_metadata_document_supported: true,
    },
    { status: 200 }
  );
}
