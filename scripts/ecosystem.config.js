// PM2 配置文件
// 使用方法: pm2 start scripts/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'meta-bot',
      cwd: './bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/bot-error.log',
      out_file: '../logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'meta-admin',
      cwd: './admin',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
