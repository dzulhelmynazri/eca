# use-forever

`use-forever` is a TypeScript monorepo powered by Bun + Turborepo.
It includes a Next.js web app, a Blume docs app, type-safe tRPC APIs, shared contracts, and Eve-based AI agent apps.

## Stack

- **TypeScript** for end-to-end type safety
- **Next.js 16.3.0 + React 19** for the web application
- **Blume** for documentations
- **tRPC** for type-safe API procedures
- **Prisma + PostgreSQL** for ORM + database
- **Tailwind CSS v4** for styling
- **shadcn/ui** for design system
- **Better Auth** for authentication
- **Eve** for durable backend AI agent apps
- **Oxlint + Oxfmt + Ultracite** for linting/formatting and automated fixes
- **Husky** for local Git hooks

## Requirements

- **Node.js** `24.x`
- **Bun** `1.3.14` (or newer compatible version)

## Getting Started

1. Install dependencies:

```bash
bun install
```

2. Create web environment variables:

```bash
cp apps/web/.env.example apps/web/.env
```

3. Update `apps/web/.env` with your PostgreSQL credentials and app URL:

```env
NEXT_PUBLIC_APP_URL=use-forever.vercel.app
```

4. Push Prisma schema to your database:

```bash
bun run db:push
```

5. Start development:

```bash
bun run dev
```

The web app runs at [http://localhost:3001](http://localhost:3001).

## Workspace Layout

```text
use-forever/
├── apps/
│   ├── web/         # Next.js web app
│   ├── docs/        # Blume docs app
│   ├── runtime/     # Eve agent app
├── packages/
│   ├── api/         # tRPC routers + API layer
│   ├── auth/        # Better Auth server/client package
│   ├── config/      # Shared TS/config presets
│   ├── contracts/   # Shared Zod request/response contracts
│   ├── db/          # Prisma schema and database utilities
│   ├── env/         # Shared environment schemas
│   ├── next-config/ # Shared Next.js config preset
│   ├── storage/     # File storage utilities
│   ├── utils/       # Shared utility helpers
│   └── ui/          # Shared shadcn/ui primitives and styles
└── turbo.json       # Turborepo task pipeline
```
