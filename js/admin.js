'use strict';

// ══════════════════════════════
// CONSTANTS
// ══════════════════════════════
const FIREBASE_DB   = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const API_KEY       = "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao";

const CAT_NAMES = {
  epist:'ეპისტემოლოგია', ethics:'ეთიკა', logic:'ლოგიკა',
  meta:'მეტაფიზიკა', lang:'ენის ფილოსოფია', anthro:'ანთროპოლოგია',
  aesthetics:'ესთეტიკა', exist:'ეგზისტენციალიზმი', onto:'ონტოლოგია',
  axio:'აქსიოლოგია', histphil:'ფილ. ისტორია', relphil:'რელიგიის ფილ.',
  feminist:'ფემინისტური ფილ.'
};

// ══════════════════════════════
// AUTH CHECK
// ══════════════════════════════
const idToken = localStorage.getItem('idToken');
if (!idToken) { window.location.href = '/'; }

// ══════════════════════════════
// FIREBASE INIT
// ══════════════════════════════
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "gen-lang-client-0339684222.firebaseapp.com",
  databaseURL: FIREBASE_DB,
  projectId: "gen-lang-client-0339684222",
  storageBucket: "gen-lang-client-0339684222.firebasestorage.app",
  messagingSenderId: "636166502416",
  appId: "1:636166502416:web:78841eec3ba4c658a07295"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
try { firebase.appCheck().activate('6LdepXIsAAAAAGPzEX8XfPPh1mMSeT8ZUod1Z5CC', true); } catch(e) {}

// ══════════════════════════════
// FETCH HELPERS
// ══════════════════════════════

// Firebase REST — AppCheck token injected
async function fbFetch(url, opts) {
  opts = opts || {};
  try {
    var result = await Promise.race([
      firebase.appCheck().getToken(),
      new Promise(function(_,r){ setTimeout(function(){ r('timeout'); }, 2000); })
    ]);
    opts.headers = Object.assign({}, opts.headers, { 'X-Firebase-AppCheck': result.token });
  } catch(e) {}
  return fetch(url, opts);
}

// Internal API call (ban-user.js etc.)
async function apiPost(endpoint, body) {
  var res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ idToken: idToken }, body))
  });
  return res.json();
}

// ══════════════════════════════
// TOAST
// ══════════════════════════════
var toastTimer;
function showToast(msg, type) {
  var el = document.getElementById('adm-toast');
  el.textContent = msg;
  el.className = 'show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.className = ''; }, 3500);
}

// ══════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════
function admConfirm(msg, onYes) {
  var overlay = document.getElementById('adm-confirm');
  document.getElementById('adm-confirm-msg').textContent = msg;
  overlay.classList.add('show');
  var yes = document.getElementById('adm-confirm-yes');
  var no  = document.getElementById('adm-confirm-no');
  function close() { overlay.classList.remove('show'); }
  yes.onclick = function(){ close(); onYes(); };
  no.onclick = close;
  overlay.onclick = function(e){ if (e.target === overlay) close(); };
}

// ══════════════════════════════
// MOBILE NAV
// ══════════════════════════════
function initMobileNav() {
  var hamburger = document.getElementById('admHamburger');
  var nav       = document.getElementById('admNav');
  var overlay   = document.getElementById('admNavOverlay');

  function openNav() {
    nav.classList.add('open');
    overlay.classList.add('show');
    document.body.classList.add('nav-open');
  }
  function closeNav() {
    nav.classList.remove('open');
    overlay.classList.remove('show');
    document.body.classList.remove('nav-open');
  }

  hamburger.addEventListener('click', function() {
    nav.classList.contains('open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', closeNav);

  // Close nav when a menu item is tapped on mobile
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 700) closeNav();
    });
  });
}

