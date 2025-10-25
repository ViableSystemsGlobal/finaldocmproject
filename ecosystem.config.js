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
        NEXTAUTH_URL: 'https://admin.docmchurch.org',
        NEXT_PUBLIC_SITE_URL: 'https://admin.docmchurch.org',
        NEXT_PUBLIC_SUPABASE_URL: 'https://ufjfafcfkalaasdhgcbi.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA',
        DATABASE_URL: 'postgresql://postgres.ufjfafcfkalaasdhgcbi:6C8cBqkKAVQzL7Sb@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
        GOOGLE_MAPS_API_KEY: 'AIzaSyDnEt5H8yTdPtDhXbBmvQgOyHbmRYGlGek',
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'AIzaSyDnEt5H8yTdPtDhXbBmvQgOyHbmRYGlGek',
        NEXT_PUBLIC_EMAIL_PROVIDER: 'hostinger',
        NEXT_PUBLIC_FROM_ADDRESS: 'admin@docmchurch.org',
        SMTP_HOST: 'smtp.hostinger.com',
        SMTP_PORT: '587',
        SMTP_USER: 'admin@docmchurch.org',
        SMTP_PASS: '4R*]IL4QyS$',
        SENDGRID_API_KEY: 'SG.your_sendgrid_api_key_here',
        STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51PEkGvP9bUcIDVMWWWL0s8LhGXPuZZmOJWQGV1JVIjFZVOdcMPlB8Ps5OW5FsVi8cTEOODBBJMJAEk6XxOKCqSPH00VQe4xYHx',
        STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here'
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
        NEXT_PUBLIC_SITE_URL: 'https://docmchurch.org',
        NEXT_PUBLIC_SUPABASE_URL: 'https://ufjfafcfkalaasdhgcbi.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA',
        DATABASE_URL: 'postgresql://postgres.ufjfafcfkalaasdhgcbi:6C8cBqkKAVQzL7Sb@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
        GOOGLE_MAPS_API_KEY: 'AIzaSyDnEt5H8yTdPtDhXbBmvQgOyHbmRYGlGek',
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'AIzaSyDnEt5H8yTdPtDhXbBmvQgOyHbmRYGlGek',
        STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51PEkGvP9bUcIDVMWWWL0s8LhGXPuZZmOJWQGV1JVIjFZVOdcMPlB8Ps5OW5FsVi8cTEOODBBJMJAEk6XxOKCqSPH00VQe4xYHx',
        STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here'
      }
    }
  ]
}; 