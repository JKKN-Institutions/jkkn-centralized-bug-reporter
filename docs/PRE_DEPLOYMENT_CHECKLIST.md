# Pre-Deployment Checklist - JKKN Bug Reporter

This checklist ensures both the **Main Platform** and **Demo Application** are ready for deployment to Vercel.

---

## ✅ Completed Items

### Platform (Main Application)

- [x] Next.js 16 platform setup in `platforms/` directory
- [x] Professional admin dashboard with Shadcn UI sidebar
- [x] Responsive layout with collapsible sidebar
- [x] Active menu state visibility with blue gradients
- [x] Authentication pages (Login/Signup) with consistent navbar
- [x] Organization management module
- [x] Applications management module
- [x] Bug Reports module with filters and status management
- [x] Team Members module
- [x] Leaderboard module
- [x] Messaging/Notifications module
- [x] Public API endpoints for SDK integration
- [x] Supabase integration with RLS policies
- [x] TypeScript types and proper type safety

### Demo Application

- [x] Vite + React demo app in `demo-app/` directory
- [x] Bug Reporter SDK integration
- [x] Screenshot capture functionality
- [x] Bug submission form
- [x] Environment variables support (.env.example created)

### Database & Backend

- [x] Supabase project configured
- [x] Database schema with multi-tenancy
- [x] RLS policies for data isolation
- [x] Row Level Security enabled
- [x] Organizations, Applications, Bug Reports tables
- [x] Team members and leaderboard tables
- [x] Messaging tables

---

## 📋 Pre-Deployment Tasks

### 1. GitHub Repository Setup

- [ ] Push all code to GitHub repository
  ```bash
  git add .
  git commit -m "feat: prepare for deployment"
  git push origin master
  ```

### 2. Platform Environment Variables

Prepare these values from Supabase Dashboard:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- [ ] `NEXT_PUBLIC_APP_URL` - Will be your Vercel URL after deployment

**Get these from:** Supabase Dashboard → Settings → API

### 3. Demo App Environment Variables

- [ ] `VITE_API_KEY` - Get from platform after deployment (Applications → Create/View App → Copy API Key)
- [ ] `VITE_API_URL` - Your deployed platform URL
- [ ] `VITE_USER_ID` - Demo user identifier (can be any string)
- [ ] `VITE_USER_NAME` - Demo user display name
- [ ] `VITE_USER_EMAIL` - Demo user email
- [ ] `VITE_DEBUG` - Set to `true` for development, `false` for production

### 4. Supabase Configuration

- [ ] Update Supabase Authentication → URL Configuration:
  - Site URL: `https://your-platform.vercel.app`
  - Redirect URLs: `https://your-platform.vercel.app/**`

- [ ] Verify RLS policies are enabled on all tables

- [ ] Test database connection from local environment

### 5. Build Tests

Run these locally before deployment:

**Platform Build Test:**
```bash
cd platforms
npm run build
```
Expected: No errors, successful build

**Demo App Build Test:**
```bash
cd demo-app
npm run build
```
Expected: No errors, `dist/` folder created

**Type Check:**
```bash
cd platforms
npx tsc --noEmit
```
Expected: No type errors

### 6. Code Quality Checks

- [ ] Run linter on platform: `cd platforms && npm run lint`
- [ ] Run linter on demo app: `cd demo-app && npm run lint`
- [ ] Fix any linting errors
- [ ] Verify no console.log statements in production code (demo app is OK)

---

## 🚀 Deployment Order

**IMPORTANT:** Deploy in this specific order to avoid dependency issues.

### Step 1: Deploy Main Platform (FIRST)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - Name: `jkkn-bug-reporter-platform`
   - Framework: Next.js
   - Root Directory: `platforms`
   - Add all environment variables
4. Deploy
5. **Note the deployment URL** - you'll need this for the demo app!

**After Platform Deployment:**
- [ ] Visit the deployed platform URL
- [ ] Sign up and create an organization
- [ ] Create an application and copy its API key
- [ ] Test login/logout functionality
- [ ] Verify organization dashboard loads correctly

### Step 2: Update Supabase Redirect URLs

- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Add your Vercel platform URL to allowed redirect URLs
- [ ] Test authentication again on deployed platform

### Step 3: Deploy Demo App (SECOND)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **SAME** GitHub repository
3. Configure project:
   - Name: `jkkn-bug-reporter-demo`
   - Framework: Vite
   - Root Directory: `demo-app`
   - Add environment variables (use API key from Step 1)
   - Set `VITE_API_URL` to your platform URL
