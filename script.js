/* ===================================================
   BloodLink Pro — Complete Core Logic
   =================================================== */

// ── Storage Keys ──────────────────────────────────
const KEYS = {
  users:       'blp_users',
  donors:      'blp_donors',
  session:     'blp_session',
  emergencies: 'blp_emergencies'
};

const store = {
  get:    k => JSON.parse(localStorage.getItem(k) || '[]'),
  set:    (k,v) => localStorage.setItem(k, JSON.stringify(v)),
  getObj: k => JSON.parse(localStorage.getItem(k) || 'null'),
  setObj: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: k => localStorage.removeItem(k)
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Seed sample donors ────────────────────────────
function initSampleDonors() {
  if (store.get(KEYS.donors).length > 0) return;
  store.set(KEYS.donors, [
    { id:'s1',  name:'Rahul Sharma',  blood:'O+',  city:'Kanpur',  contact:'9876543210', available:true,  ts:Date.now()-3600000   },
    { id:'s2',  name:'Priya Singh',   blood:'A+',  city:'Lucknow', contact:'9812345678', available:true,  ts:Date.now()-7200000   },
    { id:'s3',  name:'Amit Verma',    blood:'B+',  city:'Kanpur',  contact:'9898989898', available:false, ts:Date.now()-86400000  },
    { id:'s4',  name:'Sneha Gupta',   blood:'AB+', city:'Delhi',   contact:'9911223344', available:true,  ts:Date.now()-1800000   },
    { id:'s5',  name:'Vikram Yadav',  blood:'O-',  city:'Kanpur',  contact:'9955667788', available:true,  ts:Date.now()-5400000   },
    { id:'s6',  name:'Neha Patel',    blood:'A-',  city:'Unnao',   contact:'9933445566', available:true,  ts:Date.now()-10800000  },
    { id:'s7',  name:'Rohit Kumar',   blood:'B-',  city:'Lucknow', contact:'9977889900', available:false, ts:Date.now()-172800000 },
    { id:'s8',  name:'Anjali Mishra', blood:'AB-', city:'Delhi',   contact:'9944556677', available:true,  ts:Date.now()-900000    },
    { id:'s9',  name:'Suresh Tiwari', blood:'O+',  city:'Kanpur',  contact:'9900112233', available:true,  ts:Date.now()-2700000   },
    { id:'s10', name:'Kavita Rao',    blood:'A+',  city:'Unnao',   contact:'9866778899', available:true,  ts:Date.now()-14400000  },
    { id:'s11', name:'Deepak Joshi',  blood:'B+',  city:'Kanpur',  contact:'9822334455', available:true,  ts:Date.now()-600000    },
    { id:'s12', name:'Pooja Agarwal', blood:'O-',  city:'Delhi',   contact:'9811223344', available:false, ts:Date.now()-259200000 }
  ]);
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
function getSession()     { return store.getObj(KEYS.session); }
function setSession(u)    { store.setObj(KEYS.session, u); }
function clearSession()   { store.remove(KEYS.session); }

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

// ── Hamburger — setup once ────────────────────────
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

  // Close on nav link / button click
  links.querySelectorAll('a, button').forEach(function(item) {
    item.addEventListener('click', function() {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });

  // Close on outside tap (mobile)
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      toggle.classList.remove('open');
      links.classList.remove('open');
    }
  });
}

// ── HOME PAGE ─────────────────────────────────────
function initHome() {
  initSampleDonors();
  updateNav();
  const donors = store.get(KEYS.donors);
  const el = id => document.getElementById(id);
  if (el('home-total'))     el('home-total').textContent     = donors.length;
  if (el('home-available')) el('home-available').textContent = donors.filter(d => d.available).length;
  if (el('home-cities'))    el('home-cities').textContent    = new Set(donors.map(d => d.city)).size;
}

// ── LOGIN ─────────────────────────────────────────
function initLoginForm() {
  updateNav();
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email    = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-password').value;
    const errEl    = document.getElementById('login-error');
    const users    = store.get(KEYS.users);
    const user     = users.find(u => u.email === email && u.password === password);
    if (!user) {
      if (errEl) { errEl.textContent = 'Invalid email or password.'; errEl.classList.add('show'); }
      showToast('Login failed. Check your credentials.', 'error');
      return;
    }
    setSession(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  });
}