// ══════════════════════════════
// NAV / VIEW SWITCHING
// ══════════════════════════════
function switchView(name) {
  document.querySelectorAll('.adm-view').forEach(function(v){ v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  document.getElementById('view-' + name).classList.add('active');
  var item = document.querySelector('[data-view="' + name + '"]');
  if (item) item.classList.add('active');
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.nav-item').forEach(function(item){
  item.addEventListener('click', function(){ switchView(item.dataset.view); });
});
document.getElementById('dashPendingAllBtn').addEventListener('click', function(){ switchView('pending'); });
document.getElementById('dashNotesAllBtn').addEventListener('click', function(){ switchView('articles'); });

// ══════════════════════════════
// DATE FORMAT
// ══════════════════════════════
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ka-GE', { day:'numeric', month:'short', year:'numeric' });
}

function fmtDateShort(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ka-GE', { day:'numeric', month:'short' });
}

// ══════════════════════════════
// DATA STORE
// ══════════════════════════════
var allNotes   = [];
var allPending = [];
var allUsers   = [];

// ══════════════════════════════
// LOAD ALL
// ══════════════════════════════
async function loadAll() {
  await Promise.all([loadNotes(), loadPending(), loadUsers()]);
  renderDashboard();
}

// ── Notes ──
async function loadNotes() {
  try {
    var res = await fbFetch(FIREBASE_DB + '/notes.json');
    if (!res.ok) return;
    var data = await res.json();
    allNotes = data
      ? Object.entries(data)
          .map(function(e){ return Object.assign({}, e[1], {fbId:e[0]}); })
          .sort(function(a,b){ return (b.date||0)-(a.date||0); })
      : [];
  } catch(e) { allNotes = []; }
}

// ── Pending ──
async function loadPending() {
  try {
    var res = await fbFetch(FIREBASE_DB + '/pending-notes.json?auth=' + idToken);
    if (!res.ok) return;
    var data = await res.json();
    allPending = data
      ? Object.entries(data)
          .map(function(e){ return Object.assign({}, e[1], {fbId:e[0]}); })
          .sort(function(a,b){ return (b.submittedDate||0)-(a.submittedDate||0); })
      : [];
  } catch(e) { allPending = []; }

  var badge = document.getElementById('pendingBadge');
  badge.textContent = allPending.length;
  badge.classList.toggle('show', allPending.length > 0);
}

// ── Users — through ban-user.js API (Service Account access) ──
async function loadUsers() {
  try {
    var data = await apiPost('/api/ban-user', { action: 'list' });
    if (data && data.ok && Array.isArray(data.users)) {
      allUsers = data.users;
    } else {
      allUsers = [];
    }
  } catch(e) {
    allUsers = [];
  }
}

// ══════════════════════════════
// RENDER — DASHBOARD
// ══════════════════════════════
function renderDashboard() {
  document.getElementById('statTotalNotes').textContent = allNotes.length;
  document.getElementById('statPending').textContent    = allPending.length;
  document.getElementById('statUsers').textContent      = allUsers.length;

  // Pending section
  renderPendingList(document.getElementById('dashPendingList'), allPending.slice(0,3));
  renderPendingList(document.getElementById('allPendingList'), allPending);

  // Notes tables
  renderNotesTable(document.getElementById('dashNotesList'), allNotes.slice(0,5));
  renderNotesTable(document.getElementById('allNotesList'), allNotes);

  // Users
  renderUsersTable(document.getElementById('usersList'));
}

// ══════════════════════════════
// RENDER — PENDING CARDS
// ══════════════════════════════
function buildPendingCardHTML(n) {
  var cat    = CAT_NAMES[n.category] || n.category || '—';
  var author = n.author || n.submitterEmail || 'უცნობი';
  var date   = fmtDate(n.submittedDate);
  return '<div class="pending-card">' +
    '<span class="pending-cat-tag">' + escHtml(cat) + '</span>' +
    '<div class="pending-info">' +
      '<div class="pending-title">' + escHtml(n.title || 'უსათაურო') + '</div>' +
      '<div class="pending-meta">' + escHtml(author) + ' · ' + date + '</div>' +
    '</div>' +
    '<div class="pending-actions">' +
      '<button class="btn-approve" data-action="approve" data-id="' + escHtml(n.fbId) + '">დადასტურება</button>' +
      '<button class="btn-reject"  data-action="reject"  data-id="' + escHtml(n.fbId) + '">უარყოფა</button>' +
    '</div>' +
  '</div>';
}

