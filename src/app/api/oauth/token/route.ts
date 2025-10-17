import { handleRequest } from '@/lib/handle-request';
import { Request, Response } from '@node-oauth/oauth2-server';
import { NextResponse } from 'next/server';
import { oauthServer } from '@/lib/oauth';

export const POST = handleRequest(async req => {
  const request = new Request({
    body: Object.fromEntries(await req.formData()),
    headers: Object.fromEntries(req.headers),
    method: req.method,
    query: Object.fromEntries(req.nextUrl.searchParams),
  });
  const nextResponse = NextResponse.next();
  const response = new Response(nextResponse);

  const result = await oauthServer.token(request, response, {
    alwaysIssueNewRefreshToken: false,
  });

  return NextResponse.json(
    { ...result, scope: result.scope?.join(' '), token_type: 'Bearer' },
    response
  );
});
