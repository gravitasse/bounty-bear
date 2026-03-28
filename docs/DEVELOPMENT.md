# Bounty Bear - Development Setup

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/yourusername/bounty-bear.git
cd bounty-bear
npm install

# 2. Set up Supabase locally
npm install -g @supabase/cli
npx supabase init
npx supabase start  # Starts local Docker containers

# 3. Copy environment file
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the retro terminal interface!

---

## Prerequisites

### Required Software
- **Node.js**: 18+ (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm**: 9+ (comes with Node.js)
- **Docker**: For local Supabase (PostgreSQL + PostGIS)
- **Git**: Version control

### Optional (Recommended)
- **VS Code**: With extensions below
- **Cursor**: AI-powered editor alternative
- **Warp**: Modern terminal with AI features

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "supabase.supabase-js",
    "ms-vscode.vscode-json",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/bounty-bear.git
cd bounty-bear
```

### 2. Install Dependencies
```bash
# Install all packages
npm install

# Verify installation
npm list --depth=0
```

### 3. Set Up Supabase Local Development

**Install Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# npm (cross-platform)
npm install -g @supabase/cli

# Verify installation
supabase --version
```

**Initialize Local Supabase:**
```bash
# Initialize in project
npx supabase init

# Start all services (PostgreSQL, Auth, Storage, etc.)
npx supabase start

# This will output:
# - API URL: http://localhost:54321
# - API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### 4. Configure Environment Variables

**Create `.env.local`:**
```bash
# Copy template
cp .env.example .env.local
```

**Edit `.env.local`:**
```bash
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox (get free token at mapbox.com)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYm91bnR5YmVhciIsImEiOiJja...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Development Flags
DEV_MODE=true
SKIP_AUTH_IN_DEV=false  # Set to true for easier testing
MOCK_GPS_DATA=false     # Set to true to simulate GPS without location access

# Security (generate random strings)
JWT_SECRET=dev-secret-key-32-chars-minimum
WEBHOOK_SECRET=dev-webhook-secret

# Optional: Get tokens for production features
SENTRY_DSN=               # Error tracking (optional in dev)
VERCEL_TOKEN=             # For deployment commands
```

### 5. Apply Database Migrations

```bash
# Apply all migrations to local database
npx supabase db push

# Verify tables were created
npx supabase db status

# Check in Supabase Studio (web UI)
open http://localhost:54323
```

### 6. Start Development Server

```bash
npm run dev
```

**Available at:**
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3000/api](http://localhost:3000/api)
- **Supabase Studio**: [http://localhost:54323](http://localhost:54323)
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`

---

## Development Scripts

### Core Commands
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code quality checks
npm run lint:fix     # Auto-fix ESLint issues
npm run type-check   # TypeScript type checking
```

### Testing Commands
```bash
npm run test         # Run all tests
npm run test:unit    # Unit tests (Vitest)
npm run test:e2e     # End-to-end tests (Playwright)
npm run test:watch   # Watch mode for unit tests
npm run test:ui      # Playwright UI mode (interactive testing)

# Specific test files
npm run test -- bounty-creation
npx playwright test e2e/bounty-claim.spec.ts
```

### Database Commands
```bash
npm run db:start     # Start local Supabase
npm run db:stop      # Stop local Supabase
npm run db:reset     # Reset database (WARNING: destroys data)
npm run db:seed      # Populate with test data
npm run db:studio    # Open Supabase Studio
npm run db:migrate   # Apply pending migrations
```

### Quality Commands
```bash
npm run format       # Prettier code formatting
npm run format:check # Check if code is formatted
npm run validate     # Run all quality checks (lint + type + format)
npm run pre-commit   # Run before committing (husky hook)
```

---

## Project Structure

```
bounty-bear/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-protected routes
│   │   ├── api/               # API endpoints
│   │   │   ├── bounties/      # Bounty CRUD operations
│   │   │   ├── hunts/         # Hunt management
│   │   │   ├── users/         # User profiles
│   │   │   └── webhooks/      # Supabase webhooks
│   │   ├── map/               # Map view page
│   │   ├── leaderboard/       # Leaderboard page
│   │   └── profile/           # User profile pages
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Terminal.tsx   # Retro terminal component
│   │   │   ├── MapView.tsx    # Interactive map
│   │   │   └── BearAvatar.tsx # Animated bounty bear
│   │   ├── bounty/           # Bounty-specific components
│   │   ├── hunt/             # Hunt-specific components
│   │   └── layout/           # Layout components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useGeolocation.ts # GPS tracking
│   │   ├── useSupabase.ts    # Database queries
│   │   ├── useRealtime.ts    # Live updates
│   │   └── useSound.ts       # Sound effects
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Database client & types
│   │   ├── mapbox/           # Map utilities
│   │   ├── auth/             # Authentication helpers
│   │   ├── game/             # Game logic
│   │   │   ├── bounty.ts     # Bounty creation/validation
│   │   │   ├── hunt.ts       # Hunt progression logic
│   │   │   ├── verification.ts # QR/photo verification
│   │   │   └── scoring.ts    # Points & reputation system
│   │   └── utils/            # General utilities
│   │
│   ├── types/                # TypeScript type definitions
│   │   ├── database.ts       # Supabase generated types
│   │   ├── game.ts          # Game-specific types
│   │   └── api.ts           # API request/response types
│   │
│   └── styles/              # CSS and styling
│       ├── globals.css      # Global styles + Tailwind
│       ├── terminal.css     # CRT effects and animations
│       └── components.css   # Component-specific styles
│
├── supabase/
│   ├── migrations/          # Database schema changes
│   │   ├── 20260327_initial_schema.sql
│   │   └── 20260328_add_achievements.sql
│   ├── functions/           # Edge Functions
│   │   ├── webhook-handler/ # Process external webhooks
│   │   └── leaderboard-update/ # Update cached rankings
│   └── seed.sql             # Test data for development
│
├── e2e/                     # End-to-end tests
│   ├── bounty-creation.spec.ts
│   ├── hunt-flow.spec.ts
│   ├── verification.spec.ts
│   └── helpers/             # Test utilities
│
├── docs/                    # Documentation (this folder)
├── public/                  # Static assets
│   ├── sounds/              # Game sound effects
│   ├── icons/               # PWA icons
│   └── images/              # Graphics and logos
│
├── .github/                 # GitHub Actions
│   └── workflows/
│       ├── deploy.yml       # Auto-deploy to production
│       └── test.yml         # Run tests on PR
│
└── config files            # Project configuration
    ├── tailwind.config.js   # Styling configuration
    ├── next.config.js       # Next.js configuration
    ├── playwright.config.ts # E2E test configuration
    ├── vitest.config.ts     # Unit test configuration
    └── tsconfig.json        # TypeScript configuration
```

---

## Development Workflow

### 1. Feature Development

**Start a new feature:**
```bash
# Create feature branch
git checkout -b feature/bounty-categories

# Start development server
npm run dev

# Open in editor
code .
```

**Development loop:**
1. Write code
2. Check types: `npm run type-check`
3. Test manually in browser
4. Write unit tests if needed
5. Run tests: `npm run test`
6. Commit changes

### 2. Database Changes

**Create new migration:**
```bash
# Generate migration file
npx supabase migration new add_bounty_categories

# Edit the generated file in supabase/migrations/
# Apply to local database
npx supabase db push

# Verify changes
npx supabase db studio
```

**Example migration:**
```sql
-- supabase/migrations/20260328_add_bounty_categories.sql
CREATE TYPE bounty_category AS ENUM ('landmark', 'nature', 'urban', 'hidden_gem');

ALTER TABLE bounties
ADD COLUMN category bounty_category DEFAULT 'landmark';

CREATE INDEX bounties_category_idx ON bounties (category);
```

### 3. API Development

**Create new API endpoint:**
```typescript
// src/app/api/bounties/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('bounties')
    .select('category, count(*)')
    .group('category');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data });
}
```

### 4. Component Development

**Create new component:**
```typescript
// src/components/bounty/CategoryFilter.tsx
'use client';