4. Deploy

**After Demo App Deployment:**
- [ ] Visit the deployed demo app URL
- [ ] Click "Report a Bug" button
- [ ] Fill out the bug form
- [ ] Submit a test bug report
- [ ] Go to platform → Bug Reports
- [ ] Verify the bug appears in the platform

---

## 🔍 Post-Deployment Verification

### Platform Verification

- [ ] Homepage loads correctly
- [ ] Login page works (no 404 errors)
- [ ] Can sign up with email
- [ ] Can create an organization
- [ ] Organization dashboard displays stats
- [ ] Sidebar navigation works (all links)
- [ ] Can create an application
- [ ] Can view applications list
- [ ] Can access bug reports page
- [ ] Team members page loads
- [ ] Leaderboard page loads
- [ ] Can logout successfully

### Demo App Verification

- [ ] Demo app homepage loads
- [ ] Bug report button is visible
- [ ] Clicking bug report opens the form
- [ ] Can fill out bug details (title, description)
- [ ] Can select severity level
- [ ] Can take screenshot (if enabled)
- [ ] Submit button works
- [ ] Success message appears after submission
- [ ] Bug appears in platform's bug reports page

### Integration Verification

- [ ] Demo app can connect to platform API
- [ ] API key authentication works
- [ ] Bug reports from demo app appear in platform
- [ ] Bug report details are complete (title, description, metadata)
- [ ] Screenshot is captured and uploaded (if enabled)
- [ ] User context is passed correctly

---

## 🛠️ Troubleshooting Guide

### Issue: Build fails with "Module not found"

**Solution:** Verify Root Directory setting in Vercel:
- Platform: `platforms`
- Demo App: `demo-app`

### Issue: Environment variables not working

**Solution:**
1. Verify variable names are correct (NEXT_PUBLIC_ for platform, VITE_ for demo)
2. Redeploy after adding environment variables
3. Check if values have quotes (remove them)

### Issue: Platform shows white screen

**Solution:**
1. Check Vercel deployment logs for errors
2. Verify Supabase connection (check env variables)
3. Check browser console for JavaScript errors

### Issue: Demo app can't connect to platform

**Solution:**
1. Verify `VITE_API_URL` is correct (should be your platform URL)
2. Check if API key is valid
3. Verify CORS is enabled in platform API routes
4. Check browser network tab for API call errors

### Issue: Authentication redirect fails

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL to redirect URLs
3. Include wildcard: `https://your-platform.vercel.app/**`

---

## 📊 Current Application Status

### Platform Status: ✅ READY FOR DEPLOYMENT

**Current Features:**
- Organizations: 1 (Test Organization)
- Applications: 3 registered apps
- Bug Reports: 1 total report
- Team Members: 2 active members
- Modern UI with professional sidebar
- Responsive design with mobile support
- Blue gradient active states
- Proper spacing and layout

### Demo App Status: ✅ READY FOR DEPLOYMENT

**Current Features:**
- Bug report form with all fields
- Screenshot capture capability
- SDK integration working locally
- Environment variables configured
- Vite build configuration ready

---

## 📝 Environment Variables Summary

### Platform Variables (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-platform.vercel.app
```

### Demo App Variables (Vercel)

```env
VITE_API_KEY=your-api-key-from-platform
VITE_API_URL=https://your-platform.vercel.app
VITE_USER_ID=demo-user-123
VITE_USER_NAME=Demo User
VITE_USER_EMAIL=demo@example.com
VITE_DEBUG=false
```

---

## 🎯 Success Criteria

Both deployments are successful when:

1. ✅ Platform URL loads without errors
2. ✅ Can sign up, login, and navigate all pages
3. ✅ Demo app URL loads correctly
4. ✅ Can submit bug from demo app
5. ✅ Bug appears in platform's bug reports page
6. ✅ All links work (no 404 errors)
7. ✅ Responsive design works on mobile
8. ✅ Authentication works properly

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## ⏭️ Next Steps After Deployment

1. Test all features thoroughly on production
2. Share URLs with team for feedback
3. Monitor Vercel analytics for errors
4. Set up custom domains (optional)
5. Configure CDN and caching (optional)
6. Set up error tracking (Sentry, LogRocket, etc.)
7. Create user documentation
8. Plan for future features

---

**Ready to deploy?** Follow the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions!
