import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:4000/api/auth/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:4000/api/users/:path*',
      },
    ];
  },
};

export default nextConfig;
