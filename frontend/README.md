# Simpla Frontend

A Next.js application for legal document search and management, built with
TypeScript, Prisma, and Tailwind CSS.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/cijjas/Simpla.git
cd frontend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and other required variables

# Generate Prisma client
pnpm prisma generate

# Run database migrations (if needed)
pnpm prisma migrate dev

# Start development server
pnpm dev
```

## Development Workflow

### Before Pushing Code

**Always run the complete check pipeline before pushing:**

```bash
pnpm check-all
```

This command runs:

1. **ESLint** - Code quality and style checks
2. **TypeScript** - Type checking
3. **Build** - Production build verification

### Individual Commands

```bash
# Development
pnpm dev                 # Start development server with Turbopack

# Code Quality
pnpm lint               # Run ESLint checks
pnpm lint:fix           # Auto-fix ESLint issues
pnpm type-check         # TypeScript type checking

# Building
pnpm build              # Production build
pnpm start              # Start production server

# Database
pnpm prisma generate    # Generate Prisma client
pnpm prisma migrate dev # Run database migrations
pnpm db:studio          # Open Prisma Studio with environment variables
```

## Technologies Used

- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.11
- **Database**: PostgreSQL with Prisma 6.7.0
- **Authentication**: NextAuth.js 4.24.11
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context
- **Package Manager**: pnpm

## License

This project is proprietary software. All rights reserved.
