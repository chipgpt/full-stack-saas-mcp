interface IConfig {
  nodeEnv: string;
  database: { ssl: boolean; url: URL };
  oauth: {
    authorizationServer: string;
  };
  posthog: {
    apiKey: string;
    host: string;
  };
  aws: {
    region: string;
  };
}

export const CONFIG: IConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    ssl: process.env.DATABASE_SSL === 'true',
    url: new URL(process.env.DATABASE_URL || 'postgres://username:password@localhost:5432/dbname'),
  },
  oauth: {
    authorizationServer:
      process.env.NODE_ENV === 'production' ? 'https://chipgpt.biz' : 'http://localhost:3000',
  },
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
};
