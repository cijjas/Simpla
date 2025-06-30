import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Handle server external packages
  serverExternalPackages: ['https'],
};

export default nextConfig;
