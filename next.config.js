/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'match-network.onrender.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'match-network.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
