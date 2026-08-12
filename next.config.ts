import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'bcryptjs'],
  experimental: {
    serverActions: { bodySizeLimit: '32mb' },
  },
}

export default config
