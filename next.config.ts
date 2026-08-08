import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Firebase Storage 와 구글 계정 프로필 사진만 허용한다 (docs/01 §8).
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' },
      { protocol: 'https', hostname: '*.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
}

export default withNextIntl(nextConfig)
