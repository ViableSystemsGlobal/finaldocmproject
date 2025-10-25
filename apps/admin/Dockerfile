# Multi-stage build for DOCM Church Admin
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@latest

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy app package.json
COPY apps/admin/package.json ./apps/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Declare build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_EMAIL_PROVIDER
ARG NEXT_PUBLIC_FROM_ADDRESS
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=$NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_EMAIL_PROVIDER=$NEXT_PUBLIC_EMAIL_PROVIDER
ENV NEXT_PUBLIC_FROM_ADDRESS=$NEXT_PUBLIC_FROM_ADDRESS
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules

# Copy source code
COPY apps/admin ./apps/admin
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Build the application
WORKDIR /app/apps/admin
RUN pnpm run build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files from standalone output
# Standalone puts files at workspace root
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "apps/admin/server.js"]

