// ============================================================
// BloodLink Pro — Firebase Database Layer (firebase-db.js)
// NOTE: This file documents the Firebase operations.
// Actual Firebase calls are in script.js using compat SDK.
// Firebase compat SDK is loaded via CDN in HTML <head>.
// ============================================================

// ── ADMIN CONFIG ───────────────────────────────────────────
const ADMIN_EMAIL_FB = 'sn0863110@gmail.com';
const ADMIN_PHONE_FB = '9335857482';

// ── All Firebase operations are in script.js ──────────────
// Functions available globally from script.js:
//   initFirebase()          — initialize Firebase app
//   fbSignUp(email, pass, profile) — register user
//   fbSignIn(email, pass)   — login user
//   fbSignOut()             — logout
//   fbResetPassword(email)  — send reset email
//   fbGetAll(collection)    — get all docs
//   fbAdd(collection, data) — add document
//   fbUpdate(col, id, data) — update document
//   fbDelete(col, id)       — delete document
//   fbQuery(col, field, op, value) — query with filter
//   getDonors()             — get all donors (Firebase → JSONBin fallback)
//   addDonorToDb(data)      — add donor
//   updateDonorInDb(id, data) — update donor
//   deleteDonorFromDb(id)   — delete donor
//   addEmergencyRequest(data) — add emergency request
//   getEmergencyRequests()  — get active requests
//   addReport(data)         — add report
//   getReports()            — get all reports

// ── Firestore Collections ──────────────────────────────────
// users/              → { uid, name, email, phone, city, role, blood, createdAt }
// donors/             → { name, blood, city, phone, available, health, lastDonation, lat, lon, status, createdAt }
// emergency_requests/ → { name, blood, units, city, contact, hospital, urgency, status, ts, createdAt }
// market/             → { type, blood, units, city, price, contact, ts, createdAt }
// listings/           → { blood, units, city, price, contact, remaining, ts, createdAt }
// reports/            → { donorId, donorName, reason, reportedBy, ts, createdAt }
// logs/               → { action, data, ts, createdAt }
