/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode for better performance (re-enable in production if needed)
  reactStrictMode: false,
  
  // Optimize for client-side rendering (admin panel doesn't need SSR)
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  
  // Optimize images
  images: {
    unoptimized: true, // For admin panel, we don't need image optimization
  },
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Proxy API requests to Laravel backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig

