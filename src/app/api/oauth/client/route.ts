import { handleRequest } from '@/lib/handle-request';
import { OAuthClient } from '@/server/models/oauth-client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = handleRequest(async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  const client = await OAuthClient.findByPk(id);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: client.id,
      redirectUris: client.redirectUris,
      scope: client.scope,
      name: client.name,
      uri: client.uri,
    },
  });
});
