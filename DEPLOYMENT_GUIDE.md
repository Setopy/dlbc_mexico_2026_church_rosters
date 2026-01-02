# Church Roster PWA - Deployment Guide
## Deeper Life Bible Church, Mexico

---

## 📱 What This App Does

A Progressive Web App (PWA) that:
- Shows each member their personalized schedule
- Works offline (no internet needed after first load)
- Can be installed on phone home screen like a native app
- Shows upcoming events and calendar view
- Can send push notifications (with server setup)

---

## 🚀 Free Hosting Options

### Option 1: GitHub Pages (Recommended - 100% Free)

1. **Create a GitHub account** at https://github.com (if you don't have one)

2. **Create a new repository**
   - Click "New" → Name it `dlbc-roster`
   - Make it Public
   - Click "Create repository"

3. **Upload the files**
   - Click "Upload files"
   - Drag all files from the `church_app` folder:
     - index.html
     - app.js
     - schedules.js
     - manifest.json
     - sw.js
     - icon.svg
   - Click "Commit changes"

4. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" → "/ (root)"
   - Click "Save"

5. **Your app is live!**
   - URL will be: `https://yourusername.github.io/dlbc-roster`
   - Share this link with church members

---

### Option 2: Netlify (Also Free)

1. Go to https://www.netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Deploy manually"
4. Drag the `church_app` folder to upload
5. Get your free URL like `dlbc-roster.netlify.app`

---

### Option 3: Vercel (Also Free)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository or upload files
4. Get your free URL

---

## 📲 How Members Install the App

### On Android:
1. Open the link in Chrome
2. Tap the menu (3 dots) → "Add to Home screen"
3. The app icon appears on their home screen

### On iPhone:
1. Open the link in Safari
2. Tap the Share button → "Add to Home Screen"
3. The app icon appears on their home screen

---

## 🖼️ Creating App Icons

The app needs PNG icons. Convert the SVG icon:

### Online Tool (Easiest):
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set size to 192x192, download as `icon-192.png`
4. Repeat with size 512x512 for `icon-512.png`
5. Add both files to your app folder

### Or use this command (if you have ImageMagick):
```bash
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png
```

---

## 🔄 Updating the Schedule

If you need to update the schedule:

1. Edit `schedules.js` with the new data
2. Update the version in `sw.js`:
   ```javascript
   const CACHE_NAME = 'dlbc-roster-v2';  // Change v1 to v2
   ```
3. Re-upload the files to your hosting

---

## 🔔 Adding Push Notifications (Advanced)

To enable real push notifications, you need:
1. A backend server (Node.js, Python, etc.)
2. Web Push library
3. VAPID keys for authentication

### Simple Alternative: Use OneSignal
1. Sign up at https://onesignal.com (free tier available)
2. Follow their web push setup guide
3. Add their SDK to your app

---

## 📊 Analytics (Optional)

To track app usage, add Google Analytics:
1. Create account at https://analytics.google.com
2. Get your tracking ID
3. Add the script to `index.html`

---

## ❓ Troubleshooting

### "App not installing on home screen"
- Make sure you're using HTTPS (GitHub Pages provides this)
- Check that manifest.json is valid
- Ensure icon files exist

### "Schedule not showing"
- Check browser console for errors (F12)
- Verify schedules.js is loaded correctly

### "Offline mode not working"
- Service worker needs HTTPS
- Clear browser cache and reload

---

## 📞 Support

For technical help:
- GitHub Pages docs: https://docs.github.com/pages
- PWA docs: https://web.dev/progressive-web-apps/

---

## 📁 File Checklist

Make sure you have all these files:
- [ ] index.html
- [ ] app.js
- [ ] schedules.js
- [ ] manifest.json
- [ ] sw.js
- [ ] icon-192.png
- [ ] icon-512.png

