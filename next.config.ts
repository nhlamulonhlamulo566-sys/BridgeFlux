import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  // By default, fail builds on TypeScript/ESLint errors. Set env vars to override in exceptional cases.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_DISABLE_BUILD_CHECKS === 'true',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_DISABLE_ESLINT === 'true',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Silence client-side bundling warnings for OpenTelemetry dynamic requires
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Use IgnorePlugin to prevent bundling server-only OpenTelemetry internals into client
      const webpack = require('webpack');
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /@opentelemetry\// }));
    }
    return config;
  },
};

export default nextConfig;
