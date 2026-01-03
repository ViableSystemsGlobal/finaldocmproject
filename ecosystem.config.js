// ⚠️  SECURITY WARNING: This file should NOT contain hardcoded secrets
// All sensitive values should come from environment variables or .env files
// Use ecosystem.config.js.example as a template

module.exports = {
  apps: [
    {
      name: 'docm-cics-admin',
      script: 'npm',
      args: 'start',
      cwd: '/root/docm-cics/apps/admin',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        // All sensitive values should be loaded from environment variables
        // Set them in your shell or use a .env file
        // NEVER commit secrets to git
      }
    },
    {
      name: 'docm-cics-web',
      script: 'npm',
      args: 'start',
      cwd: '/root/docm-cics/apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        // All sensitive values should be loaded from environment variables
      }
    }
  ]
}; 