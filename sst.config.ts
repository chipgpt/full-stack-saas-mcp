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
        mailgun: '3.5.10',
        stripe: '0.0.24',
      },
    };
  },
  async run() {
    const isProductionStage = $app.stage === 'production';

    // Validate required environment vars
    if (!process.env.AUTH_SECRET) {
      throw new Error('process.env.AUTH_SECRET is required');
    }
    if (!process.env.AWS_HOSTED_ZONE_ID) {
      throw new Error('process.env.AWS_HOSTED_ZONE_ID is required');
    }
    if (!process.env.SENDER_DOMAIN) {
      throw new Error('process.env.SENDER_DOMAIN is required');
    }
    if (!process.env.MAILGUN_API_KEY) {
      throw new Error('process.env.MAILGUN_API_KEY is required');
    }
    if (!process.env.STRIPE_API_KEY) {
      throw new Error('process.env.STRIPE_API_KEY is required');
    }

    // Environment variables we will expose to the functions and nextjs app
    const environment = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL || '',
      DATABASE_SSL: process.env.DATABASE_SSL || '',
      WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
      SENDER_DOMAIN: process.env.SENDER_DOMAIN || '',
      MAILGUN_API_KEY: process.env.MAILGUN_API_KEY || '',
      STRIPE_API_KEY: process.env.STRIPE_API_KEY || '',
    };

    // Create Mailgun domain and verify DNS sending records
    const mailgunEmail = new mailgun.Domain('MyMailgunDomain', {
      name: environment.SENDER_DOMAIN,
      webScheme: 'https',
    });
    const sendingRecord1 = mailgunEmail.sendingRecordsSets?.[0];
    const sendingRecord2 = mailgunEmail.sendingRecordsSets?.[1];
    const sendingRecord3 = mailgunEmail.sendingRecordsSets?.[2];
    if (sendingRecord1) {
      new aws.route53.Record('MyMailgunEmailSendingRecord1', {
        zoneId: process.env.AWS_HOSTED_ZONE_ID,
        name: sendingRecord1.name,
        type: sendingRecord1.recordType,
        ttl: 600,
        records: [sendingRecord1.value],
      });
    }
    if (sendingRecord2) {
      new aws.route53.Record('MyMailgunEmailSendingRecord2', {
        zoneId: process.env.AWS_HOSTED_ZONE_ID,
        name: sendingRecord2.name,
        type: sendingRecord2.recordType,
        ttl: 600,
        records: [sendingRecord2.value],
      });
    }
    if (sendingRecord3) {
      new aws.route53.Record('MyMailgunEmailSendingRecord3', {
        zoneId: process.env.AWS_HOSTED_ZONE_ID,
        name: sendingRecord3.name,
        type: sendingRecord3.recordType,
        ttl: 600,
        records: [sendingRecord3.value],
      });
    }

    // Create a linkable for the Mailgun API key to link to the app
    const mailgunLinkable = new sst.Linkable('MyMailgun', {
      properties: {
        key: environment.MAILGUN_API_KEY,
        domain: mailgunEmail.name,
      },
    });

    // Stripe products and prices
    const starterProduct = new stripe.Product('MyStarterProduct', {
      name: 'Starter',
      description: 'This is the starter plan',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      url: 'https://chipgpt.biz',
      taxCode: 'txcd_10000000',
    });
    const starterPrice = new stripe.Price('MyStarterPrice', {
      product: starterProduct.id,
      currency: 'usd',
      unitAmount: 900,
      taxBehaviour: 'exclusive',
      recurring: {
        interval: 'month',
        intervalCount: 1,
      },
    });
    const starterCoupon = new stripe.Coupon('MyStarterCoupon', {
      name: 'First month discount',
      amountOff: 800,
      duration: 'once',
      currency: 'usd',
      appliesTos: [starterProduct.id],
    });

    const stripeWebhook = new stripe.WebhookEndpoint('MyStripeWebhook', {
      url: `${environment.WEB_URL}/webhook/stripe`,
      enabledEvents: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ],
    });

    const stripeLinkable = new sst.Linkable('MyStripePlans', {
      properties: {
        apiKey: environment.STRIPE_API_KEY,
        plans: {
          starter: starterPrice.id,
        },
        coupons: {
          starter: starterCoupon.id,
        },
        webhookSecret: stripeWebhook.secret,
      },
    });

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
      link: [mailgunLinkable, stripeLinkable, pool, client].filter(Boolean),
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
      link: [mailgunLinkable, dynamoMCPSessionCache].filter(Boolean),
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
