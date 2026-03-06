'use strict';

const FIREBASE_DB   = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const FIREBASE_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts";
const API_KEY       = "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao";

const CAT_NAMES = {
  epist:'ეპისტემოლოგია', ethics:'ეთიკა', logic:'ლოგიკა',
  meta:'მეტაფიზიკა', lang:'ენის ფილოსოფია', anthro:'ანთროპოლოგია',
  aesthetics:'ესთეტიკა', exist:'ეგზისტენციალიზმი', onto:'ონტოლოგია',
  axio:'აქსიოლოგია', histphil:'ფილ. ისტორია', relphil:'რელიგიის ფილ.',
  feminist:'ფემინისტური ფილ.'
};

// ── AUTH CHECK ──
const idToken = localStorage.getItem('idToken');
if (!idToken) { window.location.href = '/'; }

// ── FIREBASE INIT ──
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
// Activate AppCheck (same as main site)
try { firebase.appCheck().activate('6LdepXIsAAAAAGPzEX8XfPPh1mMSeT8ZUod1Z5CC', true); } catch(e) {}

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

// ── TOAST ──
var toastTimer;
function showToast(msg, type) {
  var el = document.getElementById('adm-toast');
  el.textContent = msg;
  el.className = 'show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.className = ''; }, 3000);
}

// ── CONFIRM ──
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

// ── NAV ──
function switchView(name) {
  document.querySelectorAll('.adm-view').forEach(function(v){ v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  document.getElementById('view-' + name).classList.add('active');
  var item = document.querySelector('[data-view="' + name + '"]');
  if (item) item.classList.add('active');
}
document.querySelectorAll('.nav-item').forEach(function(item){
  item.addEventListener('click', function(){ switchView(item.dataset.view); });
});
document.getElementById('dashPendingAllBtn').addEventListener('click', function(){ switchView('pending'); });
document.getElementById('dashNotesAllBtn').addEventListener('click', function(){ switchView('articles'); });

// ── DATE FORMAT ──
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ka-GE', { day:'numeric', month:'short', year:'numeric' });
}

// ── DATA ──
var allNotes = [];
var allPending = [];
var allUsers = {};

async function loadAll() {
  await Promise.all([loadNotes(), loadPending(), loadUsers()]);
  renderDashboard();
}

async function loadNotes() {
  try {
    var res = await fbFetch(FIREBASE_DB + '/notes.json');
    if (!res.ok) return;
    var data = await res.json();
    allNotes = data ? Object.entries(data).map(function(e){ return Object.assign({}, e[1], {fbId:e[0]}); })
      .sort(function(a,b){ return (b.date||0)-(a.date||0); }) : [];
  } catch(e) { allNotes = []; }
}

async function loadPending() {
  try {
    var res = await fbFetch(FIREBASE_DB + '/pending-notes.json?auth=' + idToken);
    if (!res.ok) return;
    var data = await res.json();
    allPending = data ? Object.entries(data).map(function(e){ return Object.assign({}, e[1], {fbId:e[0]}); })
      .sort(function(a,b){ return (b.submittedDate||0)-(a.submittedDate||0); }) : [];
  } catch(e) { allPending = []; }
  var badge = document.getElementById('pendingBadge');
  badge.textContent = allPending.length;
  badge.classList.toggle('show', allPending.length > 0);
}

async function loadUsers() {
  try {
    var res = await fbFetch(FIREBASE_DB + '/users.json?auth=' + idToken);
    if (!res.ok) return;
    var data = await res.json();
    allUsers = data || {};
  } catch(e) { allUsers = {}; }
}

// ── RENDER ──
function renderDashboard() {
  document.getElementById('statTotalNotes').textContent = allNotes.length;
  document.getElementById('statPending').textContent = allPending.length;
  document.getElementById('statUsers').textContent = Object.keys(allUsers).length;

  var dashP = document.getElementById('dashPendingList');
  if (!allPending.length) {
    dashP.innerHTML = '<div class="empty-state">განსახილველი სტატია არ არის ✓</div>';
  } else {
    dashP.innerHTML = allPending.slice(0,3).map(pendingCardHTML).join('');
  }

  renderNotesTable(document.getElementById('dashNotesList'), allNotes.slice(0,5));
  renderNotesTable(document.getElementById('allNotesList'), allNotes);
  renderPendingList(document.getElementById('allPendingList'), allPending);
  renderUsersTable(document.getElementById('usersList'));
}

function pendingCardHTML(n) {
  var cat = CAT_NAMES[n.category] || n.category || '—';
  var author = n.author || n.submitterEmail || 'უცნობი';
  var date = fmtDate(n.submittedDate);
  return '<div class="pending-card">' +
    '<span class="pending-cat-tag">' + cat + '</span>' +
    '<div class="pending-info">' +
      '<div class="pending-title">' + (n.title || 'უსათაურო') + '</div>' +
      '<div class="pending-meta">' + author + ' · ' + date + '</div>' +
    '</div>' +
    '<div class="pending-actions">' +
      '<button class="btn-approve" onclick="approveNote(\'' + n.fbId + '\')">დადასტურება</button>' +
      '<button class="btn-reject" onclick="rejectNote(\'' + n.fbId + '\')">უარყოფა</button>' +
    '</div>' +
  '</div>';
}

function renderPendingList(el, list) {
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">განსახილველი სტატია არ არის ✓</div>';
    return;
  }
  el.innerHTML = list.map(pendingCardHTML).join('');
}

