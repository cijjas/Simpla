import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Configure Turbopack for SVG handling
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  webpack(config, { isServer }) {
    // Fix for "self is not defined" error in server-side builds
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);