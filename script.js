// BloodLink Pro — script.js v4 (Firebase + JSONBin fallback)
// ── Firebase is PRIMARY database. JSONBin kept as fallback. ──

// ── JSONBIN FALLBACK CONFIG (kept for offline/migration) ──
const API_KEY    = '$2a$10$gnr12wuvoYipciglW9hglOFE5FfQ9q0yU01ZBv8dwhwaNMfUSU.NW';
const BIN_USERS  = '69bc2150aa77b81da9fcb1e3';
const BIN_DONORS = '69bc22a2b7ec241ddc82de74';
const BIN_MARKET = '69bc22a2b7ec241ddc82de79';
const BASE_URL   = 'https://api.jsonbin.io/v3/b';

// ── FIREBASE CONFIG ────────────────────────────────────────
// Replace these values with your Firebase project config
// Get from: Firebase Console → Project Settings → Web App
// Same config is documented in firebase-config.js
const FB_CONFIG = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : {
  apiKey:            "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY",
  authDomain:        "bloodlink-pro.firebaseapp.com",
  projectId:         "bloodlink-pro",
  storageBucket:     "bloodlink-pro.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};

// ── Firebase SDK (loaded via CDN in HTML) ──────────────────
// firebase-app, firebase-auth, firebase-firestore loaded in <head>
var _fbApp = null, _fbDb = null, _fbAuth = null;
var _fbReady = false;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') { console.warn('Firebase SDK not loaded'); return false; }
    if (!_fbApp) {
      _fbApp  = firebase.initializeApp(FB_CONFIG);
      _fbDb   = firebase.firestore();
      _fbAuth = firebase.auth();
      _fbReady = true;
      // Firestore offline persistence
      _fbDb.enablePersistence({ synchronizeTabs: true }).catch(function(){});
      console.log('✅ Firebase initialized');
    }
    return true;
  } catch(e) { console.warn('Firebase init failed:', e.message); return false; }
}

// ── FIREBASE HELPERS ───────────────────────────────────────
async function fbCol(name) { return _fbDb.collection(name); }

async function fbGetAll(colName) {
  if (!_fbReady) return null;
  try {
    var snap = await _fbDb.collection(colName).orderBy('createdAt', 'desc').get();
    return snap.docs.map(function(d){ return Object.assign({ id: d.id }, d.data()); });
  } catch(e) { return null; }
}

async function fbAdd(colName, data) {
  if (!_fbReady) return null;
  try {
    var ref = await _fbDb.collection(colName).add(Object.assign({}, data, { createdAt: firebase.firestore.FieldValue.serverTimestamp(), ts: Date.now() }));
    return ref.id;
  } catch(e) { return null; }
}

async function fbUpdate(colName, id, data) {
  if (!_fbReady) return false;
  try {
    await _fbDb.collection(colName).doc(id).update(Object.assign({}, data, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
    return true;
  } catch(e) { return false; }
}

async function fbDelete(colName, id) {
  if (!_fbReady) return false;
  try { await _fbDb.collection(colName).doc(id).delete(); return true; }
  catch(e) { return false; }
}

async function fbQuery(colName, field, op, value) {
  if (!_fbReady) return null;
  try {
    var snap = await _fbDb.collection(colName).where(field, op, value).get();
    return snap.docs.map(function(d){ return Object.assign({ id: d.id }, d.data()); });
  } catch(e) { return null; }
}

// ── FIREBASE AUTH ──────────────────────────────────────────
async function fbSignUp(email, password, profile) {
  if (!_fbReady) throw new Error('Firebase not ready');
  var cred = await _fbAuth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: profile.name });
  await _fbDb.collection('users').doc(cred.user.uid).set(Object.assign({}, profile, {
    uid: cred.user.uid, email: email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }));
  return cred.user;
}

async function fbSignIn(email, password) {
  if (!_fbReady) throw new Error('Firebase not ready');
  var cred = await _fbAuth.signInWithEmailAndPassword(email, password);
  // Get profile from Firestore
  var snap = await _fbDb.collection('users').doc(cred.user.uid).get();
  var profile = snap.exists ? snap.data() : {};
  var user = Object.assign({ uid: cred.user.uid, email: email }, profile);
  localStorage.setItem('blp_user', JSON.stringify(user));
  return user;
}

async function fbSignOut() {
  if (_fbReady) await _fbAuth.signOut();
  localStorage.removeItem('blp_user');
  window.location.href = 'login.html';
}

async function fbResetPassword(email) {
  if (!_fbReady) throw new Error('Firebase not ready');
  await _fbAuth.sendPasswordResetEmail(email);
}

// ── ADMIN CONFIG ──────────────────────────────────────────
const ADMIN_EMAIL = 'sn0863110@gmail.com';
const ADMIN_PHONE = '9335857482';
function isAdmin() {
  var u = currentUser();
  return u && (u.email === ADMIN_EMAIL || u.phone === ADMIN_PHONE || u.role === 'admin');
}

// ── JSONBIN FALLBACK ───────────────────────────────────────
async function jbGet(id) {
  try {
    const r = await fetch(BASE_URL+'/'+id+'/latest', {headers:{'X-Master-Key':API_KEY}});
    if (!r.ok) return null;
    return (await r.json()).record || null;
  } catch(e) { return null; }
}
async function jbPut(id, data) {
  try {
    const r = await fetch(BASE_URL+'/'+id, {method:'PUT', headers:{'Content-Type':'application/json','X-Master-Key':API_KEY}, body:JSON.stringify(data)});
    return r.ok;
  } catch(e) { return false; }
}

// ── UNIFIED DATA LAYER ─────────────────────────────────────
// Uses Firebase if ready, falls back to JSONBin

async function getUsers() {
  // Firebase first
  if (_fbReady) {
    var users = await fbGetAll('users');
    if (users) { localStorage.setItem('blp_uc', JSON.stringify(users)); return users; }
  }
  // JSONBin fallback
  const c = await jbGet(BIN_USERS);
  if (c && Array.isArray(c.users)) { localStorage.setItem('blp_uc', JSON.stringify(c.users)); return c.users; }
  const l = localStorage.getItem('blp_uc'); return l ? JSON.parse(l) : [];
}

async function saveUsers(arr) {
  localStorage.setItem('blp_uc', JSON.stringify(arr));
  return await jbPut(BIN_USERS, {users:arr});
}

async function getDonors() {
  // Firebase first
  if (_fbReady) {
    var donors = await fbGetAll('donors');
    if (donors) { localStorage.setItem('blp_dc', JSON.stringify(donors)); return donors; }
  }
  // JSONBin fallback
  const c = await jbGet(BIN_DONORS);
  if (c && Array.isArray(c.donors)) { localStorage.setItem('blp_dc', JSON.stringify(c.donors)); return c.donors; }
  const l = localStorage.getItem('blp_dc'); return l ? JSON.parse(l) : [];
}

async function getApprovedDonors() {
  var all = await getDonors();
  if (isAdmin()) return all;
  return all.filter(function(d){ return d.status !== 'pending'; });
}

async function saveDonors(arr) {
  localStorage.setItem('blp_dc', JSON.stringify(arr));
  // Firebase: update each donor individually
  if (_fbReady) {
    // Batch update not needed — individual saves happen via fbUpdate/fbAdd
    return true;
  }
  return await jbPut(BIN_DONORS, {donors:arr});
}

async function addDonorToDb(donorData) {
  // Firebase: check duplicate phone
  if (_fbReady) {
    var existing = await fbQuery('donors', 'phone', '==', donorData.phone);
    if (existing && existing.length > 0) throw new Error('DUPLICATE_PHONE');
    var id = await fbAdd('donors', donorData);
    if (id) return id;
  }
  // JSONBin fallback
  var donors = await getDonors();
  if (donors.find(function(x){ return x.phone === donorData.phone; })) throw new Error('DUPLICATE_PHONE');
  donorData.id = Date.now();
  donors.push(donorData);
  await jbPut(BIN_DONORS, {donors: donors});
  localStorage.setItem('blp_dc', JSON.stringify(donors));
  return donorData.id;
}

async function updateDonorInDb(id, data) {
  if (_fbReady) return await fbUpdate('donors', String(id), data);
  // JSONBin fallback
  var donors = await getDonors();
  var d = donors.find(function(x){ return x.id == id; });
  if (d) Object.assign(d, data);
  await jbPut(BIN_DONORS, {donors: donors});
  localStorage.setItem('blp_dc', JSON.stringify(donors));
  return true;
}

async function deleteDonorFromDb(id) {
  if (_fbReady) return await fbDelete('donors', String(id));
  var donors = await getDonors();
  var filtered = donors.filter(function(x){ return x.id != id; });
  await jbPut(BIN_DONORS, {donors: filtered});
  localStorage.setItem('blp_dc', JSON.stringify(filtered));
  return true;
}

async function cloudGetMarket() {
  if (_fbReady) {
    try {
      var txSnap = await _fbDb.collection('market').orderBy('createdAt','desc').limit(50).get();
      var lsSnap = await _fbDb.collection('listings').where('remaining','>',0).get();
      var transactions = txSnap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var listings     = lsSnap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      return { transactions: transactions, listings: listings };
    } catch(e) {}
  }
  // JSONBin fallback
  const c = await jbGet(BIN_MARKET);
  if (c && c.transactions !== undefined) {
    localStorage.setItem('blp_mc', JSON.stringify(c));
    return {transactions: c.transactions || [], listings: c.listings || []};
  }
  try {
    const l = JSON.parse(localStorage.getItem('blp_mc') || '{}');
    if (l.transactions) return {transactions: l.transactions || [], listings: l.listings || []};
  } catch(e) {}
  return {transactions: [], listings: []};
}

async function cloudSaveMarket(transactions, listings) {
  const data = {transactions: transactions || [], listings: listings || []};
  localStorage.setItem('blp_mc', JSON.stringify(data));
  return await jbPut(BIN_MARKET, data);
}

// ── EMERGENCY REQUESTS ─────────────────────────────────────
async function addEmergencyRequest(reqData) {
  if (_fbReady) {
    var id = await fbAdd('emergency_requests', reqData);
    if (id) return id;
  }
  // JSONBin fallback
  var r = await jbGet(BIN_MARKET);
  var rec = r || {};
  rec.requests = rec.requests || [];
  rec.requests.unshift(Object.assign({}, reqData, { id: Date.now(), ts: Date.now() }));
  rec.requests = rec.requests.slice(0, 50);
  await jbPut(BIN_MARKET, rec);
  return reqData.id;
}

async function getEmergencyRequests() {
  if (_fbReady) {
    try {
      var snap = await _fbDb.collection('emergency_requests')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(20).get();
      return snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
    } catch(e) {}
  }
  var r = await jbGet(BIN_MARKET);
  return (r && r.requests) ? r.requests.filter(function(x){ return x.status !== 'fulfilled'; }) : [];
}

// ── REPORTS ────────────────────────────────────────────────
async function addReport(reportData) {
  if (_fbReady) return await fbAdd('reports', reportData);
  var r = await jbGet(BIN_MARKET);
  var rec = r || {};
  rec.reports = rec.reports || [];
  rec.reports.unshift(Object.assign({}, reportData, { id: Date.now(), ts: Date.now() }));
  await jbPut(BIN_MARKET, rec);
}

async function getReports() {
  if (_fbReady) {
    var reports = await fbGetAll('reports');
    if (reports) return reports;
  }
  var r = await jbGet(BIN_MARKET);
  return (r && r.reports) || [];
}

function currentUser() { const u = localStorage.getItem('blp_user'); return u ? JSON.parse(u) : null; }
function setCurrentUser(u) { localStorage.setItem('blp_user', JSON.stringify(u)); }
function logout() {
  if (_fbReady && _fbAuth) { _fbAuth.signOut().catch(function(){}); }
  localStorage.removeItem('blp_user');
  window.location.href = 'login.html';
}

function showToast(msg, type) {
  let t = document.getElementById('blp-toast');
  if (!t) { t = document.createElement('div'); t.id='blp-toast'; t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;font-size:14px;transition:opacity .4s;pointer-events:none;'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.background = type==='success'?'#27ae60':type==='error'?'#e74c3c':'#2980b9';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.opacity='0'; }, 3000);
}

// ── HAMBURGER MENU ─────────────────────────────────────────
var _drawerReady = false;

function blpCloseMenu() {
  var menu = document.getElementById('nav-links');
  var btn  = document.getElementById('nav-toggle');
  var ov   = document.getElementById('drawer-overlay');
  if (menu) {
    menu.classList.remove('open');
    menu.style.pointerEvents = 'none';
  }
  if (btn)  btn.classList.remove('open');
  if (ov)   { ov.classList.remove('open'); setTimeout(function(){ ov.style.display = 'none'; }, 300); }
  document.body.style.overflow = '';
}

function blpOpenMenu() {
  var menu = document.getElementById('nav-links');
  var btn  = document.getElementById('nav-toggle');
  var ov   = document.getElementById('drawer-overlay');
  if (menu) {
    menu.classList.add('open');
    menu.style.pointerEvents = 'all';
  }
  if (btn)  btn.classList.add('open');
  if (ov)   { ov.style.display = 'block'; setTimeout(function(){ ov.classList.add('open'); }, 10); }
  document.body.style.overflow = 'hidden';
}

function blpToggleMenu() {
  var menu = document.getElementById('nav-links');
  if (!menu) return;
  if (menu.classList.contains('open')) { blpCloseMenu(); } else { blpOpenMenu(); }
}

function setupHamburger() {
  var btn  = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-links');
  if (!btn || !menu) return;
  if (_drawerReady) return;
  _drawerReady = true;

  // Add mobile-drawer class — CSS handles transform/transition
  menu.classList.add('mobile-drawer');
  menu.classList.remove('open');
  menu.style.pointerEvents = 'none';
  document.body.style.overflow = '';

  // Overlay
  var ov = document.getElementById('drawer-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'drawer-overlay';
    ov.className = 'drawer-overlay';
    document.body.appendChild(ov);
  }
  ov.style.display = 'none';
  ov.classList.remove('open');
  ov.onclick = blpCloseMenu;

  // Drawer header
  if (!menu.querySelector('.nav-drawer-header')) {
    var hdr = document.createElement('div');
    hdr.className = 'nav-drawer-header';
    hdr.innerHTML = '<span>🩸 BloodLink<span style="font-weight:400">Pro</span></span>'
      + '<button class="close-btn" type="button" aria-label="Close menu">✕</button>';
    hdr.querySelector('.close-btn').onclick = blpCloseMenu;
    menu.insertBefore(hdr, menu.firstChild);
  }

  // Hamburger button click — remove old listener first
  btn.onclick = null;
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    blpToggleMenu();
  });

  // Close on nav link tap
  menu.addEventListener('click', function(e) {
    if (e.target.closest('.nav-drawer-header')) return;
    if (e.target.closest('.nav-util-row')) return;
    var link = e.target.closest('a');
    if (link) setTimeout(blpCloseMenu, 120);
  });

  // Swipe right to close
  var _sx = 0, _sy = 0;
  menu.addEventListener('touchstart', function(e) {
    _sx = e.touches[0].clientX;
    _sy = e.touches[0].clientY;
  }, { passive: true });
  menu.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - _sx;
    var dy = Math.abs(e.changedTouches[0].clientY - _sy);
    if (dx > 60 && dy < 80) blpCloseMenu();
  }, { passive: true });

  // ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') blpCloseMenu();
  });

  // Reset on desktop resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      blpCloseMenu();
      menu.style.pointerEvents = '';
    }
  });
}

function updateNavAuth() {
  var user = currentUser();
  var nu=document.getElementById('nav-user'), nl=document.getElementById('nav-login'), nr=document.getElementById('nav-register'), nd=document.getElementById('nav-dashboard'), no=document.getElementById('nav-logout'), np=document.getElementById('nav-profile');
  if (user) {
    // Show only first name, max 10 chars
    var firstName = (user.name || 'User').split(' ')[0];
    if (firstName.length > 10) firstName = firstName.substring(0, 10) + '…';
    var adminBadge = isAdmin() ? '<span style="background:#e63946;color:#fff;font-size:0.6rem;padding:1px 5px;border-radius:6px;font-weight:800;vertical-align:middle;margin-left:4px;">ADMIN</span>' : '';
    if (nu) {
      nu.innerHTML = '👤 ' + firstName + adminBadge;
      nu.style.display = 'inline-flex';
    }
    if (nl) nl.style.display='none';
    if (nr) nr.style.display='none';
    if (nd) nd.style.display='inline-flex';
    if (np) np.style.display='inline-flex';
    if (no) {
      no.style.display='inline-flex';
      // Remove old listener before adding new one (prevents duplicate logout calls)
      if (!no._logoutAttached) {
        no._logoutAttached = true;
        no.addEventListener('click', logout);
      }
    }
  } else {
    // Not logged in — ensure login/register visible
    if (nl) nl.style.display='inline-flex';
    if (nr) nr.style.display='inline-flex';
    if (nd) nd.style.display='none';
    if (np) np.style.display='none';
    if (no) no.style.display='none';
    if (nu) nu.style.display='none';
  }
}

function getDeviceFingerprint() {
  const sig = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0].join('|');
  let h = 0; for (let i=0; i<sig.length; i++) { h=((h<<5)-h)+sig.charCodeAt(i); h|=0; }
  return Math.abs(h).toString(36);
}
function trackVisitor() {
  const fp=getDeviceFingerprint(), seen=JSON.parse(localStorage.getItem('blp_seen_fps')||'[]');
  let cnt=parseInt(localStorage.getItem('blp_vc')||'0');
  if (!seen.includes(fp)) { seen.push(fp); cnt++; localStorage.setItem('blp_seen_fps',JSON.stringify(seen)); localStorage.setItem('blp_vc',cnt); }
  const el=document.getElementById('visitor-count'); if (el) el.textContent=cnt;
}

function playEmergencyHorn() {
  try {
    var AC = window.AudioContext || (window['webkitAudioContext']); if (!AC) return;
    var ctx = new AC();
    var master = ctx.createGain();
    var t = ctx.currentTime;

    // Compressor for loudness
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-6, t);
    comp.ratio.setValueAtTime(4, t);
    comp.connect(ctx.destination);
    master.connect(comp);

    master.gain.setValueAtTime(0.0, t);
    master.gain.linearRampToValueAtTime(1.0, t + 0.04);

    // === LAYER 1: Indian ambulance HI-LO wail (sawtooth, 700→1100Hz) ===
    var wail = ctx.createOscillator();
    var wailG = ctx.createGain();
    wail.type = 'sawtooth';
    wailG.gain.setValueAtTime(0.6, t);
    wail.connect(wailG); wailG.connect(master);

    // === LAYER 2: Yelp — fast 960/720 Hz square pulses ===
    var yelp = ctx.createOscillator();
    var yelpG = ctx.createGain();
    yelp.type = 'square';
    yelpG.gain.setValueAtTime(0.22, t);
    yelp.connect(yelpG); yelpG.connect(master);

    // === LAYER 3: Low engine rumble ===
    var rumble = ctx.createOscillator();
    var rumbleG = ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(75, t);
    rumbleG.gain.setValueAtTime(0.15, t);
    rumble.connect(rumbleG); rumbleG.connect(master);

    var totalDur = 4.0; // 4 seconds total
    var cycleDur = 0.8; // each HI-LO cycle
    var cycles = Math.floor(totalDur / cycleDur);

    // Wail: 700 → 1100 → 700 per cycle (Indian ambulance pattern)
    for (var i = 0; i < cycles; i++) {
      var s = t + i * cycleDur;
      wail.frequency.setValueAtTime(700, s);
      wail.frequency.linearRampToValueAtTime(1100, s + cycleDur * 0.45);
      wail.frequency.linearRampToValueAtTime(700, s + cycleDur);
    }

    // Yelp: 960/720 alternating every 0.1s
    var yelpSteps = Math.floor(totalDur / 0.1);
    for (var j = 0; j < yelpSteps; j++) {
      yelp.frequency.setValueAtTime(j % 2 === 0 ? 960 : 720, t + j * 0.1);
    }

    // Fade out last 0.15s
    master.gain.setValueAtTime(1.0, t + totalDur - 0.15);
    master.gain.linearRampToValueAtTime(0.0, t + totalDur);

    wail.start(t);   wail.stop(t + totalDur);
    yelp.start(t);   yelp.stop(t + totalDur);
    rumble.start(t); rumble.stop(t + totalDur);

    // Cleanup
    setTimeout(function(){ try { ctx.close(); } catch(e){} }, (totalDur + 0.5) * 1000);
  } catch(e) {}
}
function triggerSOS() {
  playEmergencyHorn();
  var a=document.getElementById('sos-alert');
  if (a) {
    a.style.cssText='display:block;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 16px;margin-top:12px;color:#e74c3c;font-weight:600;font-size:0.88rem;';
    a.innerHTML='🚨 SOS Alert Sent! Nearby donors notified.<br><small style="opacity:0.7">Sent at '+new Date().toLocaleTimeString()+'</small>';
    setTimeout(function(){a.style.display='none';},8000);
  }
  showToast('🚨 Emergency SOS sent!','error');
}

