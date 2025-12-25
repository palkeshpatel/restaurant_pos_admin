/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode for better performance (re-enable in production if needed)
  reactStrictMode: false,
  
  // Optimize for client-side rendering (admin panel doesn't need SSR)
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled - requires critters package
  },
  
  // Optimize images
  images: {
    unoptimized: true, // For admin panel, we don't need image optimization
  },
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Proxy API requests to Laravel backend (development only)
  async rewrites() {
    // Only proxy in development - in production, use direct API URL
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig

