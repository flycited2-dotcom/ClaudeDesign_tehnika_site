module.exports = {
  apps: [
    {
      name: "climat-simf-store",
      cwd: "/var/www/climat-simf.ru",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