// ── REGISTER ──────────────────────────────────────
function initRegisterForm() {
  updateNav();
  // Role tab switching
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

  document.getElementById('register-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-password').value;
    const city     = document.getElementById('r-city').value.trim();
    const role     = document.getElementById('r-role').value || 'user';
    const errEl    = document.getElementById('register-error');

    if (!name || !email || !password || !city) {
      if (errEl) { errEl.textContent = 'Please fill all required fields.'; errEl.classList.add('show'); }
      return;
    }
    if (password.length < 6) {
      if (errEl) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.add('show'); }
      return;
    }
    const users = store.get(KEYS.users);
    if (users.find(u => u.email === email)) {
      if (errEl) { errEl.textContent = 'Email already registered.'; errEl.classList.add('show'); }
      return;
    }
    const newUser = { id:'u_'+Date.now(), name, email, password, city, role, ts:Date.now() };
    users.push(newUser);
    store.set(KEYS.users, users);

    // If donor role, also add to donors list
    if (role === 'donor') {
      const blood   = document.getElementById('r-blood')?.value;
      const contact = document.getElementById('r-contact')?.value.trim();
      if (blood && contact) {
        const donors = store.get(KEYS.donors);
        donors.push({ id:'d_'+Date.now(), name, blood, city, contact, available:true, ts:Date.now() });
        store.set(KEYS.donors, donors);
      }
    }
    setSession(newUser);
    showToast(`Account created! Welcome, ${name}!`, 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 900);
  });
}

// ── DONOR FORM ────────────────────────────────────
function initDonorForm() {
  updateNav();
  document.getElementById('donor-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name      = document.getElementById('d-name').value.trim();
    const blood     = document.getElementById('d-blood').value;
    const city      = document.getElementById('d-city').value.trim();
    const contact   = document.getElementById('d-contact').value.trim();
    const available = document.getElementById('d-available').value === 'yes';

    if (!name || !blood || !city || !contact) {
      showToast('Please fill all required fields', 'error'); return;
    }
    if (!/^[6-9]\d{9}$/.test(contact)) {
      showToast('Enter a valid 10-digit mobile number', 'error'); return;
    }
    const donors = store.get(KEYS.donors);
    donors.push({ id:'d_'+Date.now(), name, blood, city, contact, available, ts:Date.now() });
    store.set(KEYS.donors, donors);

    showToast(`${name} registered as a ${blood} donor!`, 'success');
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
function initSearch() {
  updateNav();
  initSampleDonors();
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault(); performSearch();
  });
  // Auto-search if URL params present
  const p = new URLSearchParams(window.location.search);
  if (p.get('blood') || p.get('city')) {
    const bEl = document.getElementById('filter-blood');
    const cEl = document.getElementById('filter-city');
    if (bEl && p.get('blood')) bEl.value = p.get('blood');
    if (cEl && p.get('city'))  cEl.value = p.get('city');
    performSearch();
  }
}

function performSearch() {
  const blood = document.getElementById('filter-blood')?.value || '';
  const city  = document.getElementById('filter-city')?.value.trim().toLowerCase() || '';
  const wrap  = document.getElementById('results-wrap');
  if (!wrap) return;

  wrap.innerHTML = `<div class="loading-state"><div class="spinner"></div><p style="color:var(--text-muted);margin-top:0.5rem;">Finding donors...</p></div>`;

  setTimeout(() => {
    let list = store.get(KEYS.donors);
    if (blood) list = list.filter(d => d.blood === blood);
    if (city)  list = list.filter(d => d.city.toLowerCase().includes(city));

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${list.length} donor${list.length !== 1 ? 's' : ''} found`;

    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><h3>No donors found</h3><p>No donors available for the selected criteria.<br>Try a different blood group or city.</p></div>`;
      return;
    }

    // Sort: available first, then by recency
    list.sort((a,b) => (b.available - a.available) || (b.ts - a.ts));

    // Best match: available + same city
    const bestIdx = list.findIndex(d => d.available && city && d.city.toLowerCase().includes(city));

    wrap.innerHTML = `<div class="results-grid">${list.map((d,i) => donorCard(d, i === bestIdx && bestIdx !== -1)).join('')}</div>`;
  }, 600);
}

