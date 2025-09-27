module.exports = {
  apps: [{
    name: 'sudoku-game',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
};