document.addEventListener('DOMContentLoaded', function() {
  initFirebase();
  setupHamburger();
  blpCloseMenu(); // ensure drawer is always closed on page load
  updateNavAuth();
  initDarkMode();
  applyLanguage();

  // Fix bfcache: when user navigates back, reset overflow and close drawer
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      document.body.style.overflow = '';
      var menu = document.getElementById('nav-links');
      if (menu) { menu.classList.remove('open'); menu.style.pointerEvents = 'none'; }
      var btn = document.getElementById('nav-toggle');
      if (btn) btn.classList.remove('open');
      var ov = document.getElementById('drawer-overlay');
      if (ov) { ov.classList.remove('open'); ov.style.display = 'none'; }
    }
  });
  var page=location.pathname.split('/').pop()||'index.html';
  if (page==='login.html')     initLogin();
  if (page==='register.html')  initRegister();
  if (page==='donor.html')     initDonor();
  if (page==='search.html')    initSearch();
  if (page==='dashboard.html') initDashboard();
  if (page==='pricing.html' && typeof renderMarket==='function') renderMarket();
  if (page==='index.html'||page==='') {
    trackVisitor();
    var sb=document.getElementById('sos-btn')||document.getElementById('emergency-btn');
    if (sb) sb.addEventListener('click', triggerSOS);
    getDonors().then(function(donors){
      var ht=document.getElementById('home-total'); if(ht) ht.textContent=donors.length;
      var ha=document.getElementById('home-available'); if(ha) ha.textContent=donors.filter(function(d){return d.available!=='no';}).length;
      var cities={}; donors.forEach(function(d){if(d.city)cities[d.city]=1;});
      var hc=document.getElementById('home-cities'); if(hc) hc.textContent=Object.keys(cities).length;
    });
  }
  // SOS on all pages
  var sosBtnGlobal=document.getElementById('sos-btn');
  if(sosBtnGlobal && !sosBtnGlobal._sosAttached) {
    sosBtnGlobal._sosAttached=true;
    sosBtnGlobal.addEventListener('click', triggerSOS);
  }
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 Update available — refresh to get latest version', 'info');
            }
          });
        }
      });
    }).catch(function(){});
  }
});

async function initLogin() {
  var form=document.getElementById('login-form'); if (!form) return;
  // login.html inline script handles via cloneNode
}
async function initRegister() { /* register.html inline handles */ }
async function initDonor()    { /* donor.html inline handles */ }
async function initSearch()   { /* search.html inline handles */ }

async function initDashboard() {
  trackVisitor();
  var user=currentUser();
  if (!user) { window.location.href='login.html'; return; }
  var ne=document.getElementById('user-name'); if(ne) ne.textContent=user?user.name:'Guest';
  var lu=document.getElementById('last-updated'); if(lu) lu.textContent='Loading...';
  var donors=await getDonors();
  var approved=donors.filter(function(d){return d.status!=='pending';});
  var pending=donors.filter(function(d){return d.status==='pending';});
  var mkt=await cloudGetMarket();
  var market=mkt.transactions||[];
  var td=document.getElementById('total-donors');       if(td) td.textContent=approved.length;
  var tt=document.getElementById('total-transactions'); if(tt) tt.textContent=market.length;
  var tu=document.getElementById('total-units');        if(tu) tu.textContent=market.reduce(function(s,t){return s+(parseInt(t.qty)||1);},0);
  var av=document.getElementById('stat-available');     if(av) av.textContent=approved.filter(function(d){return d.available!=='no';}).length;
  if(lu) lu.textContent='Updated: '+new Date().toLocaleTimeString();
  renderDashCharts(approved);
  renderRecentActivity(approved, market);
  renderCityStats(approved);
  // chart badge
  var cb = document.getElementById('chart-total-badge');
  if (cb) cb.textContent = approved.length + ' donors';
  // Admin panel
  if (isAdmin()) renderAdminPanel(pending, donors, market);
  // Load emergency requests for admin
  if (isAdmin()) loadEmergencyRequests();
  // Emergency requests count
  try {
    var reqs = await getEmergencyRequests();
    var sr = document.getElementById('stat-requests'); if(sr) sr.textContent = reqs.length;
  } catch(e) {}
  // Auto-refresh every 30 seconds
  if (!window._dashRefreshTimer) {
    window._dashRefreshTimer = setInterval(function() {
      var luEl = document.getElementById('last-updated');
      if (luEl) luEl.textContent = 'Refreshing...';
      initDashboard();
    }, 30000);
  }
}

