// BloodLink Pro — script.js v2 (HackForce / Satish Kumar Nishad)
const API_KEY    = '$2a$10$gnr12wuvoYipciglW9hglOFE5FfQ9q0yU01ZBv8dwhwaNMfUSU.NW';
const BIN_USERS  = '69bc2150aa77b81da9fcb1e3';
const BIN_DONORS = '69bc22a2b7ec241ddc82de74';
const BIN_MARKET = '69bc22a2b7ec241ddc82de79';
const BASE_URL   = 'https://api.jsonbin.io/v3/b';

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
  btn.addEventListener('click', function(e){ e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', function(e){ if (!menu.contains(e.target) && e.target !== btn) menu.classList.remove('open'); });
}

function updateNavAuth() {
  const user = currentUser();
  const nu=document.getElementById('nav-user'), nl=document.getElementById('nav-login'), nr=document.getElementById('nav-register'), nd=document.getElementById('nav-dashboard'), no=document.getElementById('nav-logout');
  if (user) {
    if (nu) { nu.textContent='👤 '+user.name; nu.style.display='inline-block'; }
    if (nl) nl.style.display='none';
    if (nr) nr.style.display='none';
    if (nd) nd.style.display='inline-flex';
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
    var AC=window.AudioContext||window.webkitAudioContext; if (!AC) return;
    var ctx=new AC(), time=ctx.currentTime;
    for (var i=0; i<4; i++) {
      var o1=ctx.createOscillator(), g1=ctx.createGain(); o1.connect(g1); g1.connect(ctx.destination);
      o1.frequency.setValueAtTime(960,time); g1.gain.setValueAtTime(0.6,time); g1.gain.exponentialRampToValueAtTime(0.001,time+0.6); o1.start(time); o1.stop(time+0.6);
      var o2=ctx.createOscillator(), g2=ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination);
      o2.frequency.setValueAtTime(760,time+0.6); g2.gain.setValueAtTime(0.6,time+0.6); g2.gain.exponentialRampToValueAtTime(0.001,time+1.2); o2.start(time+0.6); o2.stop(time+1.2);
      time+=1.2;
    }
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
  var ne=document.getElementById('user-name'); if(ne) ne.textContent=user?user.name:'Guest';
  var lu=document.getElementById('last-updated'); if(lu) lu.textContent='Loading...';
  var donors=await getDonors();
  var mkt=await cloudGetMarket();
  var market=mkt.transactions||[];
  var td=document.getElementById('total-donors');       if(td) td.textContent=donors.length;
  var tt=document.getElementById('total-transactions'); if(tt) tt.textContent=market.length;
  var tu=document.getElementById('total-units');        if(tu) tu.textContent=market.reduce(function(s,t){return s+(parseInt(t.qty)||1);},0);
  var av=document.getElementById('stat-available');     if(av) av.textContent=donors.filter(function(d){return d.available!=='no';}).length;
  if(lu) lu.textContent='Updated: '+new Date().toLocaleTimeString();
  renderDashCharts(donors);
  renderRecentActivity(donors, market);
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

function renderRecentActivity(donors, market) {
  var el=document.getElementById('recent-activity')||document.getElementById('recent-list'); if(!el) return;
  var acts=[];
  donors.slice(-5).forEach(function(d){acts.push({t:new Date(d.date||Date.now()),h:'<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="background:#fef2f2;color:#e74c3c;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:700">DONOR</span> <b>'+d.name+'</b> ('+d.blood+') from '+d.city+'</div>'});});
  market.slice(-5).forEach(function(t){acts.push({t:new Date(t.ts||t.date||Date.now()),h:'<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="background:#f0fdf4;color:#27ae60;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:700">'+t.type.toUpperCase()+'</span> '+(t.qty||1)+' unit(s) <b>'+t.blood+'</b></div>'});});
  acts.sort(function(a,b){return b.t-a.t;});
  el.innerHTML=acts.length?acts.slice(0,8).map(function(a){return a.h;}).join(''):'<p style="text-align:center;color:#999;padding:2rem">No recent activity yet.</p>';
}
