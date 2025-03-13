/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:3005'],
    },
  },
  // Disable webpack persistent caching to prevent ENOENT errors
  webpack: (config, { dev, isServer }) => {
    // Disable the persistent caching
    config.cache = false;
    
    return config;
  },
  // Improve static file handling
  poweredByHeader: false,
  // Ensure static files are properly cached
  staticPageGenerationTimeout: 120,
  // Add additional allowed origins for development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
