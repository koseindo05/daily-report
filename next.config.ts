import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Only lint src directory, ignore parallel work directories
    dirs: ['src'],
  },
  typescript: {
    // Only check src directory during build
    ignoreBuildErrors: false,
  },
}

export default nextConfig
