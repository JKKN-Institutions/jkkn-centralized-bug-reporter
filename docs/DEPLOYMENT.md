# Deployment Guide - Centralized Bug Reporter Platform

This guide walks through deploying the Centralized Bug Reporter Platform to Vercel with Supabase backend.

---

## 📋 Prerequisites

### Required Accounts
- **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
- **Supabase Project** - Already set up (project ref: `adakhqxgaoxaihtehfqw`)
- **Domain Name** - Optional, Vercel provides free `.vercel.app` subdomain

### Required Tools
- Git
- Node.js 18.x or higher
- npm 9.x or higher
- Vercel CLI (optional): `npm i -g vercel`

---

## 🚀 Quick Deploy (5 Minutes)

### Option 1: Deploy via Vercel Dashboard

1. **Import Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the repository

2. **Configure Project**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/platform`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://adakhqxgaoxaihtehfqw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   NEXT_PUBLIC_SITE_URL=[will-be-auto-filled]
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Visit your deployed site at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to project root
cd centralized-bug-reporter

# Deploy (interactive mode)
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? [select your account]
# Link to existing project? No
# What's your project's name? centralized-bug-reporter
# In which directory is your code located? apps/platform
# Want to modify settings? Yes
# Build Command: npm run build
# Output Directory: .next
# Development Command: npm run dev

# Add environment variables when prompted or add them via dashboard
```

---

## 🔐 Environment Variables

### Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Add Variables to Vercel

**Via Dashboard:**
1. Go to project settings
2. Navigate to **Environment Variables**
3. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://adakhqxgaoxaihtehfqw.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[your-anon-key]` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `[your-service-role-key]` | Production only |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` | Production |

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste value when prompted
# Select environments: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```

---

## ⚙️ Supabase Configuration

### 1. Update Site URL

1. Go to **Supabase Dashboard → Settings → API**
2. Update **Site URL** to your Vercel domain:
   ```
   https://your-project.vercel.app
   ```
3. Click **Save**

### 2. Add Redirect URLs

1. Still in **Settings → API**
2. Under **Redirect URLs**, add:
   ```
   https://your-project.vercel.app/**
   http://localhost:3000/**
   ```
3. Click **Save**

### 3. Configure Email Templates

1. Go to **Authentication → Email Templates**

2. **Confirm Signup Template:**
   - **Subject:** `Confirm your email for Bug Reporter`
   - **Body:**
     ```html
     <h2>Confirm your email</h2>
     <p>Thanks for signing up for Bug Reporter Platform!</p>
     <p>Follow this link to confirm your email address:</p>
     <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
     ```
   - **Redirect URL:** `https://your-project.vercel.app/verify-email`

3. **Reset Password Template:**
   - **Subject:** `Reset your password for Bug Reporter`
   - **Body:**
     ```html
     <h2>Reset your password</h2>
     <p>Follow this link to reset your password:</p>
     <p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>
     ```
   - **Redirect URL:** `https://your-project.vercel.app/reset-password`

4. Click **Save** for each template

### 4. Enable Production Security

1. **Settings → API → JWT Settings**
   - Review JWT expiry (default: 3600 seconds)
   - Consider shorter expiry for production

2. **Settings → Auth → Policies**
   - Review rate limiting settings
   - Enable CAPTCHA for signup (optional)
   - Configure password requirements

3. **Database → Backups**
   - Enable daily automated backups
   - Consider Point-in-Time Recovery (PITR) for production

---

## 🧪 Post-Deployment Testing

### 1. Test Authentication

**Sign Up Flow:**
1. Visit `https://your-project.vercel.app`
2. Click "Get started" or "Sign up"
3. Create new account
4. Verify email sent
5. Click verification link
6. Confirm redirect to dashboard

**Sign In Flow:**
1. Visit `/login`
2. Enter credentials
3. Verify redirect to dashboard
4. Check session persistence

**Password Reset:**
1. Visit `/forgot-password`
2. Enter email
3. Check email received
4. Click reset link
5. Enter new password
6. Verify can sign in with new password

