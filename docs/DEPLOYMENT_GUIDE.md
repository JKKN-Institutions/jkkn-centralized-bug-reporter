# Deployment Guide - JKKN Bug Reporter

This guide will help you deploy both the **Main Platform** and **Demo Application** to Vercel.

---

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Push your code to GitHub
3. **Supabase Project** - Your existing Supabase project
4. **Environment Variables** - From your `.env.local` files

---

## Part 1: Prepare Your Repository

### 1. Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - JKKN Bug Reporter"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/jkkn-bug-reporter.git

# Push to GitHub
git push -u origin master
```

### 2. Verify Project Structure

Your repository should have this structure:

```
jkkn-bug-reporter/
├── platforms/           # Main Platform (Next.js)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── next.config.ts
├── demo-app/           # Demo Application (Vite + React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── packages/
│   └── bug-reporter-sdk/
└── supabase/
```

---

## Part 2: Deploy Main Platform to Vercel

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `jkkn-bug-reporter`
4. Click **"Import"**

### Step 2: Configure Main Platform Project

**Important Settings:**

- **Project Name:** `jkkn-bug-reporter-platform` (or your preferred name)
- **Framework Preset:** `Next.js`
- **Root Directory:** `platforms` ⚠️ (Click "Edit" and select `platforms` folder)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### How to Get Supabase Keys:

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Click **Settings** → **API**
3. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your platform will be available at: `https://your-project.vercel.app`

### Step 5: Update Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add these URLs:
   ```
   Site URL: https://your-project.vercel.app

   Redirect URLs:
   https://your-project.vercel.app/**
   http://localhost:3000/**
   ```

---

## Part 3: Deploy Demo Application to Vercel

### Step 1: Create New Project for Demo App

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select the **SAME** repository: `jkkn-bug-reporter`
3. Click **"Import"**

### Step 2: Configure Demo App Project

**Important Settings:**

- **Project Name:** `jkkn-bug-reporter-demo` (different from platform)
- **Framework Preset:** `Vite`
- **Root Directory:** `demo-app` ⚠️ (Click "Edit" and select `demo-app` folder)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Add Demo App Environment Variables

```env
# Supabase Configuration (same as platform)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Platform API URL
VITE_PLATFORM_URL=https://your-platform-project.vercel.app

# App Configuration
VITE_APP_SLUG=demo-app
VITE_ORG_SLUG=your-org-slug
```

**Note:** If using Create React App, replace `VITE_` with `REACT_APP_`

### Step 4: Deploy Demo App

1. Click **"Deploy"**
2. Wait for build to complete
3. Your demo app will be available at: `https://your-demo.vercel.app`

---

## Part 4: Configure SDK in Demo App

### Update Demo App Code

Make sure your demo app uses the SDK properly:

```tsx
// In your demo app's main file (e.g., App.tsx or main.tsx)
import { BugReporterProvider } from '@bug-reporter/sdk';

function App() {
  return (
    <BugReporterProvider
      apiKey="your-api-key-from-platform"
      appSlug="demo-app"
      config={{
        apiUrl: import.meta.env.VITE_PLATFORM_URL, // Points to your platform
        enableScreenshot: true,
        enableConsoleLog: true,
      }}
    >
      {/* Your app content */}
    </BugReporterProvider>
  );
}
```

### Get API Key from Platform

1. Go to your deployed platform: `https://your-platform.vercel.app`
2. Login to your organization
3. Go to **Applications** → Select/Create Demo App
4. Copy the **API Key**
5. Update `VITE_API_KEY` in Vercel environment variables for demo app

---

## Part 5: Verify Deployments

### Test Main Platform

1. Visit: `https://your-platform.vercel.app`
2. Sign up / Login
3. Create an organization
4. Create an application
5. Get API key

### Test Demo App

1. Visit: `https://your-demo.vercel.app`
2. Test bug reporting functionality
3. Check if bugs appear in platform

---

## Part 6: Custom Domains (Optional)

### Add Custom Domain to Platform

1. Go to Vercel Dashboard → Your Platform Project
2. Click **Settings** → **Domains**
3. Add domain: `bugs.jkkn.ac.in` (or your domain)
4. Follow DNS configuration instructions

### Add Custom Domain to Demo App

1. Go to Vercel Dashboard → Your Demo Project
2. Click **Settings** → **Domains**
3. Add domain: `demo.jkkn.ac.in`
4. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails - Module Not Found

**Solution:** Check `Root Directory` setting in Vercel

```bash
# Platform should be: platforms
# Demo App should be: apps/demo-app
```

### Environment Variables Not Working

**Solution:**
1. Redeploy after adding env variables
2. Check variable names match your code
3. For Next.js, use `NEXT_PUBLIC_` prefix for client-side
4. For Vite, use `VITE_` prefix

### Supabase Connection Error

**Solution:**
1. Verify Supabase URL and keys
2. Check Supabase redirect URLs include your Vercel domain
3. Enable CORS in Supabase if needed

### Demo App Can't Connect to Platform

**Solution:**
1. Check `VITE_PLATFORM_URL` points to correct platform URL
2. Verify API key is correct
3. Check CORS settings in platform API routes

---

## Continuous Deployment

Both projects are now set up for continuous deployment:

1. **Push to GitHub** → Automatic deployment to Vercel
2. **Production Branch:** `master` or `main`
3. **Preview Deployments:** Any other branch

### Update Platform

```bash
git add .
git commit -m "Update platform"
git push origin master
# Automatic deployment to https://your-platform.vercel.app
```

### Update Demo App

```bash
git add .
git commit -m "Update demo app"
git push origin master
# Automatic deployment to https://your-demo.vercel.app
```

---

## Environment Variables Quick Reference

### Platform (Next.js)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### Demo App (Vite)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PLATFORM_URL=
VITE_API_KEY=
VITE_APP_SLUG=
VITE_ORG_SLUG=
```

---

## Production Checklist

- [ ] Both projects deployed successfully
- [ ] Environment variables configured
- [ ] Supabase redirect URLs updated
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active (automatic in Vercel)
- [ ] Demo app connected to platform
- [ ] Bug reporting tested end-to-end
- [ ] Performance optimization enabled
- [ ] Error tracking setup (optional)

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test locally first with production env variables

---

## Important Notes

⚠️ **Security:**
- Never commit `.env` files
- Use Vercel environment variables for secrets
- Rotate API keys if exposed

⚠️ **Performance:**
- Enable Vercel Analytics (optional)
- Monitor bundle size
- Use Vercel Edge Functions for API routes (optional)

⚠️ **Costs:**
- Vercel Free Tier: Sufficient for development
- Upgrade to Pro for production use
- Monitor usage in Vercel dashboard

---

## Next Steps After Deployment

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure backup strategies
4. Document API endpoints
5. Create user documentation
6. Set up staging environment (optional)

---

**Congratulations!** 🎉 Both your platform and demo app are now deployed to Vercel!

Access URLs:
- **Platform:** https://your-platform.vercel.app
- **Demo App:** https://your-demo.vercel.app
