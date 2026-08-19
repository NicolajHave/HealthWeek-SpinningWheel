import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Team photos are captured as JPEG from a canvas; the 1 MB default is too tight.
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
