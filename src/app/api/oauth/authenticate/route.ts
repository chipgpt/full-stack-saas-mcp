import { handleRequest } from '@/lib/handle-request';
import { User } from '@/server/models/user';
import { NextResponse } from 'next/server';
import { oauthServer } from '..';
import { OAuthError, Request, Response } from '@node-oauth/oauth2-server';

export const GET = handleRequest(async req => {
  const request = new Request({
    body: req.bodyUsed && (await req.json()),
    headers: Object.fromEntries(req.headers),
    method: req.method,
    query: Object.fromEntries(req.nextUrl.searchParams),
  });
  const nextResponse = NextResponse.next();
  const response = new Response(nextResponse);

  let userId: string | undefined;
  try {
    const data = await oauthServer.authenticate(request, response);
    userId = data.user.id;
    if (!userId) throw new Error('User not found');
    const user = await User.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return NextResponse.json({ id: user.id, name: user.name, profile: user.profile }, response);
  } catch (err) {
    return NextResponse.json(err instanceof Error ? { error: err.message } : err, {
      ...response,
      status: (err instanceof OAuthError && err.code) || 500,
    });
  }
});