### 2. Test Multi-Org Isolation

**Create Two Organizations:**
1. Sign up as User A → Create "Organization Alpha"
2. Sign out
3. Sign up as User B → Create "Organization Beta"

**Verify Isolation:**
1. Sign in as User A
2. Try to access Org Beta's URL (should fail/redirect)
3. Verify cannot see Org Beta's data
4. Sign in as User B
5. Verify same isolation for Org Alpha

### 3. Test SDK Integration

**Generate API Key:**
1. Create organization
2. Create application
3. Copy API key

**Test SDK:**
```typescript
import { BugReporter } from '@bug-reporter/bug-reporter-sdk';

const bugReporter = new BugReporter({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-project.vercel.app',
  organizationSlug: 'your-org-slug',
  applicationSlug: 'your-app-slug',
});

// Report a test bug
await bugReporter.reportBug({
  title: 'Test Bug',
  description: 'Testing production deployment',
  severity: 'low',
  metadata: { test: true },
});
```

**Verify:**
- Bug appears in dashboard
- API key authentication works
- Data saves correctly

### 4. Test Public API

**Test Endpoints:**
```bash
# Set your API key
API_KEY="your-api-key"
BASE_URL="https://your-project.vercel.app"

# Create bug report
curl -X POST "$BASE_URL/api/v1/public/bug-reports" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Bug",
    "description": "Testing API",
    "severity": "medium"
  }'

# Get my bug reports
curl "$BASE_URL/api/v1/public/bug-reports/me" \
  -H "X-API-Key: $API_KEY"

# Get specific bug
curl "$BASE_URL/api/v1/public/bug-reports/[id]" \
  -H "X-API-Key: $API_KEY"

# Add message
curl -X POST "$BASE_URL/api/v1/public/bug-reports/[id]/messages" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message via API"
  }'
```

### 5. Test Team Management

1. Invite team member
2. Verify email received
3. Accept invitation
4. Test role permissions
5. Update member role
6. Remove member
7. Verify access revoked

---

## 🔍 Monitoring & Debugging

### Vercel Logs

**View Real-Time Logs:**
1. Go to Vercel Dashboard → Project → Logs
2. Filter by:
   - Runtime logs (serverless functions)
   - Build logs
   - Static logs

**Via CLI:**
```bash
# View recent logs
vercel logs

# Follow logs in real-time
vercel logs --follow

# Filter by function
vercel logs --follow api/v1/public/bug-reports
```

### Supabase Logs

**View Database Logs:**
1. Go to Supabase Dashboard → Logs
2. Select log type:
   - Postgres logs
   - API logs
   - Auth logs
   - Realtime logs

**Query Logs:**
```sql
-- View recent errors
SELECT * FROM postgres_logs
WHERE level = 'ERROR'
ORDER BY timestamp DESC
LIMIT 100;

-- View slow queries
SELECT * FROM postgres_logs
WHERE duration > 1000
ORDER BY timestamp DESC;
```

### Error Tracking (Optional)

**Recommended:** Integrate Sentry for error tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard -i nextjs

# Configure in next.config.js
```

---

## 🎯 Performance Optimization

### Vercel Configuration

**Enable Speed Insights:**
1. Go to project settings → Speed Insights
2. Enable Web Vitals tracking
3. Monitor Core Web Vitals

**Enable Analytics:**
1. Go to project settings → Analytics
2. Enable Vercel Analytics
3. View real-time traffic

### Database Optimization

**Add Recommended Indexes:**
```sql
-- Missing foreign key indexes
CREATE INDEX idx_message_metadata_user
ON bug_report_message_metadata(user_id);

CREATE INDEX idx_messages_reply_to
ON bug_report_messages(reply_to_message_id);

CREATE INDEX idx_typing_user
ON bug_report_typing(user_id);
```

**Optimize RLS Policies:**
```sql
-- Example: Optimize organizations policy
DROP POLICY IF EXISTS org_members_view_org ON organizations;

