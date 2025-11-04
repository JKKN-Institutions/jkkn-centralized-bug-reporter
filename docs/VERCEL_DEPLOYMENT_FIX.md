# Vercel Deployment Fix

## Issue Fixed ✅

**Error:** `Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase-url", which does not exist.`

**Solution:** Updated `vercel.json` to remove secret references. Environment variables should be added directly in Vercel UI, not referenced from vercel.json.

---

## ✅ Fixed Configuration

The `vercel.json` file has been simplified to only include CORS headers (which are necessary for API routes). All other configuration will be done through Vercel's UI.

---

## 🚀 Correct Deployment Steps

### Step 1: Configure Project in Vercel UI

When importing your GitHub repository:

1. **Project Settings:**
   - Name: `jkkn-bug-reporter-platform`
   - Framework Preset: `Next.js`
   - **Root Directory:** Click "Edit" → Select `platforms` folder ⚠️
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### Step 2: Add Environment Variables in Vercel UI

Click **"Environment Variables"** section and add these one by one:

#### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-anon-key-here

SUPABASE_SERVICE_ROLE_KEY
Value: your-service-role-key-here

NEXT_PUBLIC_APP_URL
Value: https://your-app.vercel.app
```

**How to get Supabase values:**
1. Go to [supabase.com](https://supabase.com) → Your Project
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

**Note:** For `NEXT_PUBLIC_APP_URL`, use placeholder first (like `https://yourapp.vercel.app`), then update it after deployment with your actual Vercel URL.

### Step 3: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. ✅ Your platform will be live!

---

## 📋 Important Notes

### ⚠️ Don't Use vercel.json for Environment Variables

The previous `vercel.json` tried to reference secrets with `@secret-name` syntax. This requires:
- Creating secrets via Vercel CLI: `vercel secrets add secret-name value`
- Linking them in vercel.json with `@` prefix

**This is unnecessary!** It's simpler to add environment variables directly in the Vercel UI during deployment.

### ✅ What vercel.json Now Contains

The updated `vercel.json` only includes:
- **CORS headers** for `/api/*` routes - This is important for the demo app to call the platform API

---

## 🔄 If You Already Started Deployment

If you already clicked deploy and saw the error:

1. **Cancel the current deployment** or let it fail
2. **Pull the latest code** with the fixed `vercel.json`:
   ```bash
   git pull
   ```
3. Or **manually delete vercel.json** from your repository
4. **Redeploy** and add environment variables through the UI

---

## 📱 Demo App Deployment

For the demo app (after platform is deployed):

1. Import the **same repository** again in Vercel
2. Configure:
   - Name: `jkkn-bug-reporter-demo`
   - Framework: `Vite`
   - **Root Directory:** `demo-app` ⚠️
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. Add environment variables:
   ```
   VITE_API_KEY=your-api-key-from-platform
   VITE_API_URL=https://your-platform.vercel.app
   VITE_USER_ID=demo-user-123
   VITE_USER_NAME=Demo User
   VITE_USER_EMAIL=demo@example.com
   VITE_DEBUG=false
   ```

---

## ✅ Summary

**Problem:** vercel.json referenced secrets that didn't exist
**Solution:** Removed secret references, add env vars through Vercel UI instead
**Status:** Ready to deploy! Just follow the steps above.

---

**Last Updated:** November 4, 2025
