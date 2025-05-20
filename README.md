# Complete Integrated Church System (CICS)

A modern, integrated system for church management built with a monorepo architecture.

## Project Structure

```
.
├── apps/
│   ├── web/        # Web application
│   ├── admin/      # Admin dashboard
│   └── mobile/     # Mobile application
├── supabase/       # Database and backend
└── docs/          # Documentation
```

## Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI
- Docker (for local development)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development environment:
   ```bash
   pnpm dev
   ```

3. Push database changes:
   ```bash
   cd supabase
   supabase db push
   ```

## Development

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm lint` - Run linting across all applications

## License

ISC 