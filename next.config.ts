import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'bcryptjs', 'firebase-admin'],
  experimental: {
    serverActions: { bodySizeLimit: '32mb' },
  },
}

export default config
