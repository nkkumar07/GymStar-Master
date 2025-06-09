// next.config.mjs
export default {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.cache = false; // Disabling Webpack cache
    return config;
  },
};
