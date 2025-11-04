import { handleRequest } from '@/lib/handle-request';
import { getClient } from '@/lib/oauth';
import { NextRequest, NextResponse } from 'next/server';

export const GET = handleRequest(async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  const client = await getClient(id);

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
