// ============================================================
// BloodLink Pro — Firebase Configuration (Compat SDK)
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create project "bloodlink-pro"
// 3. Add Web App → copy firebaseConfig below
// 4. Enable Firestore Database (Start in test mode)
// 5. Enable Authentication → Email/Password
// 6. Replace the config values below with your own
// ============================================================

// NOTE: This file is NOT a module — Firebase compat SDK is
// loaded via CDN scripts in HTML <head>. This file just holds
// the config object used by script.js initFirebase().

// ── YOUR FIREBASE CONFIG (replace with your own) ──────────
// Get from: Firebase Console → Project Settings → Your Apps → Web App
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY",
  authDomain:        "bloodlink-pro.firebaseapp.com",
  projectId:         "bloodlink-pro",
  storageBucket:     "bloodlink-pro.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};

// ── Firestore Collections Structure ───────────────────────
// users/              → user profiles (name, city, phone, role, blood)
// donors/             → donor records (blood, city, phone, available, status, health, lastDonation, lat, lon)
// emergency_requests/ → blood requests (blood, city, urgency, status, contact, hospital)
// market/             → transactions
// listings/           → blood listings
// reports/            → reported donors
// logs/               → activity logs (future use)

// ── Firestore Security Rules (paste in Firebase Console) ──
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth != null;
    }
    // Donors: anyone can read approved donors, auth users can add
    match /donors/{id} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.token.email == 'sn0863110@gmail.com' ||
         resource.data.uid == request.auth.uid);
    }
    // Emergency requests: anyone can read/create, admin can update
    match /emergency_requests/{id} {
      allow read, create: if true;
      allow update: if request.auth != null;
    }
    // Market/listings: auth users only
    match /market/{id} { allow read, write: if request.auth != null; }
    match /listings/{id} { allow read, write: if request.auth != null; }
    // Reports: auth users can create, admin can read/delete
    match /reports/{id} {
      allow create: if request.auth != null;
      allow read, delete: if request.auth != null &&
        request.auth.token.email == 'sn0863110@gmail.com';
    }
    // Logs: write only
    match /logs/{id} { allow create: if true; }
  }
}
*/