import { useState } from 'react';
import { BountyCategory } from '@/types/game';

interface CategoryFilterProps {
  categories: BountyCategory[];
  selectedCategory: BountyCategory | null;
  onCategoryChange: (category: BountyCategory | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        FILTER BY CATEGORY
      </div>
      <div className="category-buttons">
        <button
          className={`terminal-button ${!selectedCategory ? 'active' : ''}`}
          onClick={() => onCategoryChange(null)}
        >
          ALL
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`terminal-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

**Test game logic:**
```typescript
// src/lib/game/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateReward, updateReputation } from '../scoring';

describe('Scoring System', () => {
  it('calculates reward based on difficulty and distance', () => {
    const reward = calculateReward({
      baseBounty: 500,
      difficulty: 3,
      distanceTraveled: 1000, // meters
      timeToComplete: 3600    // seconds
    });

    expect(reward.points).toBe(575); // Base + difficulty bonus + speed bonus
    expect(reward.breakdown.difficultyBonus).toBe(50);
  });

  it('updates reputation level correctly', () => {
    const user = { totalPoints: 4900, reputationLevel: 2 };
    const updatedUser = updateReputation(user, 200);

    expect(updatedUser.totalPoints).toBe(5100);
    expect(updatedUser.reputationLevel).toBe(3); // Leveled up
  });
});
```

**Run unit tests:**
```bash
npm run test:unit
npm run test:watch  # Watch mode
```

### E2E Tests (Playwright)

**Test complete user flows:**
```typescript
// e2e/bounty-hunt-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Bounty Hunt Flow', () => {
  test('complete hunt from discovery to claim', async ({ page, context }) => {
    // Set geolocation permissions
    await context.grantPermissions(['geolocation']);
    await page.goto('/');

    // Login
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-login"]');

    // Find nearby bounty
    await page.click('[data-testid="hunt-bounties-button"]');
    await expect(page.locator('[data-testid="bounty-card"]')).toBeVisible();

    // Start hunt
    await page.click('[data-testid="bounty-card"]').first();
    await page.click('[data-testid="start-hunt-button"]');

    // Check first clue is visible
    await expect(page.locator('[data-testid="clue-1"]')).toBeVisible();

    // Mock getting close to target
    await page.evaluate(() => {
      // Mock geolocation to be near target
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: { latitude: 37.7749, longitude: -122.4194 }
        });
      };
    });

