import { NextResponse } from 'next/server';

const endpoint =
  process.env.NODE_ENV === 'production'
    ? 'https://mcp.chipgpt.biz/mcp'
    : 'http://localhost:3333/mcp';

export async function GET() {
  return NextResponse.json(
    {
      version: '1.0',
      servers: [
        {
          id: 'chipgpt-mcp',
          name: 'ChipGPT MCP',
          endpoint: endpoint,
          capabilities: ['resourced', 'tools'],
          authType: 'oauth2',
        },
      ],
    },
    { status: 200 }
  );
}