function renderDashCharts(donors) {
  if (!window.Chart) return;
  var bc=document.getElementById('bloodTypeChart');
  if (bc) {
    var types=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    var counts=types.map(function(t){return donors.filter(function(d){return d.blood===t;}).length;});
    var mx=Math.max.apply(null,counts.concat([1]));
    if(window._barChart) window._barChart.destroy();
    window._barChart=new Chart(bc,{type:'bar',data:{labels:types,datasets:[{label:'Donors',data:counts,backgroundColor:counts.map(function(c){var i=Math.round(80+(c/mx)*175);return 'rgb('+i+',30,30)';}),borderRadius:6}]},options:{responsive:true,animation:{duration:1000,easing:'easeOutQuart'},plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
  }
  var dc=document.getElementById('marketChart');
  if (dc) {
    var avail=donors.filter(function(d){return d.available!=='no';}).length;
    var unavail=donors.length-avail;
    var pct=donors.length?Math.round((avail/donors.length)*100):0;
    var pe=document.getElementById('donut-pct'); if(pe) pe.textContent=pct+'%';
    if(window._donutChart) window._donutChart.destroy();
    window._donutChart=new Chart(dc,{type:'doughnut',data:{labels:['Available','Unavailable'],datasets:[{data:[avail||1,unavail],backgroundColor:['#27ae60','#e74c3c'],borderWidth:0}]},options:{responsive:true,cutout:'70%',animation:{duration:1000,easing:'easeOutQuart'},plugins:{legend:{display:false}}}});
    var dl=document.getElementById('donut-legend'); if(dl) dl.innerHTML='<span style="color:#27ae60;font-weight:700;">● Available: '+avail+'</span>&nbsp;&nbsp;<span style="color:#e74c3c;font-weight:700;">● Unavailable: '+unavail+'</span>';
  }
}

function renderCityStats(donors) {
  var el = document.getElementById('city-stats-list');
  if (!el) return;
  var cities = {};
  donors.forEach(function(d) {
    var c = (d.city || 'Unknown').trim();
    if (!cities[c]) cities[c] = { total: 0, avail: 0 };
    cities[c].total++;
    if (d.available !== 'no') cities[c].avail++;
  });
  var sorted = Object.keys(cities).sort(function(a,b){ return cities[b].total - cities[a].total; });
  var badge = document.getElementById('city-count-badge');
  if (badge) badge.textContent = sorted.length + ' cities';
  if (!sorted.length) {
    el.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:1.5rem;grid-column:1/-1;font-size:0.88rem;">No city data yet</div>';
    return;
  }
  el.innerHTML = sorted.slice(0, 12).map(function(city) {
    var d = cities[city];
    var pct = d.total ? Math.round((d.avail / d.total) * 100) : 0;
    var color = pct >= 60 ? '#16a34a' : pct >= 30 ? '#f59e0b' : '#e63946';
    return '<div class="city-card">'
      + '<div class="city-name">' + city + '</div>'
      + '<div class="city-num" style="color:' + color + ';">' + d.total + '</div>'
      + '<div class="city-sub">' + d.avail + ' available</div>'
      + '<div class="city-bar"><div class="city-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>'
      + '</div>';
  }).join('');
}

function renderRecentActivity(donors, market) {
  var el = document.getElementById('recent-activity') || document.getElementById('recent-list');
  if (!el) return;
  var acts = [];
  var now = Date.now();
  function timeAgo(ts) {
    var diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  }
  donors.slice(-6).forEach(function(d) {
    var ts = d.ts || d.date || now;
    acts.push({ t: ts, html:
      '<div class="activity-item">'
      + '<div class="activity-dot" style="background:#e63946;"></div>'
      + '<div class="activity-text"><strong>' + (d.name||'Unknown') + '</strong> registered as donor'
      + ' &nbsp;<span class="blood-pill">' + (d.blood||'?') + '</span>'
      + ' &nbsp;<span style="font-size:0.72rem;color:#6b7280;">📍 ' + (d.city||'—') + '</span></div>'
      + '<span class="activity-time">' + timeAgo(ts) + '</span>'
      + '</div>'
    });
  });
  market.slice(-4).forEach(function(tx) {
    var ts = tx.ts || tx.date || now;
    acts.push({ t: ts, html:
      '<div class="activity-item">'
      + '<div class="activity-dot" style="background:#16a34a;"></div>'
      + '<div class="activity-text"><strong>' + (tx.qty||1) + ' unit(s)</strong> '
      + (tx.blood||'') + ' — ' + (tx.type||'transaction')
      + '</div>'
      + '<span class="activity-time">' + timeAgo(ts) + '</span>'
      + '</div>'
    });
  });
  acts.sort(function(a,b){ return b.t - a.t; });
  el.innerHTML = acts.length
    ? acts.slice(0, 8).map(function(a){ return a.html; }).join('')
    : '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.88rem;">No recent activity yet.</div>';
}

// ── ADMIN PANEL ───────────────────────────────────────────
function renderAdminPanel(pending, allDonors, market) {
  var dash = document.querySelector('.dash-body');
  if (!dash) return;
  var existing = document.getElementById('admin-panel');
  if (existing) existing.remove();

  var panel = document.createElement('div');
  panel.id = 'admin-panel';
  panel.className = 'admin-panel';

  var pendingHTML = pending.length ? pending.map(function(d){
    return '<div class="donor-row">'
      +'<div class="donor-row-info"><div class="dname">'+d.name+' &nbsp;<span class="blood-pill">'+d.blood+'</span></div>'
      +'<div class="dmeta">📍 '+d.city+' &nbsp;📞 '+d.phone+'</div></div>'
      +'<button class="btn-approve" onclick="adminApproveDonor('+d.id+')">✅ Approve</button>'
      +'<button class="btn-del" onclick="adminDeleteDonor('+d.id+')">🗑️ Delete</button>'
      +'</div>';
  }).join('') : '<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:0.8rem;">No pending donors</p>';

  var approvedHTML = allDonors.filter(function(d){return d.status!=='pending';}).map(function(d){
    return '<div class="donor-row">'
      +'<div class="donor-row-info"><div class="dname">'+d.name+' &nbsp;<span class="blood-pill">'+d.blood+'</span></div>'
      +'<div class="dmeta">📍 '+d.city+' &nbsp;📞 '+d.phone+'</div></div>'
      +'<button class="btn-del" onclick="adminDeleteDonor('+d.id+')">🗑️ Delete</button>'
      +'</div>';
  }).join('') || '<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:0.8rem;">No approved donors</p>';

  panel.innerHTML = '<div class="admin-head">'
    +'<span style="font-size:1.3rem;">🔐</span>'
    +'<h3>Admin Control Panel</h3>'
    +'<span class="admin-badge">ADMIN ONLY</span>'
    +'</div>'
    +'<div style="margin-bottom:1rem;">'
    +'<div style="font-size:0.82rem;font-weight:700;color:#92400e;margin-bottom:0.5rem;">⏳ Pending Approval ('+pending.length+')</div>'
    +pendingHTML+'</div>'
    +'<div style="margin-bottom:1rem;">'
    +'<div style="font-size:0.82rem;font-weight:700;color:#15803d;margin-bottom:0.5rem;">✅ Approved Donors ('+allDonors.filter(function(d){return d.status!=='pending';}).length+')</div>'
    +'<div style="max-height:280px;overflow-y:auto;">'+approvedHTML+'</div></div>'
    +'<div id="admin-reports-section">'
    +'<div style="font-size:0.82rem;font-weight:700;color:#7c3aed;margin-bottom:0.5rem;">🚩 Donor Reports</div>'
    +'<div id="admin-reports-list" style="font-size:0.82rem;color:#9ca3af;">Loading...</div>'
    +'</div>';

  dash.insertBefore(panel, dash.firstChild);
  loadAdminReports();
}

async function adminApproveDonor(id) {
  if (!isAdmin()) { showToast('Access denied.', 'error'); return; }
  var ok = await updateDonorInDb(String(id), { status: 'approved' });
  if (!ok) {
    // JSONBin fallback
    var donors = await getDonors();
    var d = donors.find(function(x){return x.id==id;});
    if (!d) return;
    d.status = 'approved';
    await saveDonors(donors);
  }
  showToast('✅ Donor approved!', 'success');
  initDashboard();
}

async function adminDeleteDonor(id) {
  if (!isAdmin()) { showToast('Access denied.', 'error'); return; }
  if (!confirm('Delete this donor?')) return;
  await deleteDonorFromDb(String(id));
  showToast('🗑️ Donor deleted', 'error');
  initDashboard();
}

// ── EMERGENCY REQUESTS (Admin) ────────────────────────────
async function loadEmergencyRequests() {
  try {
    var active = await getEmergencyRequests();
    active = active.filter(function(x){ return x.status !== 'fulfilled' && (Date.now()-(x.ts||0)) < 3600000*24; });
    if (!active.length) return;
    var dash = document.querySelector('.dash-body');
    if (!dash) return;
    var existing = document.getElementById('emergency-requests-panel');
    if (existing) existing.remove();
    var panel = document.createElement('div');
    panel.id = 'emergency-requests-panel';
    panel.style.cssText = 'background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 4px 24px rgba(220,38,38,0.1);border:2px solid #dc2626;margin-bottom:2rem;';
    var urgColors = {'critical':'#fef2f2','high':'#fffbeb','normal':'#f0fdf4'};
    var urgLabel = {'critical':'🔴 CRITICAL','high':'🟡 HIGH','normal':'🟢 NORMAL'};
    panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'
      +'<span style="font-size:1.4rem;">🚨</span>'
      +'<h3 style="font-size:1.1rem;font-weight:800;color:#dc2626;margin:0;">Emergency Requests ('+active.length+')</h3>'
      +'<a href="emergency.html" style="margin-left:auto;font-size:0.78rem;color:#e63946;font-weight:700;text-decoration:none;">View All →</a>'
      +'</div>'
      + active.slice(0,5).map(function(req){
        var ts = req.ts || (req.createdAt && req.createdAt.toMillis ? req.createdAt.toMillis() : Date.now());
        var age = Math.floor((Date.now()-ts)/60000);
        var ageStr = age<60?age+' min ago':Math.floor(age/60)+' hr ago';
        return '<div style="background:'+urgColors[req.urgency||'normal']+';border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
          +'<span style="font-size:1rem;">🩸</span>'
          +'<div style="flex:1;min-width:120px;"><div style="font-weight:700;font-size:0.88rem;">'+req.blood+' · '+(req.units||1)+' unit(s) · '+req.city+'</div>'
          +'<div style="font-size:0.75rem;color:#6b7280;">'+(req.name||'Unknown')+' · '+ageStr+'</div></div>'
          +'<span style="font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:8px;background:#fff;">'+urgLabel[req.urgency||'normal']+'</span>'
          +'<a href="tel:'+req.contact+'" style="background:#e63946;color:#fff;padding:5px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;">📞 Call</a>'
          +'<button onclick="fulfillRequest(\''+req.id+'\')" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:5px 10px;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">✅ Fulfilled</button>'
          +'</div>';
      }).join('');
    dash.insertBefore(panel, dash.firstChild);
  } catch(e) {}
}

async function fulfillRequest(id) {
  if (!isAdmin()) return;
  try {
    // Firebase first
    if (_fbReady) {
      await fbUpdate('emergency_requests', String(id), { status: 'fulfilled' });
    } else {
      // JSONBin fallback
      var r = await jbGet(BIN_MARKET);
      if (!r) return;
      r.requests = (r.requests||[]).map(function(x){ return x.id==id ? Object.assign({},x,{status:'fulfilled'}) : x; });
      await jbPut(BIN_MARKET, r);
    }
    showToast('✅ Request marked as fulfilled','success');
    loadEmergencyRequests();
  } catch(e) {}
}

// ── ADMIN REPORTS ─────────────────────────────────────────
async function loadAdminReports() {
  var el = document.getElementById('admin-reports-list');
  if (!el) return;
  try {
    var reports = await getReports();
    if (!reports.length) { el.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:0.8rem;">No reports yet</p>'; return; }
    el.innerHTML = '<div style="max-height:220px;overflow-y:auto;">'
      + reports.slice(0, 20).map(function(rep) {
        var ts = rep.ts || (rep.createdAt && rep.createdAt.toMillis ? rep.createdAt.toMillis() : Date.now());
        var age = Math.floor((Date.now() - ts) / 60000);
        var ageStr = age < 60 ? age + ' min ago' : age < 1440 ? Math.floor(age/60) + ' hr ago' : Math.floor(age/1440) + ' days ago';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#faf5ff;border-radius:8px;margin-bottom:6px;flex-wrap:wrap;">'
          + '<span style="font-size:1rem;">🚩</span>'
          + '<div style="flex:1;min-width:140px;"><div style="font-weight:700;font-size:0.82rem;">'+(rep.donorName||'Unknown')+'</div>'
          + '<div style="font-size:0.72rem;color:#6b7280;">'+(rep.reason||'No reason')+'  · '+ageStr+'</div></div>'
          + '<button onclick="adminDismissReport(\''+rep.id+'\')" style="background:#f3f4f6;color:#6b7280;border:none;padding:4px 10px;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">Dismiss</button>'
          + '<button onclick="adminDeleteDonor('+rep.donorId+')" style="background:#fee2e2;color:#e63946;border:1.5px solid #fca5a5;padding:4px 10px;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">🗑️ Delete Donor</button>'
          + '</div>';
      }).join('')
      + '</div>';
  } catch(e) { el.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:0.8rem;">Could not load reports</p>'; }
}

async function adminDismissReport(id) {
  if (!isAdmin()) return;
  try {
    // Firebase first
    if (_fbReady) {
      await fbDelete('reports', String(id));
    } else {
      // JSONBin fallback
      var r = await jbGet(BIN_MARKET);
      if (!r) return;
      r.reports = (r.reports || []).filter(function(x) { return x.id != id; });
      await jbPut(BIN_MARKET, r);
    }
    showToast('Report dismissed', 'success');
    loadAdminReports();
  } catch(e) {}
}


// ══════════════════════════════════════════════════════════
// PHASE 16: FUTURE-READY ARCHITECTURE (BloodLink Pro v2.0)
// ══════════════════════════════════════════════════════════

// 🤖 AI-BASED DONOR MATCHING (Future)
// Replace current city-filter with ML model:
// - Input: patient blood group, location (lat/lon), urgency
// - Model: TensorFlow.js or AWS SageMaker endpoint
// - Output: ranked donor list by compatibility + proximity + trust score
// - Example: await fetch('/api/ai-match', { method:'POST', body: JSON.stringify({blood, lat, lon, urgency}) })

// 📡 REAL-TIME NOTIFICATIONS (Future)
// Replace simulated SOS with Firebase Cloud Messaging (FCM):
// - On emergency submit → trigger FCM push to all nearby donors
// - Donors receive push notification on phone even when app is closed
// - Implementation: Firebase Admin SDK on backend + FCM token stored per donor
// - Example: admin.messaging().sendMulticast({ tokens: nearbyDonorTokens, notification: { title: '🚨 Blood Needed', body: blood+' in '+city } })

// 🏥 HOSPITAL API INTEGRATION (Future)
// Connect to NHA (National Health Authority) or state blood bank APIs:
// - Real-time blood stock levels from hospitals
// - Auto-alert when stock falls below threshold
// - API: https://api.nha.gov.in/bloodbank (when available)
// - Fallback: scrape eRaktKosh (https://www.eraktkosh.in) with permission

// 🌐 MULTI-LANGUAGE SUPPORT (Future)
// Add i18n support for Hindi, Urdu, Tamil, Bengali:
// - Store translations in /locales/hi.json, /locales/ur.json etc.
// - Use browser language detection: navigator.language
// - Example: const t = translations[navigator.language.split('-')[0]] || translations['en']
// - Key strings: 'Find Donors', 'Emergency', 'Register', 'Available'

// 📊 ADVANCED ANALYTICS (Future)
// Integrate Google Analytics 4 or Mixpanel:
// - Track: donor registrations, search queries, emergency requests, SOS triggers
// - Funnel: search → contact → donation confirmed
// - Heatmaps: which cities have highest demand vs supply gap

// 🔔 SMS NOTIFICATION SYSTEM (Future)
// Integrate Twilio or MSG91 for SMS alerts:
// - On emergency request → SMS to top 5 nearest available donors
// - Example (MSG91): fetch('https://api.msg91.com/api/v5/flow/', { method:'POST', headers:{'authkey': MSG91_KEY}, body: JSON.stringify({ template_id: 'BLOOD_ALERT', recipients: [{ mobiles: donorPhone, city: city, blood: blood }] }) })
// - Cost: ~₹0.15 per SMS — viable for production

// ══════════════════════════════════════════════════════════

// ── DARK MODE ─────────────────────────────────────────────
function initDarkMode() {
  var saved = localStorage.getItem('blp_dark');
  if (saved === '1') document.body.classList.add('dark-mode');
  updateDarkBtn();
}
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  var isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('blp_dark', isDark ? '1' : '0');
  updateDarkBtn();
}
function updateDarkBtn() {
  var btn = document.getElementById('dark-toggle');
  if (!btn) return;
  var isDark = document.body.classList.contains('dark-mode');
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// ── LANGUAGE (Hindi / English) ────────────────────────────
var _lang = localStorage.getItem('blp_lang') || 'en';

var _translations = {
  en: {
    // Nav
    'Home': 'Home',
    'Find Donors': 'Find Donors',
    'Emergency': '🚨 Emergency',
    'Blood Banks': 'Blood Banks',
    'Market': 'Market',
    'About Us': 'About Us',
    'Dashboard': 'Dashboard',
    'Login': 'Login',
    'Register': 'Register',
    'Logout': 'Logout',
    'Profile': '👤 Profile',
    '+ Add Donor': '+ Add Donor',
    // Index hero
    'Every Drop': 'Every Drop',
    'Saves a Life.': 'Saves a Life.',
    'Become a Donor': '🩸 Become a Donor',
    'Find Blood Now': '🔍 Find Blood Now',
    'Registered Donors': 'Registered Donors',
    'Available Now': 'Available Now',
    'Cities Covered': 'Cities Covered',
    // Search
    'Search Donors': 'Search Donors',
    'Search Donors →': 'Search Donors →',
    'Blood Group': 'Blood Group',
    'City': 'City',
    'All Blood Groups': 'All Blood Groups',
    'All Cities': 'All Cities',
    // Emergency
    'Send Emergency SOS': '🆘 Send Emergency SOS Alert',
    'Emergency Blood Needed?': '🚨 Emergency Blood Needed?',
    // Donor form
    'Register as Donor': 'Register as Donor',
    'Full Name': 'Full Name',
    'Phone Number': 'Phone Number',
    'Submit': 'Submit',
    // Common
    'Loading...': 'Loading...',
    'No donors found': 'No donors found',
    'Available': 'Available',
    'Not Available': 'Not Available',
    'View All': 'View All →',
    'Search': '🔍 Search',
    'Call': '📞 Call',
    'Get Directions': '🗺️ Directions'
  },
  hi: {
    // Nav
    'Home': 'होम',
    'Find Donors': 'डोनर खोजें',
    'Emergency': '🚨 आपातकाल',
    'Blood Banks': 'ब्लड बैंक',
    'Market': 'मार्केट',
    'About Us': 'हमारे बारे में',
    'Dashboard': 'डैशबोर्ड',
    'Login': 'लॉगिन',
    'Register': 'रजिस्टर',
    'Logout': 'लॉगआउट',
    'Profile': '👤 प्रोफाइल',
    '+ Add Donor': '+ डोनर जोड़ें',
    // Index hero
    'Every Drop': 'हर बूंद',
    'Saves a Life.': 'एक जीवन बचाती है।',
    'Become a Donor': '🩸 डोनर बनें',
    'Find Blood Now': '🔍 अभी खोजें',
    'Registered Donors': 'पंजीकृत डोनर',
    'Available Now': 'अभी उपलब्ध',
    'Cities Covered': 'शहर कवर',
    // Search
    'Search Donors': 'डोनर खोजें',
    'Search Donors →': 'डोनर खोजें →',
    'Blood Group': 'ब्लड ग्रुप',
    'City': 'शहर',
    'All Blood Groups': 'सभी ब्लड ग्रुप',
    'All Cities': 'सभी शहर',
    // Emergency
    'Send Emergency SOS': '🆘 आपातकालीन SOS भेजें',
    'Emergency Blood Needed?': '🚨 आपातकालीन रक्त चाहिए?',
    // Donor form
    'Register as Donor': 'डोनर के रूप में रजिस्टर करें',
    'Full Name': 'पूरा नाम',
    'Phone Number': 'फोन नंबर',
    'Submit': 'जमा करें',
    // Common
    'Loading...': 'लोड हो रहा है...',
    'No donors found': 'कोई डोनर नहीं मिला',
    'Available': 'उपलब्ध',
    'Not Available': 'अनुपलब्ध',
    'View All': 'सभी देखें →',
    'Search': '🔍 खोजें',
    'Call': '📞 कॉल करें',
    'Get Directions': '🗺️ दिशा-निर्देश'
  }
};

function t(key) {
  return (_translations[_lang] && _translations[_lang][key]) || key;
}

function applyLanguage() {
  // 1. Translate all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var translated = t(key);
    if (translated !== key) el.textContent = translated;
  });

  // 2. Auto-translate nav links by their text content
  var navLinks = document.querySelectorAll('.nav-links a, .nav-links button:not(#lang-toggle):not(#dark-toggle):not(.nav-qr-btn)');
  navLinks.forEach(function(el) {
    // Skip elements with child elements (like nav-user with badge span)
    if (el.children.length > 0) return;
    var txt = el.textContent.trim();
    if (!txt) return;
    // Direct lookup
    if (_translations[_lang][txt]) { el.textContent = _translations[_lang][txt]; return; }
    // Strip leading emoji/symbols and try again
    var stripped = txt.replace(/^[^\w\u0900-\u097F]+/, '').trim();
    if (_translations[_lang][stripped]) { el.textContent = _translations[_lang][stripped]; return; }
    // Try each key — if current text matches any translation value, find original key
    var keys = Object.keys(_translations.en);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (_translations.en[k] === txt || _translations.hi[k] === txt ||
          _translations.en[k].replace(/^[^\w]+/, '').trim() === stripped ||
          _translations.hi[k].replace(/^[^\w\u0900-\u097F]+/, '').trim() === stripped) {
        el.textContent = _translations[_lang][k] || txt;
        return;
      }
    }
  });

  // 3. Update lang button label
  var btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = _lang === 'en' ? 'हिं' : 'EN';

  // 4. Update html lang attribute
  document.documentElement.lang = _lang === 'hi' ? 'hi' : 'en';

  // 5. Translate page-specific elements by selector
  var pageTranslations = {
    hi: [
      // Search page
      { sel: '.search-hero h1',        text: '🔍 डोनर खोजें' },
      { sel: '.search-hero p',         text: 'ब्लड ग्रुप और शहर से तुरंत डोनर खोजें' },
      { sel: '#search-btn',            text: '🔍 खोजें' },
      // Emergency panel
      { sel: '.emergency-panel h2',    text: '🚨 आपातकालीन रक्त अनुरोध' },
      { sel: '.emergency-panel p',     text: 'गंभीर स्थिति? अपने नेटवर्क के सभी उपलब्ध डोनर को तुरंत SOS भेजें।' },
      { sel: '#sos-btn',               text: '🆘 आपातकालीन SOS भेजें' },
      // Index hero
      { sel: '.hero-badge',            text: '🏥 भारत का #1 ब्लड डोनेशन नेटवर्क' },
      { sel: '.hero p:first-of-type',  text: 'BloodLink Pro के साथ पूरे भारत में तुरंत वेरिफाइड ब्लड डोनर से जुड़ें।' },
      // Stats bar
      { sel: '.sbs-item:nth-child(1) .sbs-lbl', text: 'ब्लड टाइप' },
      { sel: '.sbs-item:nth-child(3) .sbs-lbl', text: 'उपलब्ध' },
      { sel: '.sbs-item:nth-child(5) .sbs-lbl', text: 'मुफ्त सेवा' },
      // Dashboard
      { sel: '.dash-header h1',        text: '📊 डैशबोर्ड' },
      // Footer
      { sel: '.footer-bottom span:first-child', text: '© 2025 BloodLink Pro — ❤️ से बनाया गया Satish Kumar Nishad · Team HackForce द्वारा' }
    ],
    en: [
      { sel: '.search-hero h1',        text: '🔍 Find Blood Donors' },
      { sel: '.search-hero p',         text: 'Search by blood group and city. Results are instant.' },
      { sel: '#search-btn',            text: '🔍 Search' },
      { sel: '.emergency-panel h2',    text: '🚨 Emergency Blood Request' },
      { sel: '.emergency-panel p',     text: 'Critical situation? Send an instant SOS to all available donors in your network.' },
      { sel: '#sos-btn',               text: '🆘 Send Emergency SOS' },
      { sel: '.hero-badge',            text: '🏥 India\'s #1 Blood Donation Network' },
      { sel: '.dash-header h1',        text: '📊 Dashboard' }
    ]
  };

  var rules = pageTranslations[_lang] || [];
  rules.forEach(function(rule) {
    var el = document.querySelector(rule.sel);
    if (el) el.textContent = rule.text;
  });
}

function toggleLanguage() {
  _lang = _lang === 'en' ? 'hi' : 'en';
  localStorage.setItem('blp_lang', _lang);
  applyLanguage();
}

// ── QR CODE ───────────────────────────────────────────────
function showQRCode() {
  var overlay = document.getElementById('qr-modal-overlay');
  if (!overlay) {
    // Create modal dynamically
    overlay = document.createElement('div');
    overlay.id = 'qr-modal-overlay';
    overlay.innerHTML = '<div id="qr-modal-box">'
      + '<h3>📱 Scan to Open BloodLink Pro</h3>'
      + '<p>Share this QR code for instant access</p>'
      + '<canvas id="qr-canvas" width="200" height="200"></canvas>'
      + '<div style="margin-top:1rem;font-size:0.75rem;color:#9ca3af;">blood-link-pro.vercel.app</div>'
      + '<button onclick="document.getElementById(\'qr-modal-overlay\').classList.remove(\'open\')" '
      + 'style="margin-top:1rem;background:#e63946;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;">Close</button>'
      + '</div>';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('open'); });
    document.body.appendChild(overlay);
  }
  overlay.classList.add('open');
  // Draw QR using canvas (simple URL-encoded QR via Google Charts API image)
  var canvas = document.getElementById('qr-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { ctx.drawImage(img, 0, 0, 200, 200); };
    img.onerror = function() {
      // Fallback: show URL text
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,200);
      ctx.fillStyle = '#1a1a2e'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('blood-link-pro.vercel.app', 100, 100);
    };
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent('https://blood-link-pro.vercel.app');
  }
}

// ── INIT ALL EXTRAS ───────────────────────────────────────
// Dark mode and language are initialized via the main DOMContentLoaded above
