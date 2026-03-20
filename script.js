// BloodLink Pro — script.js v3 (HackForce / Satish Kumar Nishad)
const API_KEY    = '$2a$10$gnr12wuvoYipciglW9hglOFE5FfQ9q0yU01ZBv8dwhwaNMfUSU.NW';
const BIN_USERS  = '69bc2150aa77b81da9fcb1e3';
const BIN_DONORS = '69bc22a2b7ec241ddc82de74';
const BIN_MARKET = '69bc22a2b7ec241ddc82de79';
const BASE_URL   = 'https://api.jsonbin.io/v3/b';

// ── ADMIN CONFIG ──────────────────────────────────────────
const ADMIN_EMAIL = 'sn0863110@gmail.com';
const ADMIN_PHONE = '9335857482';
function isAdmin() {
  var u = currentUser();
  return u && (u.email === ADMIN_EMAIL || u.phone === ADMIN_PHONE || u.role === 'admin');
}

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

async function getUsers() {
  const c = await jbGet(BIN_USERS);
  if (c && Array.isArray(c.users)) { localStorage.setItem('blp_uc', JSON.stringify(c.users)); return c.users; }
  const l = localStorage.getItem('blp_uc'); return l ? JSON.parse(l) : [];
}
async function saveUsers(arr) { localStorage.setItem('blp_uc', JSON.stringify(arr)); return await jbPut(BIN_USERS, {users:arr}); }

async function getDonors() {
  const c = await jbGet(BIN_DONORS);
  if (c && Array.isArray(c.donors)) { localStorage.setItem('blp_dc', JSON.stringify(c.donors)); return c.donors; }
  const l = localStorage.getItem('blp_dc'); return l ? JSON.parse(l) : [];
}
// Returns only approved donors for public, all for admin
async function getApprovedDonors() {
  var all = await getDonors();
  if (isAdmin()) return all;
  return all.filter(function(d){ return d.status !== 'pending'; });
}
async function saveDonors(arr) { localStorage.setItem('blp_dc', JSON.stringify(arr)); return await jbPut(BIN_DONORS, {donors:arr}); }

async function cloudGetMarket() {
  const c = await jbGet(BIN_MARKET);
  if (c && c.transactions !== undefined) {
    localStorage.setItem('blp_mc', JSON.stringify(c));
    return {transactions: c.transactions || [], listings: c.listings || []};
  }
  if (c && Array.isArray(c.market)) return {transactions: c.market, listings: []};
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

function currentUser() { const u = localStorage.getItem('blp_user'); return u ? JSON.parse(u) : null; }
function setCurrentUser(u) { localStorage.setItem('blp_user', JSON.stringify(u)); }
function logout() { localStorage.removeItem('blp_user'); window.location.href = 'login.html'; }

function showToast(msg, type) {
  let t = document.getElementById('blp-toast');
  if (!t) { t = document.createElement('div'); t.id='blp-toast'; t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;font-size:14px;transition:opacity .4s;pointer-events:none;'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.background = type==='success'?'#27ae60':type==='error'?'#e74c3c':'#2980b9';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.opacity='0'; }, 3000);
}

function setupHamburger() {
  const btn  = document.getElementById('nav-toggle') || document.getElementById('hamburger');
  const menu = document.getElementById('nav-links')  || document.getElementById('nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    menu.classList.toggle('open');
    btn.classList.toggle('open');
  });
  document.addEventListener('click', function(e){
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove('open');
      btn.classList.remove('open');
    }
  });
}

