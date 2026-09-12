# Carbon MRV - Frontend Dashboard

Verifiable Carbon Credit & Offset Tracking Platform (MRV 2.0) dashboard built with Next.js 16, shadcn/ui, Tailwind CSS v4, TypeScript, and Clerk.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth & Orgs**: Clerk (Workspaces, Teams, Billing, Profile)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui on Base UI primitives
- **Data Tables**: TanStack Data Tables with server prefetch & client-side cache
- **Forms & Validation**: TanStack Form + Zod
- **Search Params State**: Nuqs
- **Command Menu**: KBar (Cmd+K)
- **Charts**: Recharts
- **Themes**: Multi-theme support with dark/light mode

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` or `env.example.txt` to `.env.local` and fill in the required Clerk keys:

```bash
cp env.example.txt .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js development server |
| `pnpm build` | Compiles the production build |
| `pnpm start` | Starts the production server |
| `pnpm typecheck` | Runs TypeScript checks (`tsc --noEmit`) |
| `pnpm lint` | Runs OxLint for fast linting |
| `pnpm lint:fix` | Fixes lint issues and formats files |
| `pnpm format` | Formats codebase using Oxfmt |
| `pnpm format:check` | Checks code formatting |

---

## Project Structure

```text
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── auth/             # Clerk sign-in and sign-up pages
│   ├── dashboard/        # Dashboard layout and authenticated routes
│   │   ├── overview/     # Overview & analytics charts
│   │   ├── workspaces/   # Clerk organization management
│   │   ├── billing/      # Clerk billing & subscription tiers
│   │   └── profile/      # Clerk user profile management
│   └── layout.tsx        # Root HTML layout with providers & theme
├── components/           # UI components & shared widgets
│   ├── forms/            # Form fields and validation helpers
│   ├── kbar/             # Command palette (Cmd+K)
│   ├── layout/           # App sidebar, header, breadcrumbs, page container
│   ├── themes/           # Theme provider, switcher, config
│   └── ui/               # shadcn/ui and Base UI primitives
├── config/               # Navigation, data-table, and info configs
├── hooks/                # Custom React hooks (navigation, breadcrumbs, etc.)
├── lib/                  # Utilities, query client, form helpers, search params
└── types/                # Core TypeScript interfaces & data-table types
```
