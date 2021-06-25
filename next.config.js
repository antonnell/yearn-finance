module.exports = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      }
    }

    return config
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home.html',
        permanent: false,
      },
    ]
  },
}
