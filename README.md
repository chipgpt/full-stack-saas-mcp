# Example Full Stack SaaS Web App w/ MCP

I have been a software developer working on SaaS platforms for over 15 years. This example project compresses my years of knowledge into a fully functional Software as a Service (SaaS) platform that can be deployed to AWS using IaC and GitHub Actions. It's certainly not perfect, but I hope that this will help some up and coming SaaS entrepreneurs see a scalable, production-level build from end to end.

[Live Demo | chipgpt.biz](https://chipgpt.biz)

## The Stack:

- Web App ([NextJS](https://nextjs.org/) + [AuthJS](https://authjs.dev/) + [React](https://react.dev/)) - Deployed to AWS Lambda
- REST API ([NextJS](https://nextjs.org/) + [AuthJS](https://authjs.dev/)) - Deployed to AWS Lambda
- OAuth2 Authentication Server ([NextJS](https://nextjs.org/) + [@node-oauth/oauth2-server](https://github.com/node-oauth/node-oauth2-server)) - Deployed to AWS Lambda
- MCP Server Cluster ([Express](https://expressjs.com/) + [MCP Typescript-SDK](https://github.com/modelcontextprotocol/typescript-sdk)) - Deployed to AWS ECS
- Web Analytics ([PostHog](https://posthog.com/))

## Architecture:

It uses Infrastructure as Code (IaC) using [SST](https://sst.dev). It deploys to AWS using GitHub Actions. This is the current architecture of the live demo:

![Architecture Diagram](https://chipgpt.biz/architecture-diagram.png)

## Requirements:

- AWS account with SSO set up in `~/.aws/config` [Setup Guide](https://sst.dev/docs/aws-accounts)
- AWS CLI [Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Docker for local postgres database [Install Docker](https://www.docker.com/products/docker-desktop/)
- You must also bring your own production postgres database or you need to add RDS to the SST stack. I use [Digital Ocean managed databases](https://www.digitalocean.com/products/managed-databases-postgresql).
- Your domain should be set up in Route 53 and you will need the Hosted Zone ID for cloud deployments (not needed for local deployments).
- IAM user access key/secret [Setup Guide](https://guide.sst.dev/chapters/create-an-iam-user.html) and [Permissions Guide](https://sst.dev/docs/iam-credentials/#iam-permissions)

You can do a global find for `chipgpt` (case insensitive) and locate most things that need to be updated with your own project name and description.

## How to set up the project:

Log in to AWS SSO:

```bash
npm run sso
```

Copy the `.env` file and populate them. You don't need a development cloud deployment but it supports it if you want a staging server eventually:

```bash
cp .env .env.local
cp .env .env.development.local
cp .env .env.production.local
```

Install dependencies:

```bash
npm install
```

Start local postgresql database:

```bash
npm run docker:up
```

Start a local deployment:

```bash
npx sst dev
```

> **NOTE:** If you run into this error when trying to `npx sst dev`, it usually means you need to `npm run sso` to reauthorize with AWS.
>
> ```bash
> ✕  Unexpected error occurred. Please run with --print-logs or check .sst/log/sst.log if available.
> ```

After starting up new environments for the first time, you will need to update the newly Amazon Cognito Pool's domain in AWS console.

**Log in to AWS Console** > **Amazon Cognito** > **User Pools** > **select user pool** > **Domain** > **set a domain for your cognito pool and make sure to set "Hosted UI (classic)"**

> **NOTE:** You may be able to use the new UI if you set it all up, but I have not done that. So if you just wanna get this up and running, then you should go with Hosted for now and plan to try to update later.

At this point you should have the stack running locally. Some of the resources are in AWS but your code is all executed locally and is not deployed to AWS. SST has a cool multiplexer that you can use to monitor the apps locally as well. Everything updates live when you save files.

- Default Web URL is: http://localhost:3000
- Default Web Dashboard is: http://localhost:3000/dashboard
- Default API URL is: http://localhost:3000/api
- Default OAuth URL is: http://localhost:3000/api/oauth
- Default MCP server URL is: http://localhost:3333/mcp

## Local Live Deployment:

Make sure docker database is running:

```bash
npm run docker:up
```

Make sure you are logged in:

```bash
npm run sso
```

Start up the local deployment:

```bash
npx sst dev
```

## MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

## Cloud Deployment:

```bash
npm run deploy:production
```

If this is the first deployment, you will need to update your Amazon Cognito Pool's domain in AWS console after it gets deployed.

**Log in to AWS Console** > **Amazon Cognito** > **User Pools** > **select user pool** > **Domain** > **set a domain for your cognito pool and make sure to set "Hosted UI (classic)"**

> **NOTE:** You may be able to use the new UI if you set it all up, but I have not done that. So if you just wanna get this up and running, then you should go with Hosted for now and plan to try to update later.

## GitHub Actions Setup:

To get the GitHub action deployment working you will need an IAM user with access/secret key and add secrets to your repo (see [Requirements](#requirements)).

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AUTH_SECRET
- DATABASE_URL
- AWS_HOSTED_ZONE_ID
- NEXT_PUBLIC_POSTHOG_KEY (not really a "secret", it could be a variable instead)

## Things I intend to add as I add them to my own SaaS:

- Add a paid account tier (most likely using Stripe as the payment gateway)
- Support for Amazon RDS + Proxy (had trouble getting it working with Sequelize, didn't feel like finding a new ORM)
- Add Alarms/Alerts for cloud deployments to be proactive about issues.
- Add a propper logging utility that works better with AWS CloudWatch.
- Auto-Generate REST API Documentation.
- Update to use the new Cognito UI mode.

## Feedback & Questions:

I'm happy to take feedback or answer questions as I am able to. Submit an issue to the repository and I'll do my best to respond in a timely manner.

## Follow me on TikTok:

If you found this helpful, please star this repo and follow me on TikTok: [@Chip.GPT](https://tiktok.com/@chip.gpt)

[Biz Inquiries](mailto:hi@chipgpt.biz)
