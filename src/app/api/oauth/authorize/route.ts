import { handleRequest } from '@/lib/handle-request';
import { getClient, oauthServer } from '@/lib/oauth';
import { NextResponse } from 'next/server';
import { Request, Response } from '@node-oauth/oauth2-server';
import { auth } from '@/auth';

export const GET = handleRequest(async req => {
  const request = new Request({
    headers: Object.fromEntries(req.headers),
    method: req.method,
    query: Object.fromEntries(req.nextUrl.searchParams),
  });
  const nextResponse = NextResponse.next();
  const response = new Response(nextResponse);

  // Something is converting the incoming redirect_uri from "127.0.0.1" to "localhost"
  // This uses the referer header to get the original redirect_uri if available.
  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer') || '');
    if (refererUrl.searchParams.has('redirect_uri') && request.query) {
      request.query.redirect_uri = refererUrl.searchParams.get('redirect_uri') || '';
    }
  }

  // The user must be logged in to our service
  // to be able to get an OAuth authorization code
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const sessionUser = session.user;

  const result = await oauthServer.authorize(request, response, {
    authenticateHandler: {
      handle: async () => {
        // Present in Flow 1 and Flow 2 ('client_id' is a required for /oauth/authorize
        const client_id = req.nextUrl.searchParams.get('client_id') || '';
        if (!client_id) throw new Error('Client ID not found');
        const client = await getClient(String(client_id));
        if (!client) throw new Error('Client not found');
        // Only present in Flow 2 (authentication screen)
        return sessionUser;
      },
    },
  });

  return NextResponse.json(result, response);
});
