module.exports = {
  apps: [
    {
      name: 'tabsa-backend',
      cwd: __dirname,
      script: 'server/src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