function updateNavAuth() {
  var user = currentUser();
  var nu=document.getElementById('nav-user'), nl=document.getElementById('nav-login'), nr=document.getElementById('nav-register'), nd=document.getElementById('nav-dashboard'), no=document.getElementById('nav-logout'), np=document.getElementById('nav-profile');
  if (user) {
    var adminBadge = isAdmin() ? ' <span style="background:#e63946;color:#fff;font-size:0.65rem;padding:2px 7px;border-radius:10px;font-weight:800;vertical-align:middle;">ADMIN</span>' : '';
    if (nu) { nu.innerHTML='👤 '+user.name+adminBadge; nu.style.display='inline-block'; }
    if (nl) nl.style.display='none';
    if (nr) nr.style.display='none';
    if (nd) nd.style.display='inline-flex';
    if (np) np.style.display='inline-flex';
    if (no) { no.style.display='inline-flex'; no.addEventListener('click', logout); }
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
  setupHamburger();
  updateNavAuth();
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
  }});

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
  // Admin panel
  if (isAdmin()) renderAdminPanel(pending, donors, market);
  // Load emergency requests for admin
  if (isAdmin()) loadEmergencyRequests();
  // Emergency requests count
  try {
    var mktData = await jbGet(BIN_MARKET);
    var reqs = (mktData && mktData.requests) || [];
    var sr = document.getElementById('stat-requests'); if(sr) sr.textContent = reqs.filter(function(r){return r.status!=='fulfilled';}).length;
  } catch(e) {}
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
    var c = d.city || 'Unknown';
    if (!cities[c]) cities[c] = { total: 0, avail: 0 };
    cities[c].total++;
    if (d.available !== 'no') cities[c].avail++;
  });
  var sorted = Object.keys(cities).sort(function(a,b){ return cities[b].total - cities[a].total; });
  if (!sorted.length) { el.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:1rem;grid-column:1/-1;">No data yet</div>'; return; }
  el.innerHTML = sorted.slice(0, 12).map(function(city) {
    var d = cities[city];
    var pct = d.total ? Math.round((d.avail/d.total)*100) : 0;
    var color = pct >= 60 ? '#16a34a' : pct >= 30 ? '#f59e0b' : '#e63946';
    return '<div style="background:#f9fafb;border-radius:10px;padding:0.9rem;text-align:center;border:1.5px solid #f0d0d0;">'
      + '<div style="font-weight:800;font-size:0.88rem;color:#1a1a2e;margin-bottom:4px;">'+city+'</div>'
      + '<div style="font-size:1.4rem;font-weight:900;color:'+color+';">'+d.total+'</div>'
      + '<div style="font-size:0.68rem;color:#9ca3af;font-weight:600;">donors</div>'
      + '<div style="font-size:0.72rem;color:'+color+';font-weight:700;margin-top:4px;">'+d.avail+' available</div>'
      + '<div style="background:#e5e7eb;border-radius:4px;height:4px;margin-top:6px;overflow:hidden;">'
      + '<div style="background:'+color+';height:100%;width:'+pct+'%;border-radius:4px;transition:width 0.8s;"></div>'
      + '</div>'
      + '</div>';
  }).join('');
}

function renderRecentActivity(donors, market) {
  var el=document.getElementById('recent-activity')||document.getElementById('recent-list'); if(!el) return;
  var acts=[];
  donors.slice(-5).forEach(function(d){acts.push({t:new Date(d.date||Date.now()),h:'<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="background:#fef2f2;color:#e74c3c;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:700">DONOR</span> <b>'+d.name+'</b> ('+d.blood+') from '+d.city+'</div>'});});
  market.slice(-5).forEach(function(t){acts.push({t:new Date(t.ts||t.date||Date.now()),h:'<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="background:#f0fdf4;color:#27ae60;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:700">'+t.type.toUpperCase()+'</span> '+(t.qty||1)+' unit(s) <b>'+t.blood+'</b></div>'});});
  acts.sort(function(a,b){return b.t-a.t;});
  el.innerHTML=acts.length?acts.slice(0,8).map(function(a){return a.h;}).join(''):'<p style="text-align:center;color:#999;padding:2rem">No recent activity yet.</p>';
}

// ── ADMIN PANEL ───────────────────────────────────────────
function renderAdminPanel(pending, allDonors, market) {
  var dash = document.querySelector('.dash-body');
  if (!dash) return;
  var existing = document.getElementById('admin-panel');
  if (existing) existing.remove();

  var panel = document.createElement('div');
  panel.id = 'admin-panel';
  panel.style.cssText = 'background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 4px 24px rgba(230,57,70,0.08);border:2px solid #e63946;margin-bottom:2rem;';

  var pendingHTML = pending.length ? pending.map(function(d){
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#fff5f5;border-radius:10px;margin-bottom:8px;flex-wrap:wrap;">'
      +'<div style="flex:1;min-width:180px;"><b>'+d.name+'</b> &nbsp;<span style="background:#e63946;color:#fff;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;">'+d.blood+'</span><br>'
      +'<span style="font-size:0.78rem;color:#6b7280;">📍 '+d.city+' &nbsp;📞 '+d.phone+'</span></div>'
      +'<button onclick="adminApproveDonor('+d.id+')" style="background:#16a34a;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;">✅ Approve</button>'
      +'<button onclick="adminDeleteDonor('+d.id+')" style="background:#e63946;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;">🗑️ Delete</button>'
      +'</div>';
  }).join('') : '<p style="color:#9ca3af;font-size:0.88rem;text-align:center;padding:1rem;">No pending donors</p>';

  var approvedHTML = allDonors.filter(function(d){return d.status!=='pending';}).map(function(d){
    return '<div style="display:flex;align-items:center;gap:12px;padding:8px 10px;background:#f9fafb;border-radius:8px;margin-bottom:6px;flex-wrap:wrap;">'
      +'<div style="flex:1;min-width:180px;"><b>'+d.name+'</b> &nbsp;<span style="background:#e63946;color:#fff;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;">'+d.blood+'</span><br>'
      +'<span style="font-size:0.78rem;color:#6b7280;">📍 '+d.city+' &nbsp;📞 '+d.phone+'</span></div>'
      +'<button onclick="adminDeleteDonor('+d.id+')" style="background:#fee2e2;color:#e63946;border:1.5px solid #fca5a5;padding:5px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">🗑️ Delete</button>'
      +'</div>';
  }).join('') || '<p style="color:#9ca3af;font-size:0.88rem;text-align:center;padding:1rem;">No approved donors</p>';

  panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;">'
    +'<span style="font-size:1.4rem;">🔐</span>'
    +'<h3 style="font-size:1.1rem;font-weight:800;color:#e63946;margin:0;">Admin Control Panel</h3>'
    +'<span style="background:#e63946;color:#fff;padding:3px 10px;border-radius:10px;font-size:0.72rem;font-weight:800;margin-left:auto;">ADMIN ONLY</span>'
    +'</div>'
    // Pending section
    +'<div style="margin-bottom:1.2rem;">'
    +'<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:0.6rem;color:#92400e;">⏳ Pending Approval ('+pending.length+')</h4>'
    +pendingHTML
    +'</div>'
    // All donors section
    +'<div style="margin-bottom:1.2rem;">'
    +'<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:0.6rem;color:#15803d;">✅ Approved Donors ('+allDonors.filter(function(d){return d.status!=='pending';}).length+')</h4>'
    +'<div style="max-height:300px;overflow-y:auto;">'+approvedHTML+'</div>'
    +'</div>'
    // Reports section placeholder
    +'<div id="admin-reports-section">'
    +'<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:0.6rem;color:#7c3aed;">🚩 Donor Reports</h4>'
    +'<div id="admin-reports-list" style="font-size:0.82rem;color:#9ca3af;">Loading reports...</div>'
    +'</div>';

  dash.insertBefore(panel, dash.firstChild);
  // Load reports async
  loadAdminReports();
}

