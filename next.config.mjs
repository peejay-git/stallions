/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['stellar.org', 'ipfs.io', 'firebasestorage.googleapis.com', 'earnstallions.xyz', 'www.earnstallions.xyz'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'Testnet',
    NEXT_PUBLIC_STELLER_PUBLIC_NETWORK: process.env.STELLAR_PUBLIC_NETWORK || 'Public Global Stellar Network ; September 2015',
    NEXT_PUBLIC_STELLAR_TEST_NETWORK: process.env.STELLAR_TEST_NETWORK || 'Test SDF Network ; September 2015',
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    NEXT_PUBLIC_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "earnstallions.xyz",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_TREZOR_CONTACT_EMAIL: process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL || 'support@earnstallions.xyz',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@stellar/stellar-sdk',
      '@stellar/stellar-wallets-kit',
      '@creit.tech/stellar-wallets-kit',
      'stellar-sdk',
      'sodium-native',
      '@stellar/freighter-api',
      '@firebase/firestore',
      'firebase-admin',
      '@grpc/grpc-js',
      '@noble/hashes',
      '@noble/curves',
      '@near-js/crypto',
      '@hot-wallet/sdk'
    ],
    esmExternals: true
  },
  webpack: (config, { isServer, webpack }) => {
    // Prevent server-side packages from being bundled on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        'utf-8-validate': false,
        'bufferutil': false,
      };

      // Replace node-specific modules with empty modules
      config.module.rules.push({
        test: /\.(cjs|node)$/,
        include: /[\\/]node_modules[\\/](@grpc|grpc|firebase(?!-admin)|@firebase)[\\/]/,
        use: 'null-loader'
      });

      // Force browser version of Firebase on client side only
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/firestore': 'firebase/firestore/lite',
        '@firebase/firestore': '@firebase/firestore/lite',
      };

      // Exclude grpc from client bundle
      config.module.rules.push({
        test: /node_modules\/@grpc\/grpc-js/,
        use: 'null-loader'
      });
    }

    // Add transpilation rules for the modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    });

    // Handle browser-only modules in server context
    if (isServer) {
      // Add empty module for browser-only packages
      config.module.rules.push({
        test: /\.(mjs|js|ts|tsx)$/,
        include: [
          /node_modules\/@creit\.tech\/stellar-wallets-kit/,
          /node_modules\/@stellar\/freighter-api/,
          /node_modules\/@grpc\/grpc-js/,
          /node_modules\/@firebase\/firestore\/lite/,
          /node_modules\/@noble\/hashes/,
          /node_modules\/@noble\/curves/,
          /node_modules\/@near-js\/crypto/,
          /node_modules\/@hot-wallet\/sdk/
        ],
        use: 'null-loader'
      });

      // Add mock for browser globals
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'undefined',
          'window': 'undefined',
          'document': 'undefined',
          'indexedDB': 'undefined',
          'localStorage': 'undefined',
          'sessionStorage': 'undefined',
          'navigator': 'undefined'
        })
      );
    }

    // Add module resolution for browser-only modules
    config.resolve.mainFields = ['browser', 'module', 'main'];
    config.resolve.conditionNames = ['browser', 'require', 'node'];

    // Handle node: protocol imports
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      loader: 'string-replace-loader',
      options: {
        search: 'require\\([\'"]node:([^\'"]+)[\'"]\\)',
        replace: 'require("$1")',
        flags: 'g'
      }
    });

    // Add polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );
    
    return config;
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
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
        }
      ]
    };
  }
};

export default nextConfig;