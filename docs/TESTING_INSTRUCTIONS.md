# 🧪 Testing Instructions - Bug Reporter Demo

## ✅ CORS Issues Fixed!

All CORS (Cross-Origin Resource Sharing) errors have been resolved. The platform API now properly handles requests from the demo app.

### What Was Fixed:

1. **Added CORS headers** to all API responses:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, X-API-Key, x-api-key`

2. **Added OPTIONS handlers** for preflight requests in:
   - `/api/v1/public/bug-reports`
   - `/api/v1/public/bug-reports/me`

3. **Updated middleware** to include CORS headers in both success and error responses

---

## 🚀 How to Test

### Step 1: Start the Platform (Terminal 1)

```bash
cd platforms
npm run dev
```

**Wait for:** `▲ Next.js 16.0.1`  
**URL:** `http://localhost:3000`

**Important:** Make sure you see "Local: http://localhost:3000" before proceeding!

### Step 2: Verify Platform is Running

Open your browser and visit: `http://localhost:3000`

You should see the Bug Reporter Platform homepage.

### Step 3: Start the Demo App (Terminal 2)

```bash
cd demo-app
npm run dev
```

**Wait for:** `➜  Local:   http://localhost:5173`  
**URL:** `http://localhost:5173`

### Step 4: Test Bug Submission

1. **Open demo app** - Navigate to `http://localhost:5173`
2. **Verify UI loads** - You should see "🐛 Bug Reporter Demo App"
3. **Check for bug button** - Look for the floating 🐛 button in bottom-right corner
4. **Click the bug button** - Modal should open
5. **Fill out the form:**
   - **Title:** "Test Bug from Demo App"
   - **Description:** "Testing the SDK integration with CORS fix"
   - **Priority:** Select "High"
6. **Submit** - Click "Submit Bug Report"
7. **Success toast** - You should see a green success message!

### Step 5: Verify Bug in Platform

1. **Go to platform** - `http://localhost:3000`
2. **Login** with `admin@gmail.com` (your password)
3. **Navigate to organization** - Select "Test Organization"
4. **Go to Bug Reports** - Click "Bug Reports" in sidebar
5. **See your bug** - Your test bug should appear in the list!
6. **Click on it** - View full details including screenshot

---

## 🎯 Expected Results

### ✅ What Should Work:

- Demo app loads without errors
- Floating bug button is visible
- Clicking button opens modal
- Screenshot is automatically captured
- Form submission works without CORS errors
- Success toast appears after submission
- Bug appears in platform dashboard
- Screenshot is displayed in bug details

### ❌ What to Check if It Doesn't Work:

1. **Platform not running on port 3000**
   - Check Terminal 1 for errors
   - Make sure you see "Local: http://localhost:3000"

2. **Still seeing CORS errors**
   - Stop the platform server (Ctrl+C in Terminal 1)
   - Restart it: `cd platforms && npm run dev`
   - Clear browser cache or use incognito mode

3. **API Key errors**
   - Verify API key in `demo-app/src/main.tsx` matches database
   - Current key: `br_NuIf5ghx-kA-C9EKsxul-wANVmC-z8jS`

4. **"Show My Bugs" panel not loading**
   - Check browser console for errors
   - Make sure platform is running
   - Check API key is correct

---

## 🔍 Browser Console Debugging

Open browser console (F12) to see SDK debug logs:

### Expected Console Output:

```
[BugReporter SDK] Initialized with config: { apiUrl: "http://localhost:3000", ... }
[BugReporter SDK] Starting screenshot capture...
[BugReporter SDK] Screenshot captured successfully
[BugReporter SDK] Request: { url: "http://localhost:3000/api/v1/public/bug-reports", method: "POST" }
[BugReporter SDK] Response: { bug_report: {...} }
```

### If You See Errors:

- **CORS Error** → Restart platform server
- **Network Failed** → Platform not running
- **401 Unauthorized** → API key invalid
- **500 Internal Error** → Check platform logs in Terminal 1

---

## 📊 Test Checklist

Use this checklist to verify everything works:

- [ ] Platform starts successfully on port 3000
- [ ] Demo app starts successfully on port 5173
- [ ] Demo app UI loads without errors
- [ ] Floating 🐛 button is visible
- [ ] Clicking button opens modal
- [ ] Modal shows screenshot preview
- [ ] Can fill in title and description
- [ ] Can select priority
- [ ] Submit button works
- [ ] NO CORS errors in console
- [ ] Success toast appears
- [ ] Bug appears in platform dashboard
- [ ] Can view bug details
- [ ] Screenshot displays correctly
- [ ] "Show My Bugs" panel works

---

## 🎉 Success Criteria

The test is successful when:

1. ✅ You can submit a bug from the demo app
2. ✅ No CORS errors appear in console
3. ✅ Bug appears in platform within 5 seconds
4. ✅ Screenshot is captured and displayed
5. ✅ All bug details are correct

---

## 🆘 Need Help?

If you're still encountering issues:

1. **Check both terminal windows** for error messages
2. **Clear browser cache** or use incognito mode
3. **Verify ports** 3000 and 5173 are not in use by other apps
4. **Restart both servers** (stop with Ctrl+C, start again)
5. **Check .env files** in platforms/ directory

---

## 🎊 Next Steps After Successful Test

Once testing is successful, you can:

1. **Customize the demo app** - Modify UI, add more test features
2. **Test other features** - Try "Show My Bugs" panel
3. **Test error scenarios** - Click "Trigger Error" button
4. **Integrate in real app** - Use the SDK in your actual application
5. **Deploy to production** - Follow DEPLOYMENT.md guide

Happy Testing! 🚀