    // Simulate QR code scan
    await page.click('[data-testid="verify-button"]');
    await page.fill('[data-testid="qr-input"]', 'valid-qr-uuid');
    await page.click('[data-testid="submit-verification"]');

    // Check success message
    await expect(page.locator('text=I GOT HIM! THIS IS YOUR GUY!')).toBeVisible();
    await expect(page.locator('[data-testid="points-earned"]')).toContainText('500');
  });
});
```

**Run E2E tests:**
```bash
npm run test:e2e
npm run test:ui      # Interactive mode
npx playwright test --headed  # Watch tests run
```

### Load Testing

**Test API performance:**
```javascript
// tests/load/bounty-api.js (k6)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 100 },  // Ramp up
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
};

export default function() {
  const response = http.get('http://localhost:3000/api/bounties/nearby?lat=37.7749&lng=-122.4194');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has bounties': (r) => JSON.parse(r.body).bounties.length > 0,
  });
}
```

---

## Debugging

### Browser DevTools

**Console commands for debugging:**
```javascript
// Check Supabase connection
await window.supabase.from('bounties').select('count');

// Mock GPS location
navigator.geolocation.getCurrentPosition = (success) => {
  success({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10
    }
  });
};

// Check authentication state
console.log(await window.supabase.auth.getSession());

// Test sound effects
window.BearSounds.playSuccess();
```

### VS Code Debugging

**Debug Next.js API routes:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Database Debugging

**Useful SQL queries:**
```sql
-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename) DESC;

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Verify PostGIS extension
SELECT PostGIS_Full_Version();
```

### Common Issues & Solutions

**1. "Supabase connection failed"**
```bash
# Check if local Supabase is running
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start
```

**2. "Map not loading"**
```bash
# Check Mapbox token in console
console.log(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

# Verify token at account.mapbox.com
```

**3. "GPS not working in browser"**
```bash
# Chrome: Secure context required (HTTPS or localhost)
# Safari: Check Location Services in System Preferences
# Firefox: about:config → geo.enabled = true
```

**4. "TypeScript errors"**
```bash
# Update Supabase types
npx supabase gen types typescript --local > src/types/database.ts

# Check TypeScript version compatibility
npm list typescript
```

---

## Performance Optimization

### Development Performance

**Faster builds:**
```bash
# Use SWC compiler (faster than Babel)
# Already configured in next.config.js

# Skip type checking during dev (faster startup)
npm run dev -- --turbo

# Use experimental features
export const experimental = {
  turbo: {
    loaders: {
      '.svg': ['@svgr/webpack'],
    },
  },
};
```

**Faster tests:**
```bash
# Run tests in parallel
npm run test -- --reporter=verbose --threads

# Run only changed files
npm run test -- --changed
```

### Runtime Performance

**Monitor performance:**
```typescript
// Add to components that might be slow
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  if (actualDuration > 16) { // Slower than 60fps
    console.warn(`Slow render: ${id} took ${actualDuration}ms`);
  }
}

<Profiler id="BountyMap" onRender={onRenderCallback}>
  <BountyMap />
</Profiler>
```

**Optimize images:**
```typescript
// Use Next.js Image component for automatic optimization
import Image from 'next/image';

<Image
  src="/bounty-bear.png"
  alt="Bounty Bear"
  width={100}
  height={100}
  priority // Above-the-fold images
  placeholder="blur" // Better UX
/>
```

---

## Git Workflow

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add bounty category filtering
fix: resolve GPS accuracy issues
docs: update API documentation
style: improve terminal animation performance
refactor: simplify hunt state management
test: add E2E tests for verification flow
chore: update dependencies
```

### Pre-commit Hooks

**Husky automatically runs:**
1. ESLint (fix auto-fixable issues)
2. TypeScript type checking
3. Prettier formatting
4. Unit tests (fast ones only)

```bash
# Skip hooks in emergency (not recommended)
git commit --no-verify
```

### Branch Strategy

```bash
main          # Production-ready code
├─ develop    # Integration branch
├─ feature/bounty-categories
├─ feature/achievement-system
├─ hotfix/gps-accuracy
└─ release/v1.0.0
```

---

**Next Steps:** See [MVP_ROADMAP.md](./MVP_ROADMAP.md) for feature prioritization and timeline.