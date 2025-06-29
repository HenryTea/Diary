import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Vercel optimizations for Railway-to-Vercel communication
  experimental: {
    // Optimize for cold starts
    optimizeServerReact: true,
  },
  // Add compression and caching headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Fix for module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize for production builds
    if (!config.isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
