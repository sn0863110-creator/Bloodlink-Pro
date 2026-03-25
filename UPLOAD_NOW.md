# 🚨 BloodLink Pro — GitHub Upload Guide

## Problem
Live site pe purani files hain. Saari fixes local hain, GitHub pe upload nahi hui.

## Proof
Live site: https://sn0863110-creator.github.io/BloodLink-Pro/
- Navbar mein sirf "BloodLinkPro" dikh raha hai, koi links nahi
- Matlab purana index.html chal raha hai

## Files to Upload (ALL of these)

### Priority 1 — MUST UPLOAD
- script.js (v5 — hamburger fix)
- style.css (blp-drawer CSS)
- sw.js (blp-v24 — cache clear)

### Priority 2 — HTML files (all 13)
- index.html
- about.html
- banks.html
- dashboard.html
- donor.html
- emergency.html
- login.html
- pricing.html
- privacy.html
- profile.html
- register.html
- search.html
- terms.html

## How to Upload

### Method 1: GitHub Web (Easiest)
1. Go to: https://github.com/sn0863110-creator/BloodLink-Pro
2. Click "Add file" → "Upload files"
3. Drag ALL files listed above
4. Click "Commit changes"
5. Wait 2-3 minutes for GitHub Pages to deploy

### Method 2: One by one
1. Click on file name in GitHub
2. Click pencil icon (Edit)
3. Select all → Delete → Paste new content
4. Commit

## After Upload — Clear Cache on Phone
1. Chrome → 3 dots → Settings
2. Privacy and security → Clear browsing data
3. Check "Cached images and files"
4. Clear data
5. Open site fresh

## Verify Fix Worked
Open browser console (F12) and check:
- Should see: "BloodLink Pro script.js v5 loaded ✅"
- If you see v4 or nothing → cache not cleared yet
