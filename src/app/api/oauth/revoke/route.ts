import { handleRequest } from '@/lib/handle-request';
import { NextResponse } from 'next/server';
import { OAuthAccessToken } from '@/server/models/oauth-access-token';

export const POST = handleRequest(async req => {
  const formData = await req.formData();
  const token = formData.get('token');
  const tokenTypeHint = formData.get('token_type_hint');

  await OAuthAccessToken.destroy({
    where: tokenTypeHint === 'refresh_token' ? { refreshToken: token } : { accessToken: token },
  });

  return NextResponse.json({});
});
