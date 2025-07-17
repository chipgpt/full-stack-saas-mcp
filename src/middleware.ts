import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Handle CORS for OAuth endpoints
  if (
    request.nextUrl.pathname.startsWith('/api/oauth') ||
    request.nextUrl.pathname.startsWith('/.well-known')
  ) {
    // Check if the request method is OPTIONS
    if (request.method === 'OPTIONS') {
      // Set the necessary headers for CORS preflight
      const preflightHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, mcp-protocol-version',
      };

      // Return an empty response with the preflight headers
      return NextResponse.json({}, { headers: preflightHeaders });
    }
  }

  // Handle Proxy for PostHog
  if (request.nextUrl.pathname.startsWith('/chipgpt/')) {
    let url = request.nextUrl.clone();
    const hostname = url.pathname.startsWith('/chipgpt/static/')
      ? 'us-assets.i.posthog.com'
      : 'us.i.posthog.com';
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('host', hostname);

    url.protocol = 'https';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = url.pathname.replace(/^\/chipgpt/, '');

    return NextResponse.rewrite(url, {
      headers: requestHeaders,
    });
  }

  return NextResponse.next();
}