CREATE POLICY org_members_view_org ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = id
    AND user_id = (SELECT auth.uid())  -- Wrapped in subquery
  )
);
```

### Caching Strategy

**React Query Configuration:**
```typescript
// apps/platform/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

---

## 🔒 Security Hardening

### Pre-Production Checklist

- [ ] Review all RLS policies
- [ ] Enable Supabase rate limiting
- [ ] Configure CORS properly
- [ ] Set up custom SMTP (avoid rate limits)
- [ ] Enable MFA for admin accounts
- [ ] Rotate API keys
- [ ] Set up database backups
- [ ] Enable Vercel IP allowlist (optional)
- [ ] Configure CSP headers
- [ ] Enable HTTPS-only cookies

### Fix Security Advisories

**1. Fix Function Search Path:**
```sql
ALTER FUNCTION cleanup_old_typing_indicators()
SET search_path = public;
```

**2. Optimize Auth Calls in RLS:**
Replace all instances of `auth.uid()` with `(select auth.uid())`

---

## 🌐 Custom Domain Setup

### Add Custom Domain

1. **Vercel Dashboard:**
   - Go to project → Settings → Domains
   - Add your domain: `yourdomain.com`
   - Add `www.yourdomain.com` (optional)

2. **Configure DNS:**
   - Add A record: `76.76.21.21` (Vercel IP)
   - Or CNAME: `cname.vercel-dns.com`
   - Wait for DNS propagation (~5-60 minutes)

3. **Update Environment Variables:**
   ```
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

4. **Update Supabase:**
   - Site URL → `https://yourdomain.com`
   - Add redirect URL → `https://yourdomain.com/**`
   - Update email templates with new domain

5. **Verify SSL:**
   - Vercel automatically provisions SSL
   - Check https://yourdomain.com loads correctly

---

## 📊 Production Monitoring

### Set Up Alerts

**Vercel Alerts:**
1. Project settings → Notifications
2. Configure alerts for:
   - Build failures
   - High error rates
   - Performance degradation

**Supabase Alerts:**
1. Project settings → Reports
2. Enable alerts for:
   - High database CPU
   - Connection pool exhaustion
   - Slow queries

### Regular Maintenance

**Weekly:**
- Review error logs
- Check performance metrics
- Monitor database size
- Review API usage

**Monthly:**
- Review security advisories
- Update dependencies
- Optimize slow queries
- Review backup strategy

---

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in Vercel Dashboard
# Common causes:
# - Missing environment variables
# - TypeScript errors
# - Dependency issues

# Solution: Verify environment variables are set correctly
```

**Authentication Not Working:**
```bash
# Check:
# 1. Supabase Site URL matches deployment URL
# 2. Redirect URLs include deployment domain
# 3. Environment variables are correct
# 4. Email templates use correct URLs
```

**RLS Policy Errors:**
```sql
-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'organizations';

-- Test policy with user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-id-here';
SELECT * FROM organizations;
```

**API Key Authentication Failing:**
```bash
# Verify:
# 1. API key is correct
# 2. Application exists in database
# 3. X-API-Key header is set
# 4. CORS is configured correctly
```

---

## 📚 Additional Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Project README](./README.md)

### Support
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- Project Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## ✅ Deployment Checklist

### Before Deploying
- [ ] All tests pass
- [ ] TypeScript checks pass
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Supabase credentials available

### During Deployment
- [ ] Repository connected to Vercel
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Initial deployment successful
- [ ] Deployment URL accessible

### After Deployment
- [ ] Authentication flows tested
- [ ] Multi-org isolation verified
- [ ] SDK integration tested
- [ ] API endpoints tested
- [ ] Team management tested
- [ ] Email delivery verified
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Custom domain added (if applicable)
- [ ] Production security hardened

---

**Deployment Status:** Ready for production! 🚀

For issues or questions, refer to [TESTING_DEPLOYMENT_COMPLETE.md](./TESTING_DEPLOYMENT_COMPLETE.md) for detailed testing and troubleshooting guides.
