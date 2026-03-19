/* ===================================================
   BloodLink Pro — Complete Core Logic (Cloud Sync)
   =================================================== */

// ── Local Storage (session + emergencies only) ────
const KEYS = { session:'blp_session', emergencies:'blp_emergencies' };
const store = {
  get:    k => JSON.parse(localStorage.getItem(k) || '[]'),
  set:    (k,v) => localStorage.setItem(k, JSON.stringify(v)),
  getObj: k => JSON.parse(localStorage.getItem(k) || 'null'),
  setObj: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: k => localStorage.removeItem(k)
};

// ── JSONBin Cloud Config ──────────────────────────
const JB_KEY     = '$2a$10$gnr12wuvoYipciglW9hglOFE5FfQ9q0yU01ZBv8dwhwaNMfUSU.NW';
const JB_USERS   = '69bc2150aa77b81da9fcb1e3';
const JB_DONORS  = '69bc22a2b7ec241ddc82de74';
const JB_MARKET  = '69bc22a2b7ec241ddc82de79';
const JB_BASE    = 'https://api.jsonbin.io/v3/b';
const JB_HEADS   = { 'Content-Type':'application/json', 'X-Master-Key': JB_KEY };

async function jbGet(binId) {
  try {
    const res = await fetch(`${JB_BASE}/${binId}/latest`, { headers: JB_HEADS });
    const data = await res.json();
    return data.record || {};
  } catch { return {}; }
}
async function jbSet(binId, data) {
  try {
    await fetch(`${JB_BASE}/${binId}`, { method:'PUT', headers:JB_HEADS, body:JSON.stringify(data) });
  } catch(e) { console.warn('Cloud save failed:', e); }
}

// ── Cloud Donors ──────────────────────────────────
async function cloudGetDonors() {
  const data = await jbGet(JB_DONORS);
  return data.donors || [];
}
async function cloudSaveDonors(donors) {
  await jbSet(JB_DONORS, { donors });
}

// ── Cloud Market ──────────────────────────────────
async function cloudGetMarket() {
  const data = await jbGet(JB_MARKET);
  return { transactions: data.transactions || [], listings: data.listings || [] };
}
async function cloudSaveMarket(transactions, listings) {
  await jbSet(JB_MARKET, { transactions, listings });
}

// ── Cloud Users / Auth ────────────────────────────
function hashPass(pass) {
  let h = 0;
  for (let i = 0; i < pass.length; i++) { h = Math.imul(31, h) + pass.charCodeAt(i) | 0; }
  return 'h_' + Math.abs(h).toString(36) + '_' + pass.length;
}
async function jbGetUsers() {
  const data = await jbGet(JB_USERS);
  return data.users || [];
}
async function jbSaveUsers(users) { await jbSet(JB_USERS, { users }); }

async function jbRegister({ name, email, password, city, role }) {
  const users = await jbGetUsers();
  if (users.find(u => u.email === email)) return { error: 'EMAIL_EXISTS' };
  const newUser = { id:'u_'+Date.now(), name, email, passHash:hashPass(password), city, role, ts:Date.now() };
  users.push(newUser);
  await jbSaveUsers(users);
  return { user: { id:newUser.id, name, email, city, role, ts:newUser.ts } };
}
async function jbSignIn(email, password) {
  const users = await jbGetUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { error: 'NOT_FOUND' };
  if (user.passHash !== hashPass(password)) return { error: 'WRONG_PASS' };
  return { user: { id:user.id, name:user.name, email:user.email, city:user.city, role:user.role, ts:user.ts } };
}

// ── Seed sample donors (cloud mein ek baar) ───────
const SEED_DONORS = [
  { id:'s1',  name:'Rahul Sharma',  blood:'O+',  city:'Kanpur',  contact:'9876543210', available:true  },
  { id:'s2',  name:'Priya Singh',   blood:'A+',  city:'Lucknow', contact:'9812345678', available:true  },
  { id:'s4',  name:'Sneha Gupta',   blood:'AB+', city:'Delhi',   contact:'9911223344', available:true  },
  { id:'s5',  name:'Vikram Yadav',  blood:'O-',  city:'Kanpur',  contact:'9955667788', available:true  },
  { id:'s6',  name:'Neha Patel',    blood:'A-',  city:'Unnao',   contact:'9933445566', available:true  },
  { id:'s8',  name:'Anjali Mishra', blood:'AB-', city:'Delhi',   contact:'9944556677', available:true  },
  { id:'s9',  name:'Suresh Tiwari', blood:'O+',  city:'Kanpur',  contact:'9900112233', available:true  },
  { id:'s10', name:'Kavita Rao',    blood:'A+',  city:'Unnao',   contact:'9866778899', available:true  },
  { id:'s11', name:'Deepak Joshi',  blood:'B+',  city:'Kanpur',  contact:'9822334455', available:true  },
];

async function initSampleDonors() {
  const existing = await cloudGetDonors();
  if (existing.length > 0) return; // already seeded
  const now = Date.now();
  const seeded = SEED_DONORS.map((d,i) => ({ ...d, ts: now - (i+1)*600000 }));
  await cloudSaveDonors(seeded);
  return seeded;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Toast ─────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  let wrap = document.getElementById('toast-container');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-container';
    wrap.className = 'toast-container';
    document.body.appendChild(wrap);
  }
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'🔔'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.cssText += 'opacity:0;transform:translateY(10px);transition:0.3s;';
    setTimeout(() => t.remove(), 320);
  }, duration);
}

// ── Auth ──────────────────────────────────────────
function getSession()   { return store.getObj(KEYS.session); }
function setSession(u)  { store.setObj(KEYS.session, u); }
function clearSession() { store.remove(KEYS.session); }
function logout() {
  clearSession();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ── Navbar ────────────────────────────────────────
function updateNav() {
  const s = getSession();
  const el = id => document.getElementById(id);
  const vis = (id, show) => { const e = el(id); if (e) e.style.display = show ? 'inline-flex' : 'none'; };
  if (s) {
    vis('nav-login', false); vis('nav-register', false); vis('nav-logout', true);
    const u = el('nav-user');
    if (u) { u.style.display = 'inline-flex'; u.textContent = `👤 ${s.name}`; }
    const nd = el('nav-dashboard'); if (nd) nd.style.display = 'inline-flex';
  } else {
    vis('nav-login', true); vis('nav-register', true); vis('nav-logout', false);
    const u = el('nav-user'); if (u) u.style.display = 'none';
    const nd = el('nav-dashboard'); if (nd) nd.style.display = 'none';
  }
  el('nav-logout')?.addEventListener('click', logout);
}

// ── Hamburger ─────────────────────────────────────
function setupHamburger() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = links.classList.contains('open');
    toggle.classList.toggle('open', !isOpen);
    links.classList.toggle('open', !isOpen);
  });
  links.querySelectorAll('a, button').forEach(function(item) {
    item.addEventListener('click', function() {
      toggle.classList.remove('open'); links.classList.remove('open');
    });
  });
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      toggle.classList.remove('open'); links.classList.remove('open');
    }
  });
}

// ── HOME PAGE ─────────────────────────────────────
async function initHome() {
  updateNav();
  showLoading('home-total'); showLoading('home-available'); showLoading('home-cities');
  const donors = await cloudGetDonors();
  const el = id => document.getElementById(id);
  if (el('home-total'))     el('home-total').textContent     = donors.length;
  if (el('home-available')) el('home-available').textContent = donors.filter(d => d.available).length;
  if (el('home-cities'))    el('home-cities').textContent    = new Set(donors.map(d => d.city)).size;
}
function showLoading(id) { const e = document.getElementById(id); if(e) e.textContent = '...'; }

