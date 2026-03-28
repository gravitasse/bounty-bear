# Bounty Bear - Deployment Guide

## Prerequisites

- **Vercel Account**: [vercel.com](https://vercel.com)
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Mapbox Account**: [mapbox.com](https://mapbox.com) (free tier: 50K map loads/month)
- **Git Repository**: GitHub, GitLab, or Bitbucket

## Quick Deploy (5 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/bounty-bear.git
cd bounty-bear
```

### 2. Deploy to Vercel

**Option A: One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bounty-bear)

**Option B: CLI Deploy**
```bash
npm install -g vercel
vercel --prod
```

**Option C: GitHub Integration**
1. Connect GitHub to Vercel
2. Import repository
3. Auto-deploy on every push to `main`

### 3. Set Up Supabase

```bash
# Create new Supabase project
https://supabase.com/dashboard/new

# Note down:
# - Project URL: https://abc123.supabase.co
# - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Service Role Key (for server functions)
```

### 4. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYm91bnR5YmVhciIsImEiOiJja...

# App Configuration
NEXT_PUBLIC_APP_URL=https://bounty-bear.vercel.app
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-key-32-chars-min
WEBHOOK_SECRET=your-webhook-secret-key

# Optional: Analytics & Error Tracking
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=prj_...
SENTRY_DSN=https://...
```

### 5. Initialize Database

```bash
# Run database migrations
npx supabase init
npx supabase link --project-ref abc123
npx supabase db push
```

🎉 **Done!** Your app is live at `https://bounty-bear.vercel.app`

---

## Detailed Setup

### Supabase Configuration

#### A. Create Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region (closest to users)
4. Set database password (save it!)
5. Wait 2-3 minutes for project creation

#### B. Enable PostGIS Extension
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
```

#### C. Run Database Migrations
```bash
# Local setup first
npm install
cp .env.example .env.local

# Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Link to your project
npx supabase link --project-ref abc123

# Apply database schema
npx supabase db push

# Verify tables were created
npx supabase db status
```

#### D. Configure Authentication

**In Supabase Dashboard → Authentication → Settings:**

**Site URL:** `https://bounty-bear.vercel.app`
**Redirect URLs:**
- `https://bounty-bear.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback` (for development)

**Email Templates:** Customize welcome/reset emails with Bounty Bear branding

**OAuth Providers (Optional):**
- Google: [Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- Apple: [Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- GitHub: [Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-github)

#### E. Configure Storage

```sql
-- Create storage bucket for QR codes and photos
INSERT INTO storage.buckets (id, name, public) VALUES
('bounty-qr-codes', 'bounty-qr-codes', false),
('verification-photos', 'verification-photos', false);

-- Set up storage policies
CREATE POLICY "Users can view QR codes during verification"
ON storage.objects FOR SELECT
USING (bucket_id = 'bounty-qr-codes');

CREATE POLICY "Users can upload verification photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Mapbox Configuration

1. Create account at [mapbox.com](https://mapbox.com)
2. Go to [Account → Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create new token with these scopes:
   - **styles:read** (for map tiles)
   - **geocoding:read** (for location search)
   - **navigation:read** (for directions, future feature)
4. Copy public token (starts with `pk.`)
5. Add to environment variables

**Usage Limits (Free Tier):**
- 50,000 map loads/month
- 100,000 geocoding requests/month
- Automatically scales to pay-as-you-go

### Vercel Configuration

#### Production Settings

**Build Command:** `npm run build`
**Output Directory:** `.next` (automatic)
**Install Command:** `npm install` (automatic)
**Node.js Version:** 18.x (default)

#### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abc123.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | `pk.eyJ...` | All |
| `NEXT_PUBLIC_APP_URL` | `https://bounty-bear.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `JWT_SECRET` | `your-secret-key` | Production |

#### Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add custom domain: `bounty-bear.com`
3. Configure DNS at your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. SSL certificate auto-generated (Let's Encrypt)

#### Redirects & Headers

Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/github",
      "destination": "https://github.com/yourusername/bounty-bear"
    },
    {
      "source": "/docs",
      "destination": "/docs/game-design"
    }
  ]
}
```

---

## Monitoring & Analytics

### Vercel Analytics (Built-in)

```javascript
// In app layout or _app.js
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Metrics Available:**
- Page views, unique visitors
- Performance (Core Web Vitals)
- Top pages and referrers
- Conversion funnels

### Sentry Error Tracking

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Environment Variables:**
```bash
SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/789
SENTRY_ORG=bounty-bear
SENTRY_PROJECT=bounty-bear-web
```

**Free Tier:** 5,000 errors/month

### Custom Analytics Events

```javascript
// Track game events
import { trackEvent } from '@/lib/analytics';

// When bounty is created
trackEvent('bounty_created', {
  reward_points: 500,
  difficulty: 3,
  location_type: 'park'
});

// When bounty is claimed
trackEvent('bounty_claimed', {
  bounty_id: 'abc-123',
  time_to_claim_minutes: 45,
  distance_traveled_meters: 1234
});
```

---

## Database Maintenance

### Automated Backups

Supabase automatically backs up your database:
- **Point-in-time recovery:** 7 days (free tier)
- **Daily backups:** Kept for 7 days
- **Weekly backups:** Kept for 4 weeks

### Manual Backup

```bash
# Export schema and data
pg_dump "postgresql://postgres:[password]@db.abc123.supabase.co:5432/postgres" > bounty-bear-backup.sql

# Restore from backup
psql "postgresql://postgres:[password]@db.new123.supabase.co:5432/postgres" < bounty-bear-backup.sql
```

### Database Migrations

```bash
# Create new migration
npx supabase migration new add_bounty_categories

# Edit migration file in supabase/migrations/
# Apply to production
npx supabase db push --linked
```

### Performance Monitoring

```sql
-- Check slow queries (> 100ms)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Scaling Considerations

### Current Limits (Free Tier)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth/month | 1TB+ ($20/month) |
| **Supabase** | 500MB database, 1GB storage | 8GB+ ($25/month) |
| **Mapbox** | 50K map loads/month | Pay-as-you-go ($5/1K) |

### Performance Optimizations

**1. Database Indexing**
```sql
-- Spatial index for nearby bounty queries (already included)
CREATE INDEX CONCURRENTLY bounties_location_idx ON bounties USING GIST (location);

-- Composite index for leaderboards
CREATE INDEX CONCURRENTLY users_points_created_idx ON users (points DESC, created_at DESC);
```

**2. CDN Caching**
```javascript
// Cache static assets (QR codes, profile pics)
// Vercel automatically handles this

// Cache API responses with stale-while-revalidate
export const config = {
  headers: {
    'Cache-Control': 's-maxage=60, stale-while-revalidate'
  }
};
```

**3. Image Optimization**
```javascript
// Use Next.js Image component (automatic WebP conversion)
import Image from 'next/image';

<Image
  src="/bounty-bear-logo.png"
  alt="Bounty Bear"
  width={100}
  height={100}
  priority // Above-the-fold images
/>
```

### Scaling Timeline

**100 Users:**
- Stay on free tier
- Monitor usage via dashboards

**1,000 Users:**
- Upgrade Vercel to Pro ($20/month)
- Add Redis caching (Upstash free tier)

**10,000 Users:**
- Upgrade Supabase to Pro ($25/month)
- Add CDN for map tiles (Cloudflare R2)
- Implement database read replicas

**100,000+ Users:**
- Multi-region deployment
- Dedicated database instances
- Custom analytics pipeline

---

## Security Checklist

### Pre-Deploy Security

- [ ] Enable Row-Level Security (RLS) on all Supabase tables
- [ ] Validate all user inputs (SQL injection prevention)
- [ ] Implement rate limiting (100 req/min per user)
- [ ] Escape HTML content (XSS prevention)
- [ ] Use HTTPS everywhere (SSL/TLS)
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Configure CORS properly
- [ ] Enable database connection pooling
- [ ] Set up proper logging (no sensitive data)
- [ ] Configure CSP headers

### Post-Deploy Monitoring

- [ ] Set up error alerts (Sentry)
- [ ] Monitor API response times
- [ ] Track failed authentication attempts
- [ ] Monitor database slow queries
- [ ] Set up uptime monitoring (Vercel Analytics)
- [ ] Review access logs weekly
- [ ] Update dependencies monthly

---

## Troubleshooting

### Common Issues

**1. "Supabase connection failed"**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

**2. "Map tiles not loading"**
```javascript
// Check Mapbox token
console.log(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

// Verify token scopes at account.mapbox.com
```

**3. "Database migration failed"**
```bash
# Check migration status
npx supabase migration list

# Repair migration
npx supabase migration repair --status applied

# Manual fix
npx supabase db reset --linked
```

**4. "Vercel build failed"**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Package version conflicts

# Local debug
npm run build
npm run lint
npm run type-check
```

### Performance Issues

**Slow database queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();

-- Check active connections
SELECT * FROM pg_stat_activity;
```

**High memory usage:**
```bash
# Check Vercel function logs
# Optimize image sizes
# Implement pagination for large datasets
# Add database connection pooling
```

---

## Rollback Strategy

### Quick Rollback (Production Issues)

**1. Vercel Deployment Rollback**
```bash
# In Vercel dashboard → Deployments
# Click "..." on previous deployment → "Redeploy"

# Or via CLI
vercel rollback
```

**2. Database Rollback**
```bash
# Point-in-time recovery (Supabase Pro)
# Contact support with timestamp

# Or restore from backup
psql "postgresql://..." < backup-before-issue.sql
```

**3. Environment Variables**
```bash
# Revert in Vercel dashboard
# Or update via CLI
vercel env pull .env.production.local
vercel env add NODE_ENV production
```

### Staged Rollout

```bash
# Deploy to staging first
vercel --target staging

# Test thoroughly
npm run test:e2e

# Deploy to production
vercel --target production --prod
```

---

**Next Steps:** See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup.