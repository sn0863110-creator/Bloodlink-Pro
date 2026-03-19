// BloodLink Pro - script.js (HackForce / Satish Kumar Nishad)
const API_KEY = '$2a$10$gnr12wuvoYipciglW9hglOFE5FfQ9q0yU01ZBv8dwhwaNMfUSU.NW';
const BIN_USERS = '69bc2150aa77b81da9fcb1e3';
const BIN_DONORS = '69bc22a2b7ec241ddc82de74';
const BIN_MARKET = '69bc22a2b7ec241ddc82de79';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

async function jbGet(binId) {
  try {
    const r = await fetch(BASE_URL + '/' + binId + '/latest', { headers: { 'X-Master-Key': API_KEY } });
    if (!r.ok) return null;
    const d = await r.json();
    return d.record || null;
  } catch(e) { return null; }
}

async function jbPut(binId, data) {
  try {
    const r = await fetch(BASE_URL + '/' + binId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch(e) { return false; }
}

async function getUsers() {
  const cloud = await jbGet(BIN_USERS);
  if (cloud && Array.isArray(cloud.users)) { localStorage.setItem('blp_uc', JSON.stringify(cloud.users)); return cloud.users; }
  const c = localStorage.getItem('blp_uc'); return c ? JSON.parse(c) : [];
}
async function saveUsers(arr) { localStorage.setItem('blp_uc', JSON.stringify(arr)); return await jbPut(BIN_USERS, { users: arr }); }

async function getDonors() {
  const cloud = await jbGet(BIN_DONORS);
  if (cloud && Array.isArray(cloud.donors)) { localStorage.setItem('blp_dc', JSON.stringify(cloud.donors)); return cloud.donors; }
  const c = localStorage.getItem('blp_dc'); return c ? JSON.parse(c) : [];
}
async function saveDonors(arr) { localStorage.setItem('blp_dc', JSON.stringify(arr)); return await jbPut(BIN_DONORS, { donors: arr }); }

async function getMarket() {
  const cloud = await jbGet(BIN_MARKET);
  if (cloud && Array.isArray(cloud.market)) { localStorage.setItem('blp_mc', JSON.stringify(cloud.market)); return cloud.market; }
  const c = localStorage.getItem('blp_mc'); return c ? JSON.parse(c) : [];
}
async function saveMarket(arr) { localStorage.setItem('blp_mc', JSON.stringify(arr)); return await jbPut(BIN_MARKET, { market: arr }); }

function currentUser() { const u = localStorage.getItem('blp_user'); return u ? JSON.parse(u) : null; }
function setCurrentUser(u) { localStorage.setItem('blp_user', JSON.stringify(u)); }
function logout() { localStorage.removeItem('blp_user'); window.location.href = 'login.html'; }

function showToast(msg, type) {
  let t = document.getElementById('blp-toast');
  if (!t) { t = document.createElement('div'); t.id = 'blp-toast'; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;font-size:14px;transition:opacity .4s'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.background = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#2980b9';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.opacity = '0'; }, 3000);
}

function setupHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function(e){ e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', function(e){ if (!menu.contains(e.target) && e.target !== btn) menu.classList.remove('open'); });
}

function getDeviceFingerprint() {
  const sig = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||'', navigator.vendor||'', navigator.plugins ? navigator.plugins.length : 0].join('|');
  let h = 0; for (let i = 0; i < sig.length; i++) { h = ((h << 5) - h) + sig.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

function trackVisitor() {
  const fp = getDeviceFingerprint();
  const seen = JSON.parse(localStorage.getItem('blp_seen_fps') || '[]');
  let count = parseInt(localStorage.getItem('blp_vc') || '0');
  if (!seen.includes(fp)) { seen.push(fp); count++; localStorage.setItem('blp_seen_fps', JSON.stringify(seen)); localStorage.setItem('blp_vc', count); }
  const el = document.getElementById('visitor-count'); if (el) el.textContent = count;
}
async function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = form.querySelector('[name=email]').value.trim().toLowerCase();
    const pass = form.querySelector('[name=password]').value;
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Logging in...';
    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) { showToast('Email not found. Please register first.', 'error'); btn.disabled = false; btn.textContent = 'Login'; return; }
    if (user.password !== pass) { showToast('Wrong password.', 'error'); btn.disabled = false; btn.textContent = 'Login'; return; }
    setCurrentUser(user);
    showToast('Login successful!', 'success');
    setTimeout(function(){ window.location.href = 'dashboard.html'; }, 800);
  });
}

async function initRegister() {
  const form = document.getElementById('register-form');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = form.querySelector('[name=name]').value.trim();
    const email = form.querySelector('[name=email]').value.trim().toLowerCase();
    const pass = form.querySelector('[name=password]').value;
    const bloodEl = form.querySelector('[name=blood]');
    const blood = bloodEl ? bloodEl.value : 'Unknown';
    const btn = form.querySelector('button[type=submit]');
    if (!name || !email || !pass) { showToast('Please fill all fields.', 'error'); return; }
    btn.disabled = true; btn.textContent = 'Registering...';
    const users = await getUsers();
    if (users.find(u => u.email.toLowerCase() === email)) {
      showToast('Email already registered. Please login.', 'error');
      btn.disabled = false; btn.textContent = 'Register'; return;
    }
    const newUser = { id: Date.now(), name, email, password: pass, blood, joined: new Date().toISOString() };
    users.push(newUser);
    const ok = await saveUsers(users);
    showToast(ok ? 'Registration successful! Please login.' : 'Registered (offline). Login on this device.', ok ? 'success' : 'info');
    setTimeout(function(){ window.location.href = 'login.html'; }, 1200);
  });
}

async function initDonor() {
  const form = document.getElementById('donor-form');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Submitting...';
    const donor = {
      id: Date.now(),
      name: form.querySelector('[name=name]').value.trim(),
      blood: form.querySelector('[name=blood]').value,
      city: form.querySelector('[name=city]').value.trim(),
      phone: form.querySelector('[name=phone]').value.trim(),
      age: form.querySelector('[name=age]') ? form.querySelector('[name=age]').value : '',
      date: new Date().toISOString()
    };
    if (!donor.name || !donor.blood || !donor.city || !donor.phone) {
      showToast('Please fill all required fields.', 'error');
      btn.disabled = false; btn.textContent = 'Register as Donor'; return;
    }
    const donors = await getDonors();
    donors.push(donor);
    const ok = await saveDonors(donors);
    showToast(ok ? 'Donor registered successfully!' : 'Saved locally (cloud sync pending).', ok ? 'success' : 'info');
    setTimeout(function(){ form.reset(); btn.disabled = false; btn.textContent = 'Register as Donor'; }, 1200);
  });
}

async function initSearch() {
  const form = document.getElementById('search-form');
  const results = document.getElementById('search-results');
  if (!form || !results) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const blood = form.querySelector('[name=blood]').value;
    const city = (form.querySelector('[name=city]').value || '').trim().toLowerCase();
    results.innerHTML = '<p style=text-align:center>Searching...</p>';
    const donors = await getDonors();
    const found = donors.filter(d => (!blood || d.blood === blood) && (!city || d.city.toLowerCase().includes(city)));
    if (!found.length) { results.innerHTML = '<p style=color:#e74c3c;text-align:center>No donors found.</p>'; return; }
    results.innerHTML = found.map(d => '<div class=donor-card><div class=donor-blood>' + d.blood + '</div><div class=donor-info><h3>' + d.name + '</h3><p>City: ' + d.city + '</p><p>Phone: ' + d.phone + '</p></div></div>').join('');
  });
}
async function initDashboard() {
  const user = currentUser();
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user ? user.name : 'Guest';
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  trackVisitor();
  const [donors, market] = await Promise.all([getDonors(), getMarket()]);
  const td = document.getElementById('total-donors'); if (td) td.textContent = donors.length;
  const tt = document.getElementById('total-transactions'); if (tt) tt.textContent = market.length;
  const tu = document.getElementById('total-units'); if (tu) tu.textContent = market.reduce((s,t) => s + (parseInt(t.qty)||1), 0);
  renderCharts(donors, market);
  renderRecentActivity(donors, market);
}

function renderCharts(donors, market) {
  const barCtx = document.getElementById('bloodTypeChart');
  if (barCtx) {
    const types = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    const counts = types.map(t => donors.filter(d => d.blood === t).length);
    const max = Math.max(...counts, 1);
    const colors = counts.map(c => { const i = Math.round(80 + (c/max)*175); return 'rgb('+i+',30,30)'; });
    if (window._barChart) window._barChart.destroy();
    window._barChart = new Chart(barCtx, { type:'bar', data:{ labels:types, datasets:[{ label:'Donors', data:counts, backgroundColor:colors, borderRadius:6 }] }, options:{ responsive:true, animation:{ duration:1000, easing:'easeOutQuart' }, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
  }
  const donutCtx = document.getElementById('marketChart');
  if (donutCtx) {
    const buys = market.filter(t => t.type==='buy').length;
    const sells = market.filter(t => t.type==='sell').length;
    const total = buys + sells || 1;
    const pct = Math.round((buys/total)*100);
    if (window._donutChart) window._donutChart.destroy();
    window._donutChart = new Chart(donutCtx, { type:'doughnut', data:{ labels:['Buys','Sells'], datasets:[{ data:[buys,sells], backgroundColor:['#e74c3c','#27ae60'], borderWidth:0 }] }, options:{ responsive:true, cutout:'70%', animation:{ duration:1000, easing:'easeOutQuart' }, plugins:{ legend:{ position:'bottom' } } }, plugins:[{ id:'centerText', afterDraw(chart){ const {ctx,chartArea:{left,right,top,bottom}}=chart; const cx=(left+right)/2,cy=(top+bottom)/2; ctx.save(); ctx.font='bold 22px Arial'; ctx.fillStyle='#e74c3c'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(pct+'%',cx,cy); ctx.restore(); } }] });
  }
}

function renderRecentActivity(donors, market) {
  const el = document.getElementById('recent-activity');
  if (!el) return;
  const acts = [];
  donors.slice(-5).forEach(d => acts.push({ time: new Date(d.date||Date.now()), html: '<div class=activity-item><span class=badge>DONOR</span> <b>'+d.name+'</b> ('+d.blood+') from '+d.city+'</div>' }));
  market.slice(-5).forEach(t => acts.push({ time: new Date(t.date||Date.now()), html: '<div class=activity-item><span class=badge>'+t.type.toUpperCase()+'</span> '+(t.qty||1)+' unit(s) of <b>'+t.blood+'</b> - Rs.'+t.price+'</div>' }));
  acts.sort((a,b) => b.time - a.time);
  el.innerHTML = acts.length ? acts.slice(0,8).map(a=>a.html).join('') : '<p style=text-align:center;color:#999>No recent activity yet.</p>';
}

function renderBloodCards() {
  const container = document.getElementById('blood-cards');
  if (!container) return;
  const types = [{t:'A+',p:1200},{t:'A-',p:1400},{t:'B+',p:1100},{t:'B-',p:1500},{t:'AB+',p:1300},{t:'AB-',p:1800},{t:'O+',p:1000},{t:'O-',p:2000}];
  container.innerHTML = types.map(b => '<div class=blood-card><div class=blood-type-badge>'+b.t+'</div><div class=blood-price>Rs.'+b.p+'/unit</div><button class=btn-buy onclick=openBuyModal('+JSON.stringify(b.t)+','+b.p+')>Buy Now</button></div>').join('');
}

async function openBuyModal(blood, price) {
  const user = currentUser();
  if (!user) { showToast('Please login to buy.', 'error'); return; }
  const qty = parseInt(prompt('How many units of ' + blood + '?', '1')) || 1;
  const total = price * qty;
  const commission = +(total * 0.05).toFixed(2);
  const payable = +(total + commission).toFixed(2);
  if (!confirm(qty + ' unit(s) of ' + blood + '\nBase: Rs.' + total + '\n5% fee: Rs.' + commission + '\nTotal: Rs.' + payable + '\n\nConfirm?')) return;
  const market = await getMarket();
  market.push({ id: Date.now(), type: 'buy', blood, qty, price, commission, total: payable, buyer: user.name, date: new Date().toISOString() });
  await saveMarket(market);
  showToast('Purchase recorded! Total: Rs.' + payable, 'success');
  await loadMarketListings();
}

async function loadMarketListings() {
  const market = await getMarket();
  const histEl = document.getElementById('transaction-history');
  if (histEl) {
    histEl.innerHTML = market.length ? market.slice().reverse().map(t => '<div class=tx-item><span class=tx-badge>'+t.type.toUpperCase()+'</span> <b>'+t.blood+'</b> x'+(t.qty||1)+' @ Rs.'+t.price+' | '+(t.type==='sell'?'Net: Rs.'+t.net:'Total: Rs.'+t.total)+' | '+(t.buyer||t.seller||'')+' | '+new Date(t.date).toLocaleDateString()+'</div>').join('') : '<p style=text-align:center;color:#999>No transactions yet.</p>';
  }
  const listEl = document.getElementById('seller-listings');
  if (listEl) {
    const sells = market.filter(t => t.type==='sell');
    listEl.innerHTML = sells.length ? sells.slice().reverse().map(t => '<div class=listing-item><span class=blood-badge>'+t.blood+'</span> '+(t.qty||1)+' unit(s) @ Rs.'+t.price+' | Seller: '+t.seller+' <button class=btn-small onclick=openBuyModal('+JSON.stringify(t.blood)+','+t.price+')>Buy</button></div>').join('') : '<p style=text-align:center;color:#999>No listings yet.</p>';
  }
}

async function initPricing() {
  renderBloodCards();
  await loadMarketListings();
  const clearBtn = document.getElementById('clear-history');
  if (clearBtn) clearBtn.addEventListener('click', async function(){ if (!confirm('Clear all transaction history?')) return; await saveMarket([]); await loadMarketListings(); showToast('History cleared.', 'info'); });
  const sellForm = document.getElementById('sell-form');
  if (sellForm) {
    sellForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = currentUser();
      if (!user) { showToast('Please login to sell.', 'error'); return; }
      const blood = sellForm.querySelector('[name=blood]').value;
      const qty = parseInt(sellForm.querySelector('[name=qty]').value) || 1;
      const price = parseFloat(sellForm.querySelector('[name=price]').value);
      if (!blood || !price || price <= 0) { showToast('Fill all fields.', 'error'); return; }
      const commission = +(price * qty * 0.05).toFixed(2);
      const net = +(price * qty - commission).toFixed(2);
      const market = await getMarket();
      market.push({ id: Date.now(), type: 'sell', blood, qty, price, commission, net, seller: user.name, date: new Date().toISOString() });
      await saveMarket(market);
      showToast('Listed! Net after 5% commission: Rs.' + net, 'success');
      sellForm.reset();
      await loadMarketListings();
    });
  }
}

function playEmergencyHorn() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let time = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const o1 = ctx.createOscillator(), g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.frequency.setValueAtTime(960, time); g1.gain.setValueAtTime(0.6, time); g1.gain.exponentialRampToValueAtTime(0.001, time+0.6);
    o1.start(time); o1.stop(time+0.6);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.connect(g2); g2.connect(ctx.destination);
    o2.frequency.setValueAtTime(760, time+0.6); g2.gain.setValueAtTime(0.6, time+0.6); g2.gain.exponentialRampToValueAtTime(0.001, time+1.2);
    o2.start(time+0.6); o2.stop(time+1.2);
    time += 1.2;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setupHamburger();
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'login.html') initLogin();
  if (page === 'register.html') initRegister();
  if (page === 'donor.html') initDonor();
  if (page === 'search.html') initSearch();
  if (page === 'dashboard.html') initDashboard();
  if (page === 'pricing.html') initPricing();
  if (page === 'index.html' || page === '') {
    trackVisitor();
    const sosBtn = document.getElementById('sos-btn') || document.getElementById('emergency-btn');
    if (sosBtn) sosBtn.addEventListener('click', playEmergencyHorn);
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) setTimeout(function(){ overlay.style.opacity='0'; overlay.style.pointerEvents='none'; }, 3000);
  }
});

Write-Host 'script.js written successfully. Size: ' + ([System.IO.File]::ReadAllText(C:\code2\script.js).Length) + ' bytes'