// ── LOGIN ─────────────────────────────────────────
function initLoginForm() {
  updateNav();
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('l-email').value.trim().toLowerCase();
    const pass  = document.getElementById('l-password').value;
    const errEl = document.getElementById('login-error');
    const btn   = e.target.querySelector('button[type=submit]');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    if (btn)   { btn.disabled = true; btn.textContent = 'Signing in...'; }
    try {
      const result = await jbSignIn(email, pass);
      if (result.error) {
        const msg = result.error === 'NOT_FOUND'  ? 'Email registered nahi hai.' :
                    result.error === 'WRONG_PASS' ? 'Password galat hai.' : 'Login failed.';
        if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
        showToast(msg, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In →'; }
        return;
      }
      setSession(result.user);
      showToast(`Welcome back, ${result.user.name}!`, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch {
      showToast('Network error. Internet check karo.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In →'; }
    }
  });
}

// ── REGISTER ──────────────────────────────────────
function initRegisterForm() {
  updateNav();
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.dataset.role;
      const extra = document.getElementById('donor-extra-fields');
      if (extra) extra.style.display = role === 'donor' ? 'block' : 'none';
      const roleInput = document.getElementById('r-role');
      if (roleInput) roleInput.value = role;
    });
  });
  document.getElementById('register-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim().toLowerCase();
    const pass  = document.getElementById('r-password').value;
    const city  = document.getElementById('r-city').value.trim();
    const role  = document.getElementById('r-role').value || 'user';
    const errEl = document.getElementById('register-error');
    const btn   = e.target.querySelector('button[type=submit]');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    if (!name || !email || !pass || !city) {
      if (errEl) { errEl.textContent = 'Please fill all required fields.'; errEl.classList.add('show'); } return;
    }
    if (pass.length < 6) {
      if (errEl) { errEl.textContent = 'Password min 6 characters hona chahiye.'; errEl.classList.add('show'); } return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }
    try {
      const result = await jbRegister({ name, email, password: pass, city, role });
      if (result.error) {
        const msg = result.error === 'EMAIL_EXISTS' ? 'Email already registered hai.' : 'Registration failed.';
        if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
        showToast(msg, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Create Account →'; } return;
      }
      // If donor, add to cloud donors list too
      if (role === 'donor') {
        const blood   = document.getElementById('r-blood')?.value;
        const contact = document.getElementById('r-contact')?.value.trim();
        if (blood && contact) {
          const donors = await cloudGetDonors();
          donors.unshift({ id:'d_'+Date.now(), name, blood, city, contact, available:true, ts:Date.now() });
          await cloudSaveDonors(donors);
        }
      }
      setSession(result.user);
      showToast(`Account bana! Welcome, ${name}!`, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 900);
    } catch {
      showToast('Network error. Internet check karo.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Create Account →'; }
    }
  });
}

// ── DONOR FORM ────────────────────────────────────
function initDonorForm() {
  updateNav();
  document.getElementById('donor-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name      = document.getElementById('d-name').value.trim();
    const blood     = document.getElementById('d-blood').value;
    const city      = document.getElementById('d-city').value.trim();
    const contact   = document.getElementById('d-contact').value.trim();
    const available = document.getElementById('d-available').value === 'yes';
    if (!name || !blood || !city || !contact) { showToast('Please fill all required fields', 'error'); return; }
    if (!/^[6-9]\d{9}$/.test(contact)) { showToast('Valid 10-digit mobile number enter karo', 'error'); return; }
    const donors = await cloudGetDonors();
    if (donors.find(d => d.contact === contact)) { showToast('Yeh number pehle se registered hai!', 'error'); return; }
    donors.unshift({ id:'d_'+Date.now(), name, blood, city, contact, available, ts:Date.now() });
    await cloudSaveDonors(donors);
    showToast(`${name} registered as ${blood} donor!`, 'success');
    const banner = document.getElementById('donor-success');
    if (banner) {
      banner.textContent = `✅ Thank you, ${name}! You are now registered as a ${blood} donor in ${city}.`;
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 5000);
    }
    document.getElementById('donor-form').reset();
  });
}

// ── SEARCH ────────────────────────────────────────
async function initSearch() {
  updateNav();
  await initSampleDonors();
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault(); performSearch();
  });
  const p = new URLSearchParams(window.location.search);
  if (p.get('blood') || p.get('city')) {
    const bEl = document.getElementById('filter-blood');
    const cEl = document.getElementById('filter-city');
    if (bEl && p.get('blood')) bEl.value = p.get('blood');
    if (cEl && p.get('city'))  cEl.value = p.get('city');
    performSearch();
  }
}