function renderPendingList(el, list) {
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">განსახილველი სტატია არ არის ✓</div>';
    return;
  }
  el.innerHTML = list.map(buildPendingCardHTML).join('');

  // Event delegation — CSP safe, no inline onclick
  el.querySelectorAll('button[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (btn.dataset.action === 'approve') approveNote(btn.dataset.id);
      if (btn.dataset.action === 'reject')  rejectNote(btn.dataset.id);
    });
  });
}

// ══════════════════════════════
// RENDER — NOTES TABLE
// ══════════════════════════════
function renderNotesTable(el, notes) {
  if (!notes.length) {
    el.innerHTML = '<div class="empty-state">სტატია არ მოიძებნა</div>';
    return;
  }
  var rows = notes.map(function(n){
    return '<div class="tbl-row">' +
      '<div class="td-title">' + escHtml(n.title || 'უსათაურო') + '</div>' +
      '<div class="td-cat">'   + escHtml(CAT_NAMES[n.category] || n.category || '—') + '</div>' +
      '<div class="td-date">'  + fmtDateShort(n.date) + '</div>' +
      '<div class="td-actions">' +
        '<button class="icon-btn danger" data-action="delete-note" data-id="' + escHtml(n.fbId) + '" title="წაშლა">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');

  el.innerHTML =
    '<div class="tbl-head">' +
      '<div class="th">სათაური</div>' +
      '<div class="th">კატეგ.</div>' +
      '<div class="th">თარიღი</div>' +
      '<div class="th">წაშ.</div>' +
    '</div>' + rows;

  // Event delegation
  el.querySelectorAll('[data-action="delete-note"]').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteNote(btn.dataset.id); });
  });
}

// ══════════════════════════════
// RENDER — USERS TABLE
// ══════════════════════════════
function renderUsersTable(el) {
  if (!allUsers.length) {
    el.innerHTML = '<div class="empty-state">მომხმარებელი არ მოიძებნა</div>';
    return;
  }

  el.innerHTML = allUsers.map(function(u) {
    var initials = (u.nickname || '◎')[0].toUpperCase();
    var bannedTag  = u.banned
      ? ' <span class="user-banned-tag">· დაბლოკილი</span>'
      : '';
    var banInfo = (u.banned && u.bannedUntil)
      ? '<div class="user-ban-info">ბლოკი: ' + fmtDate(u.bannedUntil) + '-მდე</div>'
      : '';
    var articlesInfo = u.articlesCount
      ? ' · ' + u.articlesCount + ' სტ.'
      : '';
    var joinDate = u.createdAt ? fmtDateShort(u.createdAt) : '';
    var metaStr = (joinDate ? joinDate : '') + articlesInfo;

    var actionsBan = u.banned
      ? '<button class="icon-btn success" data-action="unban" data-uid="' + escHtml(u.uid) + '" title="განბლოკვა">🔓</button>'
      : '<button class="icon-btn danger"  data-action="ban"   data-uid="' + escHtml(u.uid) + '" title="დაბლოკვა">🚫</button>';

    return '<div class="user-row">' +
      '<div class="user-avatar">' + escHtml(initials) + '</div>' +
      '<div class="user-info">' +
        '<div class="user-name">' + escHtml(u.nickname || 'უცნობი') + bannedTag + '</div>' +
        '<div class="user-email">' + escHtml(u.email || '') + '</div>' +
        (metaStr ? '<div class="user-meta">' + escHtml(metaStr) + '</div>' : '') +
        banInfo +
      '</div>' +
      '<span class="user-role-tag member">MEMBER</span>' +
      '<div class="user-actions">' +
        actionsBan +
        '<button class="icon-btn danger" data-action="delete-user" data-uid="' + escHtml(u.uid) + '" title="წაშლა">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');

  // Event delegation — CSP safe
  el.querySelectorAll('button[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var uid = btn.dataset.uid;
      if (btn.dataset.action === 'ban')         banUser(uid);
      if (btn.dataset.action === 'unban')       unbanUser(uid);
      if (btn.dataset.action === 'delete-user') deleteUser(uid);
    });
  });
}

// ══════════════════════════════
// XSS PROTECTION
// ══════════════════════════════
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ══════════════════════════════
// ACTIONS — NOTES
// ══════════════════════════════
async function approveNote(id) {
  var note = allPending.find(function(n){ return n.fbId === id; });
  if (!note) return;
  admConfirm('"' + (note.title || 'სტატია') + '" — დაადასტურო?', async function(){
    try {
      var n = Object.assign({}, note);
      delete n.fbId;
      n.date = Date.now();
      var addRes = await fbFetch(FIREBASE_DB + '/notes.json?auth=' + idToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n)
      });
      if (!addRes.ok) throw new Error('add failed');
      await fbFetch(FIREBASE_DB + '/pending-notes/' + id + '.json?auth=' + idToken, { method: 'DELETE' });

      // Increment author's articlesCount if uid known
      if (note.authorUid) {
        var countRes = await fbFetch(FIREBASE_DB + '/users/' + note.authorUid + '/articlesCount.json?auth=' + idToken);
        var cur = (countRes.ok ? (await countRes.json()) : null) || 0;
        await fbFetch(FIREBASE_DB + '/users/' + note.authorUid + '/articlesCount.json?auth=' + idToken, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cur + 1)
        });
      }

      showToast('სტატია გამოქვეყნდა! ✓', 'success');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function rejectNote(id) {
  var note = allPending.find(function(n){ return n.fbId === id; });
  if (!note) return;
  admConfirm('"' + (note.title || 'სტატია') + '" — უარყო?', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/pending-notes/' + id + '.json?auth=' + idToken, { method: 'DELETE' });
      showToast('სტატია უარყოფილია', 'error');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function deleteNote(id) {
  var note = allNotes.find(function(n){ return n.fbId === id; });
  admConfirm('"' + (note ? note.title : 'სტატია') + '" — სამუდამოდ წაიშალოს?', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/notes/' + id + '.json?auth=' + idToken, { method: 'DELETE' });
      showToast('სტატია წაიშალა', 'error');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

// ══════════════════════════════
// ACTIONS — USERS (via API)
// ══════════════════════════════
async function banUser(uid) {
  var u = allUsers.find(function(x){ return x.uid === uid; });
  admConfirm('"' + (u ? u.nickname : uid) + '" — დაიბლოკება. დარწმუნებული ხარ?', async function(){
    try {
      var data = await apiPost('/api/ban-user', { action: 'ban', targetUid: uid });
      if (data && data.ok) {
        showToast('მომხმარებელი დაიბლოკა 🚫', 'error');
        await loadUsers();
        renderUsersTable(document.getElementById('usersList'));
        renderDashboard();
      } else {
        showToast(data.error || 'შეცდომა!', 'error');
      }
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function unbanUser(uid) {
  var u = allUsers.find(function(x){ return x.uid === uid; });
  admConfirm('"' + (u ? u.nickname : uid) + '" — განბლოკდება. დარწმუნებული ხარ?', async function(){
    try {
      var data = await apiPost('/api/ban-user', { action: 'unban', targetUid: uid });
      if (data && data.ok) {
        showToast('მომხმარებელი განბლოკილია ✓', 'success');
        await loadUsers();
        renderUsersTable(document.getElementById('usersList'));
        renderDashboard();
      } else {
        showToast(data.error || 'შეცდომა!', 'error');
      }
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function deleteUser(uid) {
  var u = allUsers.find(function(x){ return x.uid === uid; });
  admConfirm('"' + (u ? u.nickname : uid) + '" — სამუდამოდ წაიშლება!', async function(){
    try {
      var data = await apiPost('/api/ban-user', { action: 'delete', targetUid: uid });
      if (data && data.ok) {
        showToast('მომხმარებელი წაიშალა', 'error');
        await loadUsers();
        renderUsersTable(document.getElementById('usersList'));
        renderDashboard();
      } else {
        showToast(data.error || 'შეცდომა!', 'error');
      }
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
initMobileNav();
loadAll();
