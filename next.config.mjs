/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'stellar.org',
      'ipfs.io',
      'firebasestorage.googleapis.com',
      'earnstallions.xyz',
      'www.earnstallions.xyz',
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/admin/:path*',
          destination: '/admin/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
