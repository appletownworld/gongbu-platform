module.exports = {
  apps: [
    {
      name: 'gongbu-api-gateway',
      script: './services/api-gateway/dist/main.js',
      cwd: './services/api-gateway',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3007,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3007,
        AUTH_SERVICE_URL: 'http://localhost:3001',
        COURSE_SERVICE_URL: 'http://localhost:3002',
        BOT_SERVICE_URL: 'http://localhost:3003',
        PAYMENT_SERVICE_URL: 'http://localhost:3004',
        NOTIFICATION_SERVICE_URL: 'http://localhost:3005',
        ANALYTICS_SERVICE_URL: 'http://localhost:3006',
      },
    },
    {
      name: 'gongbu-auth-service',
      script: './services/auth-service/dist/main.js',
      cwd: './services/auth-service',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'gongbu-course-service',
      script: './services/course-service/dist/main.js',
      cwd: './services/course-service',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
    {
      name: 'gongbu-bot-service',
      script: './services/bot-service/dist/main.js',
      cwd: './services/bot-service',
      instances: 1,
      exec_mode: 'fork', // Важно: fork для бота, не cluster
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
    {
      name: 'gongbu-payment-service',
      script: './services/payment-service/dist/main.js',
      cwd: './services/payment-service',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3004,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
    {
      name: 'gongbu-notification-service',
      script: './services/notification-service/dist/main.js',
      cwd: './services/notification-service',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3005,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
    {
      name: 'gongbu-analytics-service',
      script: './services/analytics-service/dist/main.js',
      cwd: './services/analytics-service',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3006,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'https://github.com/appletownworld/gongbu-platform.git',
      path: '/var/www/gongbu-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