async function adminApproveDonor(id) {
  if (!isAdmin()) { showToast('Access denied.', 'error'); return; }
  var donors = await getDonors();
  var d = donors.find(function(x){return x.id==id;});
  if (!d) return;
  d.status = 'approved';
  await saveDonors(donors);
  showToast('✅ Donor approved!', 'success');
  initDashboard();
}

async function adminDeleteDonor(id) {
  if (!isAdmin()) { showToast('Access denied.', 'error'); return; }
  if (!confirm('Delete this donor?')) return;
  var donors = await getDonors();
  var filtered = donors.filter(function(x){return x.id!=id;});
  await saveDonors(filtered);
  showToast('🗑️ Donor deleted', 'error');
  initDashboard();
}

// ── EMERGENCY REQUESTS (Admin) ────────────────────────────
async function loadEmergencyRequests() {
  try {
    var r = await jbGet(BIN_MARKET);
    var reqs = (r && r.requests) || [];
    var active = reqs.filter(function(x){ return x.status !== 'fulfilled' && (Date.now()-x.ts) < 3600000*24; });
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
        var age = Math.floor((Date.now()-req.ts)/60000);
        var ageStr = age<60?age+' min ago':Math.floor(age/60)+' hr ago';
        return '<div style="background:'+urgColors[req.urgency||'normal']+';border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
          +'<span style="font-size:1rem;">🩸</span>'
          +'<div style="flex:1;min-width:120px;"><div style="font-weight:700;font-size:0.88rem;">'+req.blood+' · '+req.units+' unit(s) · '+req.city+'</div>'
          +'<div style="font-size:0.75rem;color:#6b7280;">'+req.name+' · '+ageStr+'</div></div>'
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
    var r = await jbGet(BIN_MARKET);
    if (!r) return;
    r.requests = (r.requests||[]).map(function(x){ return x.id==id ? Object.assign({},x,{status:'fulfilled'}) : x; });
    await jbPut(BIN_MARKET, r);
    showToast('✅ Request marked as fulfilled','success');
    loadEmergencyRequests();
  } catch(e) {}
}

// ── ADMIN REPORTS ─────────────────────────────────────────
async function loadAdminReports() {
  var el = document.getElementById('admin-reports-list');
  if (!el) return;
  try {
    var r = await jbGet(BIN_MARKET);
    var reports = (r && r.reports) || [];
    if (!reports.length) { el.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:0.8rem;">No reports yet</p>'; return; }
    el.innerHTML = '<div style="max-height:220px;overflow-y:auto;">'
      + reports.slice(0, 20).map(function(rep) {
        var age = Math.floor((Date.now() - rep.ts) / 60000);
        var ageStr = age < 60 ? age + ' min ago' : age < 1440 ? Math.floor(age/60) + ' hr ago' : Math.floor(age/1440) + ' days ago';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#faf5ff;border-radius:8px;margin-bottom:6px;flex-wrap:wrap;">'
          + '<span style="font-size:1rem;">🚩</span>'
          + '<div style="flex:1;min-width:140px;"><div style="font-weight:700;font-size:0.82rem;">'+rep.donorName+'</div>'
          + '<div style="font-size:0.72rem;color:#6b7280;">'+rep.reason+' · '+ageStr+'</div></div>'
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
    var r = await jbGet(BIN_MARKET);
    if (!r) return;
    r.reports = (r.reports || []).filter(function(x) { return x.id != id; });
    await jbPut(BIN_MARKET, r);
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
