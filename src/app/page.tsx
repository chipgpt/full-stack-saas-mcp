'use client';

import { signIn } from 'next-auth/react';
import { Button } from './_components/Button';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center gap-5">
      <div>
        <Image
          alt="ChipGPT"
          className="rounded-full"
          width={100}
          height={100}
          src="/chipgpt-logo.png"
        />
      </div>
      <div className="flex flex-col gap-10 items-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-xl">ChipGPT</h1>
          <h2>Example TypeScript Full Stack SaaS Web App w/ MCP</h2>
          <Link
            href="https://github.com/chipgpt/full-stack-saas-mcp"
            target="_blank"
            className="text-center flex flex-row items-center gap-2 text-sm underline"
          >
            <svg
              role="img"
              height={20}
              width={20}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Source Code
          </Link>
        </div>
        <div className="text-center">
          <h3 className="text-xl">
            <strong>The Stack:</strong>
          </h3>
          <div>
            <strong>Web App</strong> (
            <Link href="https://nextjs.org/" target="_blank">
              NextJS
            </Link>{' '}
            +{' '}
            <Link href="https://authjs.dev/" target="_blank">
              AuthJS
            </Link>{' '}
            +{' '}
            <Link href="https://react.dev/" target="_blank">
              React
            </Link>
            )
          </div>
          <div>
            <strong>REST API</strong> (
            <Link href="https://nextjs.org/" target="_blank">
              NextJS
            </Link>{' '}
            +{' '}
            <Link href="https://authjs.dev/" target="_blank">
              AuthJS
            </Link>
            )
          </div>
          <div>
            <strong>OAuth2 Authentication Server</strong> (
            <Link href="https://nextjs.org/" target="_blank">
              NextJS
            </Link>{' '}
            +{' '}
            <Link href="https://github.com/node-oauth/node-oauth2-server" target="_blank">
              @node-oauth/oauth2-server
            </Link>
            )
          </div>
          <div>
            <strong>MCP Server Cluster</strong> (
            <Link href="https://expressjs.com/" target="_blank">
              Express
            </Link>{' '}
            +{' '}
            <Link href="https://github.com/modelcontextprotocol/typescript-sdk" target="_blank">
              MCP Typescript-SDK
            </Link>
            )
          </div>
        </div>
        <div className="">
          <strong>DEMO MCP Server URL</strong>{' '}
          <Link href="https://mcp.chipgpt.biz/mcp" target="_blank" className="underline">
            https://mcp.chipgpt.biz/mcp
          </Link>
        </div>
        <div>
          <Link href="https://tiktok.com/@chip.gpt" target="_blank" className="underline">
            TikTok
          </Link>{' '}
          |{' '}
          <Link href="mailto:hi@chipgpt.biz" className="underline">
            Biz Inquiries
          </Link>
        </div>
      </div>
      <Button onClick={() => signIn('cognito', { redirectTo: '/dashboard' })}>
        Log In To Demo
      </Button>
    </div>
  );
}