async function performSearch() {
  const blood = document.getElementById('filter-blood')?.value || '';
  const city  = document.getElementById('filter-city')?.value.trim().toLowerCase() || '';
  const wrap  = document.getElementById('results-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-state"><div class="spinner"></div><p style="color:var(--text-muted);margin-top:0.5rem;">Finding donors...</p></div>`;
  let list = await cloudGetDonors();
  if (blood) list = list.filter(d => d.blood === blood);
  if (city)  list = list.filter(d => d.city.toLowerCase().includes(city));
  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${list.length} donor${list.length !== 1 ? 's' : ''} found`;
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><h3>No donors found</h3><p>Try a different blood group or city.</p></div>`;
    return;
  }
  list.sort((a,b) => (b.available - a.available) || (b.ts - a.ts));
  const bestIdx = list.findIndex(d => d.available && city && d.city.toLowerCase().includes(city));
  wrap.innerHTML = `<div class="results-grid">${list.map((d,i) => donorCard(d, i === bestIdx && bestIdx !== -1)).join('')}</div>`;
}

function donorCard(d, isBest) {
  return `
    <div class="donor-card ${isBest ? 'best-match' : ''}">
      ${isBest ? '<div class="best-badge">⭐ Best Match</div>' : ''}
      <div class="donor-top">
        <div class="donor-avatar">${d.name.charAt(0)}</div>
        <div><div class="donor-name">${d.name}</div><div class="donor-city">📍 ${d.city}</div></div>
        <div class="blood-group-tag">${d.blood}</div>
      </div>
      <div class="donor-details">
        <div class="donor-detail">🕐 ${timeAgo(d.ts)}</div>
        <div class="donor-detail"><span class="avail-tag ${d.available ? 'yes' : 'no'}">${d.available ? '🟢 Available' : '⚫ Unavailable'}</span></div>
      </div>
      ${d.available
        ? `<a href="tel:${d.contact}" class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:0.8rem;text-decoration:none;">📞 Call Donor — ${d.contact}</a>`
        : `<div style="margin-top:0.8rem;padding:8px 12px;background:#f3f4f6;border-radius:8px;text-align:center;font-size:0.8rem;color:#9ca3af;">Currently unavailable</div>`
      }
    </div>`;
}

// ── Ambulance Siren ───────────────────────────────
function playEmergencyHorn() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const totalDuration = 6, cycleTime = 0.9, hiFreq = 960, loFreq = 640;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();
    function makeDistortionCurve(amount) {
      const n = 256, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i*2)/n-1; curve[i] = ((Math.PI+amount)*x)/(Math.PI+amount*Math.abs(x)); }
      return curve;
    }
    distortion.curve = makeDistortionCurve(30); distortion.oversample = '2x';
    osc.connect(distortion); distortion.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; gain.gain.setValueAtTime(0.0, ctx.currentTime);
    const now = ctx.currentTime; let t = now;
    while (t < now + totalDuration) {
      gain.gain.linearRampToValueAtTime(0.7, t+0.05);
      osc.frequency.setValueAtTime(loFreq, t);
      osc.frequency.linearRampToValueAtTime(hiFreq, t+cycleTime*0.5);
      osc.frequency.linearRampToValueAtTime(loFreq, t+cycleTime);
      t += cycleTime;
    }
    gain.gain.setValueAtTime(0.7, now+totalDuration-0.2);
    gain.gain.linearRampToValueAtTime(0.0, now+totalDuration);
    osc.start(now); osc.stop(now+totalDuration);
    osc.onended = () => ctx.close();
  } catch(e) { console.warn('Audio not supported:', e); }
}

// ── Emergency SOS ─────────────────────────────────
function triggerSOS() {
  const btn = document.getElementById('sos-btn');
  const alert = document.getElementById('sos-alert');
  playEmergencyHorn();
  const list = store.get(KEYS.emergencies);
  list.push({ ts: Date.now(), city: getSession()?.city || 'Unknown' });
  store.set(KEYS.emergencies, list);
  if (btn) { btn.disabled=true; btn.innerHTML='🚨 SOS Sent!'; btn.style.background='#7f1d1d'; btn.style.animation='sos-pulse 0.6s ease-in-out 5'; }
  if (alert) {
    alert.innerHTML = `🚨 <strong>Emergency request initiated!</strong><br>Please contact available donors immediately.<br><small style="opacity:0.75;">Request logged at ${new Date().toLocaleTimeString()}</small>`;
    alert.classList.add('show');
  }
  showToast('🚨 Emergency SOS sent! Contact donors now.', 'warning', 6000);
  const statEl = document.getElementById('stat-emergency');
  if (statEl) statEl.textContent = list.length;
  setTimeout(() => {
    if (btn) { btn.disabled=false; btn.innerHTML='🆘 Send Emergency SOS'; btn.style.background=''; btn.style.animation=''; }
  }, 10000);
}

// ── DASHBOARD ─────────────────────────────────────
async function initDashboard() {
  updateNav();
  await initSampleDonors();
  await renderDashStats();
  await renderRecentDonors();
  renderCharts();
  const el = document.getElementById('last-updated');
  if (el) el.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

async function renderDashStats() {
  const donors = await cloudGetDonors();
  const el = id => document.getElementById(id);
  if (el('stat-total'))     el('stat-total').textContent     = donors.length;
  if (el('stat-available')) el('stat-available').textContent = donors.filter(d => d.available).length;
  if (el('stat-emergency')) el('stat-emergency').textContent = store.get(KEYS.emergencies).length;
  if (el('stat-cities'))    el('stat-cities').textContent    = new Set(donors.map(d => d.city)).size;
  if (el('stat-visitors'))  el('stat-visitors').textContent  = getVisitorCount();
}

async function renderRecentDonors() {
  const list = document.getElementById('recent-list');
  if (!list) return;
  const donors = (await cloudGetDonors()).map(d => ({ type:'donor', name:d.name, blood:d.blood, city:d.city, available:d.available, ts:d.ts }));
  const { transactions } = await cloudGetMarket();
  const txActivity = transactions.map(t => ({ type:t.type==='buy'?'buy':'sell', name:t.name, blood:t.blood, qty:t.qty||1, unitPrice:t.unitPrice||0, ts:t.ts }));
  const feed = [...donors, ...txActivity].sort((a,b) => b.ts - a.ts).slice(0, 8);
  if (!feed.length) { list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">No activity yet</div>'; return; }
  list.innerHTML = feed.map(item => {
    if (item.type === 'donor') return `
      <div class="recent-item">
        <div class="recent-avatar" style="background:linear-gradient(135deg,#e63946,#c1121f);color:#fff;">${item.name.charAt(0)}</div>
        <div class="recent-info">
          <div class="name">${item.name} <span style="font-size:0.75rem;font-weight:700;background:#fff5f5;color:#e63946;padding:2px 7px;border-radius:6px;margin-left:4px;">${item.blood}</span></div>
          <div class="meta">🩸 Registered as donor · ${item.city} · ${timeAgo(item.ts)}</div>
        </div>
        <div class="avail-dot ${item.available ? 'yes' : 'no'}"></div>
      </div>`;
    if (item.type === 'buy') return `
      <div class="recent-item">
        <div class="recent-avatar" style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:1rem;">🛒</div>
        <div class="recent-info">
          <div class="name">${item.name} <span style="font-size:0.75rem;font-weight:700;background:#f0fdf4;color:#16a34a;padding:2px 7px;border-radius:6px;margin-left:4px;">Bought</span></div>
          <div class="meta">💉 ${item.qty} unit${item.qty>1?'s':''} ${item.blood} · ₹${item.unitPrice.toLocaleString()}/unit · ${timeAgo(item.ts)}</div>
        </div>
        <div style="font-size:0.8rem;font-weight:800;color:#16a34a;">+${item.qty}u</div>
      </div>`;
    return `
      <div class="recent-item">
        <div class="recent-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:1rem;">💉</div>
        <div class="recent-info">
          <div class="name">${item.name} <span style="font-size:0.75rem;font-weight:700;background:#fff7ed;color:#f59e0b;padding:2px 7px;border-radius:6px;margin-left:4px;">Listed</span></div>
          <div class="meta">🏷️ ${item.qty} unit${item.qty>1?'s':''} ${item.blood} at ₹${item.unitPrice.toLocaleString()}/unit · ${timeAgo(item.ts)}</div>
        </div>
        <div style="font-size:0.8rem;font-weight:800;color:#f59e0b;">₹${item.unitPrice.toLocaleString()}</div>
      </div>`;
  }).join('');
}

async function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const donors     = await cloudGetDonors();
  const groups     = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const counts     = groups.map(g => donors.filter(d => d.blood === g).length);
  const availCount = donors.filter(d => d.available).length;
  const unavail    = donors.length - availCount;
  const pct        = donors.length ? Math.round(availCount / donors.length * 100) : 0;
  const maxVal     = Math.max(...counts, 1);
  const pctEl = document.getElementById('donut-pct'); if (pctEl) pctEl.textContent = pct + '%';
  const badgeEl = document.getElementById('chart-total-badge'); if (badgeEl) badgeEl.textContent = `${donors.length} donors`;
  const legendEl = document.getElementById('donut-legend');
  if (legendEl) legendEl.innerHTML = `
    <div class="legend-item"><span class="legend-dot" style="background:#16a34a;"></span>Available (${availCount})</div>
    <div class="legend-item"><span class="legend-dot" style="background:#e5e7eb;border:1px solid #d1d5db;"></span>Unavailable (${unavail})</div>`;
  const bgCtx = document.getElementById('chart-bloodgroup');
  if (bgCtx) new Chart(bgCtx, { type:'bar', data:{ labels:groups, datasets:[{ data:counts,
    backgroundColor:counts.map(v=>`rgba(230,57,70,${(0.3+0.7*(v/maxVal)).toFixed(2)})`),
    borderRadius:10, borderSkipped:false, borderWidth:0, hoverBackgroundColor:'#c1121f' }] },
    options:{ responsive:true, maintainAspectRatio:false, animation:{duration:900,easing:'easeOutQuart'},
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1a1a2e', titleColor:'#fff', bodyColor:'#ff6b6b',
        padding:12, cornerRadius:10, displayColors:false, callbacks:{label:ctx=>` ${ctx.parsed.y} donor${ctx.parsed.y!==1?'s':''}`} } },
      scales:{ y:{beginAtZero:true,ticks:{stepSize:1,color:'#9ca3af',font:{size:11,weight:'600'}},grid:{color:'rgba(240,208,208,0.7)'}},
        x:{ticks:{color:'#1a1a2e',font:{size:12,weight:'800'}},grid:{display:false}} } } });
  const avCtx = document.getElementById('chart-availability');
  if (avCtx) new Chart(avCtx, { type:'doughnut', data:{ labels:['Available','Unavailable'],
    datasets:[{ data:[availCount||0,unavail||1], backgroundColor:['#16a34a','#f3f4f6'],
    borderWidth:0, hoverOffset:10, hoverBackgroundColor:['#15803d','#e5e7eb'] }] },
    options:{ responsive:true, maintainAspectRatio:false, animation:{animateRotate:true,duration:1000,easing:'easeOutQuart'},
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#1a1a2e',titleColor:'#fff',bodyColor:'#fff',padding:12,cornerRadius:10} },
      cutout:'72%' } });
}

// ── Visitor Counter ───────────────────────────────
function getDeviceFingerprint() {
  const raw = [navigator.language, navigator.platform, screen.width+'x'+screen.height,
    screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency||'', navigator.maxTouchPoints||''].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return 'fp_' + Math.abs(hash).toString(36);
}
function trackVisitor() {
  const VISIT_KEY = 'blp_total_visits', SEEN_KEY = 'blp_seen_fps';
  const fp = getDeviceFingerprint();
  const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  if (!seen.includes(fp)) {
    seen.push(fp);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    const count = parseInt(localStorage.getItem(VISIT_KEY) || '0') + 1;
    localStorage.setItem(VISIT_KEY, count);
  }
}
function getVisitorCount() { return parseInt(localStorage.getItem('blp_total_visits') || '0'); }

// ── PAGE ROUTER ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  trackVisitor();
  setupHamburger();
  const page = document.body.dataset.page;
  if      (page === 'home')      initHome();
  else if (page === 'login')     initLoginForm();
  else if (page === 'register')  initRegisterForm();
  else if (page === 'donor')     initDonorForm();
  else if (page === 'search')    initSearch();
  else if (page === 'dashboard') initDashboard();
  else { updateNav(); }
});
