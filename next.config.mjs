// Backend packages that should not be bundled
const packages = [
  'aws-lambda',
  'pg',
  'sequelize',
  'sharp',
  'uuid',
];

const remotePatterns = [{ hostname: 'via.placeholder.com' }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    if (!options.dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
  images: {
    remotePatterns: remotePatterns,
  },
  serverExternalPackages: packages,
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  rewrites: async () => {
    return [
      {
        source: '/.well-known/oauth-authorization-server/mcp',
        destination: '/.well-known/oauth-authorization-server',
      },
    ];
  },
  headers: async () => {
    // in Production, AWS CloudFront handles CORS so we don't need to set it here
    return process.env.NODE_ENV === 'production'
      ? []
      : [
          {
            source: '/api/oauth/:path*',
            headers: [
              { key: 'Access-Control-Allow-Origin', value: '*' },
              { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
              {
                key: 'Access-Control-Allow-Headers',
                value: 'Content-Type, Authorization, mcp-protocol-version',
              },
            ],
          },
          {
            source: '/.well-known/:path*',
            headers: [
              { key: 'Access-Control-Allow-Origin', value: '*' },
              { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
              {
                key: 'Access-Control-Allow-Headers',
                value: 'Content-Type, Authorization, mcp-protocol-version',
              },
            ],
          },
        ];
  },
};

export default nextConfig;