function renderNotesTable(el, notes) {
  if (!notes.length) {
    el.innerHTML = '<div class="empty-state">სტატია არ მოიძებნა</div>';
    return;
  }
  var rows = notes.map(function(n){
    return '<div class="tbl-row">' +
      '<div class="td-title">' + (n.title || 'უსათაურო') + '</div>' +
      '<div class="td-cat">' + (CAT_NAMES[n.category] || n.category || '—') + '</div>' +
      '<div class="td-date">' + fmtDate(n.date) + '</div>' +
      '<div class="td-actions">' +
        '<button class="icon-btn danger" onclick="deleteNote(\'' + n.fbId + '\')" title="წაშლა">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
  el.innerHTML = '<div class="tbl-head">' +
    '<div class="th">სათაური</div>' +
    '<div class="th">კატეგორია</div>' +
    '<div class="th">თარიღი</div>' +
    '<div class="th">წაშლა</div>' +
  '</div>' + rows;
}

function renderUsersTable(el) {
  var users = Object.entries(allUsers);
  if (!users.length) {
    el.innerHTML = '<div class="empty-state">მომხმარებელი არ მოიძებნა</div>';
    return;
  }
  el.innerHTML = users.map(function(entry){
    var uid = entry[0];
    var u = entry[1];
    var name = u.displayName || u.nickname || 'უცნობი';
    var email = u.email || '';
    var photo = u.photoURL || '';
    var initials = name[0] || '◎';
    var isOwner = u.isOwner || u.role === 'owner';
    var isBanned = u.banned;
    var avatarHTML = photo
      ? '<img src="' + photo + '" onerror="this.parentNode.textContent=\'' + initials + '\'">'
      : initials;
    var bannedTag = isBanned ? ' <span class="user-banned-tag">[დაბლოკილი]</span>' : '';
    var actionsHTML = isOwner ? '' :
      '<div class="user-actions">' +
        (isBanned
          ? '<button class="icon-btn" onclick="unbanUser(\'' + uid + '\')" title="განბლოკვა" style="color:#6dde9a">🔓</button>'
          : '<button class="icon-btn danger" onclick="banUser(\'' + uid + '\')" title="დაბლოკვა">🚫</button>') +
        '<button class="icon-btn danger" onclick="deleteUser(\'' + uid + '\')" title="წაშლა">🗑</button>' +
      '</div>';
    return '<div class="user-row">' +
      '<div class="user-avatar">' + avatarHTML + '</div>' +
      '<div><div class="user-name">' + name + bannedTag + '</div><div class="user-email">' + email + '</div></div>' +
      '<span class="user-role-tag ' + (isOwner ? '' : 'member') + '">' + (isOwner ? 'OWNER' : 'MEMBER') + '</span>' +
      actionsHTML +
    '</div>';
  }).join('');
}

// ── ACTIONS ──
async function approveNote(id) {
  var note = allPending.find(function(n){ return n.fbId === id; });
  if (!note) return;
  admConfirm('"' + (note.title||'სტატია') + '" — დაადასტურო?', async function(){
    try {
      var n = Object.assign({}, note);
      delete n.fbId;
      n.date = Date.now();
      var addRes = await fbFetch(FIREBASE_DB + '/notes.json?auth=' + idToken, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(n)
      });
      if (!addRes.ok) throw new Error();
      await fbFetch(FIREBASE_DB + '/pending-notes/' + id + '.json?auth=' + idToken, { method:'DELETE' });
      showToast('სტატია გამოქვეყნდა! ✓', 'success');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function rejectNote(id) {
  var note = allPending.find(function(n){ return n.fbId === id; });
  if (!note) return;
  admConfirm('"' + (note.title||'სტატია') + '" — უარყო?', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/pending-notes/' + id + '.json?auth=' + idToken, { method:'DELETE' });
      showToast('სტატია უარყოფილია', 'error');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function deleteNote(id) {
  var note = allNotes.find(function(n){ return n.fbId === id; });
  admConfirm('"' + (note ? note.title : 'სტატია') + '" — წაიშალოს?', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/notes/' + id + '.json?auth=' + idToken, { method:'DELETE' });
      showToast('სტატია წაიშალა', 'error');
      await loadAll();
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function banUser(uid) {
  admConfirm('მომხმარებელი დაიბლოკება. დარწმუნებული ხარ?', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/users/' + uid + '/banned.json?auth=' + idToken, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:'true'
      });
      showToast('მომხმარებელი დაიბლოკა', 'error');
      await loadUsers();
      renderUsersTable(document.getElementById('usersList'));
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

async function unbanUser(uid) {
  try {
    await fbFetch(FIREBASE_DB + '/users/' + uid + '/banned.json?auth=' + idToken, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:'false'
    });
    showToast('მომხმარებელი განბლოკილია ✓', 'success');
    await loadUsers();
    renderUsersTable(document.getElementById('usersList'));
  } catch(e) { showToast('შეცდომა!', 'error'); }
}

async function deleteUser(uid) {
  admConfirm('მომხმარებელი სამუდამოდ წაიშლება!', async function(){
    try {
      await fbFetch(FIREBASE_DB + '/users/' + uid + '.json?auth=' + idToken, { method:'DELETE' });
      showToast('მომხმარებელი წაიშალა', 'error');
      await loadUsers();
      renderUsersTable(document.getElementById('usersList'));
    } catch(e) { showToast('შეცდომა!', 'error'); }
  });
}

// ── INIT ──
loadAll();