function donorCard(d, isBest) {
  return `
    <div class="donor-card ${isBest ? 'best-match' : ''}">
      ${isBest ? '<div class="best-badge">⭐ Best Match</div>' : ''}
      <div class="donor-top">
        <div class="donor-avatar">${d.name.charAt(0)}</div>
        <div>
          <div class="donor-name">${d.name}</div>
          <div class="donor-city">📍 ${d.city}</div>
        </div>
        <div class="blood-group-tag">${d.blood}</div>
      </div>
      <div class="donor-details">
        <div class="donor-detail">🕐 ${timeAgo(d.ts)}</div>
        <div class="donor-detail">
          <span class="avail-tag ${d.available ? 'yes' : 'no'}">${d.available ? '🟢 Available' : '⚫ Unavailable'}</span>
        </div>
      </div>
      ${d.available
        ? `<a href="tel:${d.contact}" class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:0.8rem;text-decoration:none;">📞 Call Donor — ${d.contact}</a>`
        : `<div style="margin-top:0.8rem;padding:8px 12px;background:#f3f4f6;border-radius:8px;text-align:center;font-size:0.8rem;color:#9ca3af;">Currently unavailable</div>`
      }
    </div>`;
}

// ── EMERGENCY SOS ─────────────────────────────────
// ── Ambulance Siren (Web Audio API) ──────────────
function playEmergencyHorn() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const totalDuration = 6; // seconds
    const cycleTime     = 0.9; // one HI-LO cycle duration
    const hiFreq        = 960;  // HIGH tone
    const loFreq        = 640;  // LOW tone

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    // Slight distortion for that real ambulance buzz
    const distortion = ctx.createWaveShaper();
    function makeDistortionCurve(amount) {
      const n = 256, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
      }
      return curve;
    }
    distortion.curve = makeDistortionCurve(30);
    distortion.oversample = '2x';

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0, ctx.currentTime);

    // Build HI-LO sweep cycles
    const now = ctx.currentTime;
    let t = now;

    while (t < now + totalDuration) {
      // Fade in
      gain.gain.linearRampToValueAtTime(0.7, t + 0.05);

      // HI tone — sweep up
      osc.frequency.setValueAtTime(loFreq, t);
      osc.frequency.linearRampToValueAtTime(hiFreq, t + cycleTime * 0.5);

      // LO tone — sweep down
      osc.frequency.linearRampToValueAtTime(loFreq, t + cycleTime);

      t += cycleTime;
    }

    // Fade out at end
    gain.gain.setValueAtTime(0.7, now + totalDuration - 0.2);
    gain.gain.linearRampToValueAtTime(0.0, now + totalDuration);

    osc.start(now);
    osc.stop(now + totalDuration);

    osc.onended = () => ctx.close();

  } catch (e) {
    console.warn('Audio not supported:', e);
  }
}

// ── Emergency SOS ─────────────────────────────────
function triggerSOS() {
  const btn   = document.getElementById('sos-btn');
  const alert = document.getElementById('sos-alert');

  // 🔊 Play emergency horn
  playEmergencyHorn();

  // Save to storage
  const list = store.get(KEYS.emergencies);
  list.push({ ts: Date.now(), city: getSession()?.city || 'Unknown' });
  store.set(KEYS.emergencies, list);

  // Update button — pulsing red
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '🚨 SOS Sent!';
    btn.style.background = '#7f1d1d';
    btn.style.animation = 'sos-pulse 0.6s ease-in-out 5';
  }

  // Show alert box
  if (alert) {
    alert.innerHTML = `
      🚨 <strong>Emergency request initiated!</strong><br>
      Please contact available donors immediately or call your nearest blood bank.<br>
      <small style="opacity:0.75;">Request logged at ${new Date().toLocaleTimeString()}</small>`;
    alert.classList.add('show');
  }

  showToast('🚨 Emergency SOS sent! Contact donors now.', 'warning', 6000);

  // Update dashboard stat
  const statEl = document.getElementById('stat-emergency');
  if (statEl) statEl.textContent = list.length;

  // Re-enable after 10s
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🆘 Send Emergency SOS';
      btn.style.background = '';
      btn.style.animation = '';
    }
  }, 10000);
}

// ── DASHBOARD ─────────────────────────────────────
function initDashboard() {
  updateNav();
  initSampleDonors();
  renderDashStats();
  renderRecentDonors();
  renderCharts();
  const el = document.getElementById('last-updated');
  if (el) el.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

function renderDashStats() {
  const donors = store.get(KEYS.donors);
  const el = id => document.getElementById(id);
  if (el('stat-total'))     el('stat-total').textContent     = donors.length;
  if (el('stat-available')) el('stat-available').textContent = donors.filter(d => d.available).length;
  if (el('stat-emergency')) el('stat-emergency').textContent = store.get(KEYS.emergencies).length;
  if (el('stat-cities'))    el('stat-cities').textContent    = new Set(donors.map(d => d.city)).size;
}

function renderRecentDonors() {
  const list = document.getElementById('recent-list');
  if (!list) return;
  const recent = [...store.get(KEYS.donors)].sort((a,b) => b.ts - a.ts).slice(0, 6);
  list.innerHTML = recent.map(d => `
    <div class="recent-item">
      <div class="recent-avatar">${d.name.charAt(0)}</div>
      <div class="recent-info">
        <div class="name">${d.name}</div>
        <div class="meta">${d.blood} · ${d.city} · ${timeAgo(d.ts)}</div>
      </div>
      <div class="avail-dot ${d.available ? 'yes' : 'no'}" title="${d.available ? 'Available' : 'Unavailable'}"></div>
    </div>`).join('');
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const donors      = store.get(KEYS.donors);
  const groups      = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const counts      = groups.map(g => donors.filter(d => d.blood === g).length);
  const availCount  = donors.filter(d => d.available).length;
  const unavail     = donors.length - availCount;
  const pct         = donors.length ? Math.round(availCount / donors.length * 100) : 0;
  const maxVal      = Math.max(...counts, 1);

  // Update donut center text if element exists
  const pctEl = document.getElementById('donut-pct');
  if (pctEl) pctEl.textContent = pct + '%';
  const badgeEl = document.getElementById('chart-total-badge');
  if (badgeEl) badgeEl.textContent = `${donors.length} donors`;
  const legendEl = document.getElementById('donut-legend');
  if (legendEl) legendEl.innerHTML = `
    <div class="legend-item"><span class="legend-dot" style="background:#16a34a;"></span>Available (${availCount})</div>
    <div class="legend-item"><span class="legend-dot" style="background:#e5e7eb;border:1px solid #d1d5db;"></span>Unavailable (${unavail})</div>`;

  // Bar chart
  const bgCtx = document.getElementById('chart-bloodgroup');
  if (bgCtx) {
    new Chart(bgCtx, {
      type: 'bar',
      data: {
        labels: groups,
        datasets: [{
          data: counts,
          backgroundColor: counts.map(v => `rgba(230,57,70,${(0.3 + 0.7*(v/maxVal)).toFixed(2)})`),
          borderRadius: 10, borderSkipped: false, borderWidth: 0,
          hoverBackgroundColor: '#c1121f'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor:'#1a1a2e', titleColor:'#fff', bodyColor:'#ff6b6b',
            padding:12, cornerRadius:10, displayColors:false,
            callbacks: { label: ctx => ` ${ctx.parsed.y} donor${ctx.parsed.y!==1?'s':''}` }
          }
        },
        scales: {
          y: { beginAtZero:true, ticks:{ stepSize:1, color:'#9ca3af', font:{size:11,weight:'600'} }, grid:{ color:'rgba(240,208,208,0.7)' } },
          x: { ticks:{ color:'#1a1a2e', font:{size:12,weight:'800'} }, grid:{ display:false } }
        }
      }
    });
  }

  // Doughnut chart
  const avCtx = document.getElementById('chart-availability');
  if (avCtx) {
    new Chart(avCtx, {
      type: 'doughnut',
      data: {
        labels: ['Available','Unavailable'],
        datasets: [{
          data: [availCount || 0, unavail || 1],
          backgroundColor: ['#16a34a','#f3f4f6'],
          borderWidth: 0, hoverOffset: 10,
          hoverBackgroundColor: ['#15803d','#e5e7eb']
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { animateRotate:true, duration:1000, easing:'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor:'#1a1a2e', titleColor:'#fff', bodyColor:'#fff', padding:12, cornerRadius:10 }
        },
        cutout: '72%'
      }
    });
  }
}

// ── PAGE ROUTER ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupHamburger();
  const page = document.body.dataset.page;
  if      (page === 'home')      initHome();
  else if (page === 'login')     initLoginForm();
  else if (page === 'register')  initRegisterForm();
  else if (page === 'donor')     initDonorForm();
  else if (page === 'search')    initSearch();
  else if (page === 'dashboard') initDashboard();
  else { updateNav(); } // banks, pricing, about
});
