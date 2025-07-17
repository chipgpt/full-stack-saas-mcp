/// <reference path="./.sst/platform/config.d.ts" />

import { config } from 'dotenv';

// Backend packages that should not be bundled
const packages = ['aws-lambda', 'pg', 'sequelize', 'sharp', 'uuid'];

export default $config({
  app(input) {
    return {
      name: 'chipgpt',
      // Retain the resources in production, remove in development
      removal: input.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          version: '6.66.2',
          // Use the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the environment variables if GitHub Action
          ...(process.env.CI === 'true'
            ? {
                accessKey: process.env.AWS_ACCESS_KEY_ID,
                secretKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : {
                profile:
                  input.stage === 'production' ? 'chipgpt-production' : 'chipgpt-development',
              }),
        },
      },
    };
  },
  async run() {
    const isProductionStage = $app.stage === 'production';
    const isDevelopmentStage = $app.stage === 'development';

    // Grab the .env based on stage
    if (isProductionStage) {
      config({ path: './.env.production.local', override: true });
    } else if (isDevelopmentStage) {
      config({ path: './.env.development.local', override: true });
    } else {
      config({ path: './.env.local', override: true });
    }

    // Validate required environment vars
    if (!process.env.AUTH_SECRET) {
      throw new Error('process.env.AUTH_SECRET is required');
    }

    // Environment variables we will expose to the functions and nextjs app
    const environment = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL || '',
      DATABASE_SSL: process.env.DATABASE_SSL || '',
      WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
    };

    // Create our VPC and add EC2 internet gateway
    const vpc = new sst.aws.Vpc('MyVpc', { nat: 'ec2' });
    const cluster = new sst.aws.Cluster('MyCluster', {
      vpc,
    });

    // Create a DynamoDB table for the MCP session cache
    const dynamoMCPSessionCache = new sst.aws.Dynamo('MyDynamoMCPSessionCache', {
      fields: {
        sessionId: 'string',
      },
      primaryIndex: { hashKey: 'sessionId' },
      ttl: 'expiresAt',
    });

    // Create Cognito authentication
    const pool = new sst.aws.CognitoUserPool('MyUserPool', {
      usernames: ['email'],
      // Optionally set up lambda hooks
      // triggers: {
      //   preAuthentication: "src/server/preAuthentication.main",
      //   postAuthentication: "src/server/postAuthentication.main",
      // },
    });
    const client = pool.addClient('MyUserPoolClient', {
      transform: {
        client(args, opts, name) {
          // These args help support authjs/next-auth
          args.generateSecret = true;
          args.allowedOauthFlowsUserPoolClient = true;
          args.callbackUrls = [`${environment.WEB_URL}/api/auth/callback/cognito`];
          args.allowedOauthFlows = ['code'];
        },
      },
    });

    // Create NextJS web deployment
    const nextjs = new sst.aws.Nextjs('MyWeb', {
      environment: {
        ...environment,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || '',
        // Add env specific to next-auth
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: String(!!environment.WEB_URL),
        AUTH_URL: `${environment.WEB_URL}/api/auth`,
      },
      link: [pool, client].filter(Boolean),
      domain: process.env.CUSTOM_DOMAIN
        ? {
            name: process.env.CUSTOM_DOMAIN,
            dns: sst.aws.dns({
              zone: process.env.AWS_HOSTED_ZONE_ID,
            }),
          }
        : undefined,
      server: {
        runtime: 'nodejs22.x',
        install: packages,
      },
      warm: isProductionStage ? 1 : 0,
      transform: {
        cdn(args) {
          args.defaultCacheBehavior = $resolve([args.defaultCacheBehavior]).apply(
            ([defaultCacheBehavior]) => {
              return {
                ...defaultCacheBehavior,
                // Adds the CORS with preflight response headers
                responseHeadersPolicyId: '5cc3b908-e619-4b99-88e5-2cf7f45965bd',
              };
            }
          );

          if (args.orderedCacheBehaviors) {
            args.orderedCacheBehaviors = $resolve([args.orderedCacheBehaviors]).apply(
              ([behaviors]) => {
                return behaviors.map(behavior =>
                  behavior.pathPattern === '/health'
                    ? {
                        ...behavior,
                        // Adds the CORS with preflight response headers
                        responseHeadersPolicyId: '5cc3b908-e619-4b99-88e5-2cf7f45965bd',
                      }
                    : behavior
                );
              }
            );
          }
        },
      },
    });

    const serviceMcp = new sst.aws.Service('MyMcpService', {
      cluster,
      image: {
        dockerfile: './Dockerfile.mcp',
        args: {
          platform: 'linux/amd64',
        },
      },
      loadBalancer: {
        rules: [
          process.env.CUSTOM_MCP_DOMAIN
            ? { listen: '443/https', forward: '3333/http' }
            : { listen: '80/http', forward: '3333/http' },
        ],
        domain: process.env.CUSTOM_MCP_DOMAIN
          ? {
              name: process.env.CUSTOM_MCP_DOMAIN,
              dns: sst.aws.dns({
                zone: process.env.AWS_HOSTED_ZONE_ID,
              }),
            }
          : undefined,
        health: {
          '3333/http': {
            path: '/health',
            interval: '10 seconds',
          },
        },
      },
      cpu: '0.5 vCPU',
      memory: '1 GB',
      environment: environment,
      link: [dynamoMCPSessionCache].filter(Boolean),
      dev: {
        command: 'npm run dev:mcp',
      },
      transform: {
        taskDefinition(args) {
          args.containerDefinitions = $resolve([args.containerDefinitions]).apply(
            ([containerDefinitions]) => {
              const definitions = JSON.parse(containerDefinitions);
              const healthCheck = {
                command: [
                  'CMD-SHELL',
                  `node -e "require('http').get('http://localhost:3333/health', res => { process.exit(res.statusCode === 200 ? 0 : 1) });" || exit 1`,
                ],
                interval: 30,
                timeout: 5,
                retries: 2,
                startPeriod: 120,
              };
              if (definitions[0]) {
                definitions[0].healthCheck = healthCheck;
              } else {
                definitions.push({
                  healthCheck: healthCheck,
                });
              }
              return JSON.stringify(definitions);
            }
          );
        },
        target(args) {
          args.healthCheck = $resolve([args.healthCheck]).apply(([healthCheck]) => {
            if (healthCheck) {
              healthCheck.path = '/health';
              return healthCheck;
            }
            return {
              path: '/health',
            };
          });
        },
      },
    });

    return {
      web_url: nextjs.url,
      pool_id: pool.id,
      client_id: client.id,
      client_secret: client.secret,
      service_mcp_url: serviceMcp.url,
      mcp_session_cache_table_name: dynamoMCPSessionCache.name,
    };
  },
});
