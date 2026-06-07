import { existsSync } from 'node:fs';

const defaultBackendUrl = existsSync('/.dockerenv')
  ? 'http://backend:3001'
  : 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || defaultBackendUrl;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
