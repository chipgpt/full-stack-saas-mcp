import { handleRequest } from '@/lib/handle-request';
import { oauthServer } from '..';
import { NextResponse } from 'next/server';
import { Request, Response } from '@node-oauth/oauth2-server';
import { OAuthClient } from '@/server/models/oauth-client';
import { auth } from '@/auth';

export const GET = handleRequest(async req => {
  const request = new Request({
    headers: Object.fromEntries(req.headers),
    method: req.method,
    query: Object.fromEntries(req.nextUrl.searchParams),
  });
  const nextResponse = NextResponse.next();
  const response = new Response(nextResponse);

  // The user must be logged in to our service
  // to be able to get an OAuth authorization code
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const sessionUser = session.user;

  const result = await oauthServer.authorize(request, response, {
    authenticateHandler: {
      handle: async () => {
        // Present in Flow 1 and Flow 2 ('client_id' is a required for /api/oauth/authorize)
        const client_id = req.nextUrl.searchParams.get('client_id') || '';
        if (!client_id) throw new Error('Client ID not found');
        const client = await OAuthClient.findByPk(String(client_id));
        if (!client) throw new Error('Client not found');
        // Only present in Flow 2 (authentication screen)
        const { id: userId } = sessionUser;
        return { id: userId };
      },
    },
  });

  return NextResponse.json(result, response);
});
