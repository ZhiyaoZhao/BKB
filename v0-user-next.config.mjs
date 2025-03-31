/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://localhost:8000/api/:path*', // Proxy to Django backend
      },
    ]
  },
}

export default nextConfig

