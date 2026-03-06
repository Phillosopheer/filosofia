// ============================================================
// js/agora.js — ΑΓΟΡΑ ფორუმი (Frontend)
// Session 41
// ============================================================

// ===== state =====
let _agoraListPage    = 1;
let _agoraReplyPage   = 1;
let _agoraTotalPages  = 1;
let _agoraReplyTotal  = 1;
let _agoraCurrentThread = null; // { id, ...threadData }
let _agoraQuotes      = [];     // [{ id, num, author, body }] — ციტატების სია
let _notifData        = [];     // შეტყობინებების cache
let _notifInterval    = null;

// ── Debate state ──────────────────────────────────────────────
let _newThreadType      = 'public';
let _debateOpponentUid  = null;
let _debateOpponentNick = null;
let _debateTimerIds     = [];

// ===== DOM refs (ინიციალიზაციის შემდეგ) =====
let _agoraView, _agoraListView, _agoraThreadView, _agoraTopbarTitle, _agoraBackBtn, _agoraNewBtn;

// ============================================================
// helper: დროის ფორმატი — "2 საათის წინ"
// ============================================================
function agoraTimeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)   return 'ახლა';
  if (m < 60)  return `${m} წუთის წინ`;
  if (h < 24)  return `${h} საათის წინ`;
  if (d < 30)  return `${d} დღის წინ`;
  const date = new Date(ts);
  return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
}

// ============================================================
// helper: user token
// ============================================================
function agoraGetToken() {
  // sync ვერსია — UI-სთვის (hidden/visible ღილაკები)
  if (typeof idToken !== 'undefined' && idToken) return idToken;
  if (typeof userToken !== 'undefined' && userToken) return userToken;
  return localStorage.getItem('idToken') || localStorage.getItem('userToken') || null;
}

// async ვერსია submit-ებისთვის — ამოწმებს expiry-ს და refresh-ავს
async function agoraGetValidToken() {
  // ადმინი: getValidIdToken() refresh-ავს ავტომატურად
  if (typeof idToken !== 'undefined' && idToken) {
    try {
      if (typeof getValidIdToken === 'function') return await getValidIdToken();
    } catch (e) { /* expired/invalid */ }
    return idToken;
  }
  // ჩვეულებრივი user
  let tok = (typeof userToken !== 'undefined' && userToken)
    ? userToken : localStorage.getItem('userToken');
  if (!tok) return null;
  try {
    const p = JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    if ((p.exp * 1000) < Date.now()) {
      const rt = localStorage.getItem('userRefreshToken');
      if (!rt) return tok;
      const FKEY = typeof API_KEY !== 'undefined'
        ? API_KEY : 'AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao';
      const r = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FKEY}`,
        { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:`grant_type=refresh_token&refresh_token=${encodeURIComponent(rt)}` }
      );
      const d = await r.json();
      if (r.ok && d.id_token) {
        if (typeof userToken !== 'undefined') userToken = d.id_token;
        localStorage.setItem('userToken', d.id_token);
        if (d.refresh_token) localStorage.setItem('userRefreshToken', d.refresh_token);
        return d.id_token;
      }
    }
  } catch (e) { /* ignore */ }
  return tok;
}

function agoraGetUser() {
  // ჩვეულებრივი user
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  // ადმინი — currentUser null-ია, მაგრამ idToken გვაქვს
  if (typeof idToken !== 'undefined' && idToken) {
    return {
      uid:      'bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2',
      nickname: localStorage.getItem('adminDisplayName') || 'ნოდარ კებაძე',
      photoURL: localStorage.getItem('adminPhoto') || null
    };
  }
  return null;
}

function agoraIsAdmin() {
  if (typeof idToken !== 'undefined' && idToken) return true;
  return false;
}

// ============================================================
// helper: XSS-ის თავიდან აცილება
// ============================================================
function agoraEscape(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ============================================================
// helper: error div
// ============================================================
function agoraShowError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('active');
}
function agoraClearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('active');
}

// ============================================================
// API call
// ============================================================
async function agoraFetch(data) {
  const res  = await fetch('/api/agora', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, data: json };
}

// ============================================================
// აგორას გახსნა / დახურვა
// ============================================================
function openAgora() {
  _agoraView = document.getElementById('agoraView');
  _agoraView.classList.add('active');
  document.body.style.overflow = 'hidden';
  agoraInitSearch();
  agoraShowList(1);
}

function closeAgora() {
  const view = document.getElementById('agoraView');
  if (view) view.classList.remove('active');
  document.body.style.overflow = '';
  _agoraCurrentThread = null;
}

// ============================================================
// thread list გვერდი
// ============================================================
async function agoraShowList(page) {
  _agoraCurrentThread = null;

  const listView   = document.getElementById('agoraListView');
  const threadView = document.getElementById('agoraThreadView');
  const topTitle   = document.getElementById('agoraTopbarTitle');
  const backBtn    = document.getElementById('agoraBackBtn');
  const newBtn     = document.getElementById('agoraNewBtn');

  listView.style.display   = 'block';
  threadView.style.display = 'none';
  topTitle.innerHTML = '🏛 ა გ ო რ ა';
  backBtn.classList.add('hidden');

  // ახალი თემა — მხოლოდ logged-in user-ებს
  const canCreate = !!(agoraGetToken() || agoraIsAdmin());
  if (newBtn) {
    newBtn.classList.toggle('hidden', !canCreate);
  }

  // admin — დაბლოკილების ღილაკი
  const existingBanBtn = document.getElementById('agoraBannedBtn');
  if (existingBanBtn) existingBanBtn.remove();
  if (agoraIsAdmin()) {
    const banListBtn = document.createElement('button');
    banListBtn.id = 'agoraBannedBtn';
    banListBtn.className = 'agora-banned-btn';
    banListBtn.textContent = '🚫 დაბლოკილები';
    banListBtn.addEventListener('click', agoraOpenBannedPanel);
    const topbar = document.querySelector('.agora-topbar-row');
    if (topbar) topbar.appendChild(banListBtn);
  }

  // განმარტება — სტატიკური, ერთხელ ჩნდება
  const descEl = document.getElementById('agoraDescription');
  if (descEl) {
    descEl.style.display = page === 1 ? 'block' : 'none';
  }

  const listEl = document.getElementById('agoraThreadList');
  listEl.innerHTML = '<div class="agora-loading">იტვირთება</div>';

  try {
    const { ok, data } = await agoraFetch({ action: 'get-threads', page });
    if (!ok) throw new Error(data.error || 'შეცდომა');

    _agoraListPage   = data.page;
    _agoraTotalPages = data.totalPages;

    if (!data.threads || data.threads.length === 0) {
      listEl.innerHTML = `
        <div class="agora-empty">
          <div class="agora-empty-icon">🏛</div>
          <div class="agora-empty-text">პირველი იყავი — გახსენი თემა</div>
        </div>`;
      document.getElementById('agoraListPagination').innerHTML = '';
      return;
    }

    listEl.innerHTML = data.threads.map(t => agoraThreadCard(t)).join('');

    // event listeners — click on thread card
    listEl.querySelectorAll('.agora-thread-item').forEach(el => {
      el.addEventListener('click', function() {
        agoraOpenThread(this.dataset.id);
      });
    });

    // pagination
    agoraRenderPagination(
      'agoraListPagination',
      data.page,
      data.totalPages,
      p => agoraShowList(p)
    );

  } catch (e) {
    listEl.innerHTML = `<div class="agora-empty"><div class="agora-empty-text">❌ ${agoraEscape(e.message)}</div></div>`;
  }
}

// ============================================================
// thread card HTML
// ============================================================
function agoraThreadCard(t) {
  const locked  = t.status === 'locked';
  const pinned  = t.pinned;
  const isDebate = t.type === 'debate';
  const classes = ['agora-thread-item',
    locked ? 'agora-thread-locked' : '',
    pinned ? 'pinned' : ''
  ].filter(Boolean).join(' ');

  let badgeHtml = '';
  if (isDebate) {
    const ds = t.debateStatus;
    const bStyle = {
      pending:   'color:var(--gold);border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06);animation:pulse 2s ease infinite;',
      active:    'color:#f87171;border-color:rgba(248,113,113,0.5);background:rgba(248,113,113,0.06);animation:pulse 1.5s ease infinite;',
      finished:  'color:var(--text-dim);border-color:var(--border);opacity:0.7;',
      cancelled: 'color:var(--text-dim);border-color:var(--border);opacity:0.5;'
    }[ds] || 'color:var(--gold);border-color:rgba(201,168,76,0.3);';
    const bLabel = { pending:'⚔ მოლოდინი', active:'⚔ პირდაპირი', finished:'⚔ დასრულდა', cancelled:'⚔ გაუქმდა' }[ds] || '⚔';
    badgeHtml = `<span style="font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:1.5px;padding:3px 8px;border:1px solid;white-space:nowrap;flex-shrink:0;${bStyle}">${bLabel}</span>`;
  }

  return `
    <div class="${classes}" data-id="${agoraEscape(t.id)}" style="display:flex;align-items:center;gap:12px;">
      ${badgeHtml}
      <div style="flex:1;min-width:0;">
        ${pinned ? '<div class="agora-thread-pin">📌 PINNED</div>' : ''}
        <div class="agora-thread-title">${agoraEscape(t.title)}</div>
        <div class="agora-thread-meta">
          <div class="agora-thread-author">
            <span>${agoraEscape(t.authorName)}</span>
            <span>·</span>
            <span>${agoraTimeAgo(t.createdAt)}</span>
            ${isDebate && t.opponentNickname ? `<span>·</span><span style="color:var(--gold-dim)">vs ${agoraEscape(t.opponentNickname)}</span>` : ''}
          </div>
          ${!isDebate ? `<div class="agora-thread-replies">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>${t.replyCount || 0}</span>
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

// ============================================================
// thread detail view
// ============================================================
async function agoraOpenThread(threadId) {
  const listView   = document.getElementById('agoraListView');
  const threadView = document.getElementById('agoraThreadView');
  const topTitle   = document.getElementById('agoraTopbarTitle');
  const backBtn    = document.getElementById('agoraBackBtn');
  const newBtn     = document.getElementById('agoraNewBtn');

  listView.style.display   = 'none';
  threadView.style.display = 'block';
  backBtn.classList.remove('hidden');
  if (newBtn) newBtn.classList.add('hidden');

  const contentEl  = document.getElementById('agoraThreadContent');
  const repliesEl  = document.getElementById('agoraReplies');
  const paginEl    = document.getElementById('agoraRepliesPagination');
  const replyFEl   = document.getElementById('agoraReplyFormWrap');
  contentEl.innerHTML  = '<div class="agora-loading">იტვირთება</div>';
  repliesEl.innerHTML  = '';
  paginEl.innerHTML    = '';
  if (replyFEl) replyFEl.innerHTML = '';

  try {
    const { ok, data } = await agoraFetch({ action: 'get-thread', threadId });
    if (!ok) throw new Error(data.error || 'შეცდომა');

    _agoraCurrentThread = data.thread;
    topTitle.innerHTML = '🏛 ა გ ო რ ა';

    // thread header
    contentEl.innerHTML = agoraThreadHeader(data.thread);

    // action buttons on thread (edit/delete)
    const actionsEl = contentEl.querySelector('.agora-thread-actions');
    if (actionsEl) agoraBindThreadActions(actionsEl, data.thread);

    // user card triggers on thread header
    agoraBindUserCardTriggers(contentEl);

    // DEBATE type — debate UI
    if (data.thread.type === 'debate') {
      _debateTimerIds.forEach(id => clearInterval(id));
      _debateTimerIds = [];
      const debRes = await agoraFetch({ action: 'get-debate', threadId });
      if (debRes.ok && debRes.data.debate) {
        repliesEl.innerHTML = '';
        paginEl.innerHTML   = '';
        if (replyFEl) replyFEl.innerHTML = '';
        const debate = debRes.data.debate;
        // fetch both players' photos from Firebase
        const photoMap = {};
        try {
          const [aRes, oRes] = await Promise.all([
            fbFetch(`${FIREBASE_DB}/users/${debate.authorUid}/photoURL.json`),
            fbFetch(`${FIREBASE_DB}/users/${debate.opponentUid}/photoURL.json`)
          ]);
          if (aRes.ok) { const p = await aRes.json(); if (p) photoMap[debate.authorUid] = p; }
          if (oRes.ok) { const p = await oRes.json(); if (p) photoMap[debate.opponentUid] = p; }
        } catch(e) { /* ფოტო ვერ ჩაიტვირთა — initials გამოჩნდება */ }
        agoraRenderDebateView(data.thread, debate, repliesEl, photoMap);
      } else {
        repliesEl.innerHTML = `<div class="agora-empty"><div class="agora-empty-text">⚔️ დებატის მონაცემი ვერ ჩაიტვირთა</div></div>`;
      }
      return;
    }

    // replies
    _agoraReplyPage  = data.replies.page;
    _agoraReplyTotal = data.replies.totalPages;
    agoraRenderReplies(repliesEl, data.replies.items, data.replies);

    // pagination
    agoraRenderPagination('agoraRepliesPagination', data.replies.page, data.replies.totalPages, p => {
      agoraLoadReplyPage(threadId, p);
    });

    // reply form
    agoraRenderReplyForm(replyFEl, data.thread);

  } catch (e) {
    contentEl.innerHTML = `<div class="agora-empty"><div class="agora-empty-text">❌ ${agoraEscape(e.message)}</div></div>`;
  }
}

// ============================================================
// thread header HTML
// ============================================================
function agoraThreadHeader(t) {
  const user   = agoraGetUser();
  const isMe   = user && user.uid === t.authorUid;
  const isAdm  = agoraIsAdmin();
  const canAct = isMe || isAdm;
  const inWin  = (Date.now() - t.createdAt) < 3600000;
  const canEdit = canAct && (isAdm || inWin);

  const avatarHtml = t.authorAvatar
    ? `<img class="agora-author-avatar agora-user-card-trigger" data-uid="${agoraEscape(t.authorUid||'')}" src="${agoraEscape(t.authorAvatar)}" alt="" loading="lazy">`
    : `<div class="agora-author-avatar agora-author-avatar-placeholder agora-user-card-trigger" data-uid="${agoraEscape(t.authorUid||'')}">${agoraEscape((t.authorName||'?')[0].toUpperCase())}</div>`;

  return `
    <div class="agora-thread-header">
      <div class="agora-thread-header-title">${agoraEscape(t.title)}</div>
      <div class="agora-thread-header-meta">
        ${avatarHtml}
        <span class="agora-reply-author agora-user-card-trigger" data-uid="${agoraEscape(t.authorUid||'')}">${agoraEscape(t.authorName)}</span>
        <span>·</span>
        <span>${agoraTimeAgo(t.createdAt)}</span>
        ${t.editedAt ? `<span class="agora-edited-tag">(რედ. ${agoraTimeAgo(t.editedAt)})</span>` : ''}
        ${t.status === 'locked' ? '<span>· 🔒 დახურულია</span>' : ''}
      </div>
      <div class="agora-thread-header-body" id="threadBodyDisplay">${agoraEscape(t.body)}</div>
      ${canEdit ? `
        <div class="agora-item-actions agora-thread-actions" data-thread-id="${agoraEscape(t.id)}">
          <button class="agora-action-btn" data-act="edit-thread">✏️ რედაქტირება</button>
          <button class="agora-action-btn danger" data-act="delete-thread">🗑 წაშლა</button>
        </div>
      ` : ''}
    </div>`;
}

// ============================================================
// thread action buttons binding
// ============================================================
function agoraBindThreadActions(actionsEl, thread) {
  const editBtn   = actionsEl.querySelector('[data-act="edit-thread"]');
  const deleteBtn = actionsEl.querySelector('[data-act="delete-thread"]');

  if (editBtn) {
    editBtn.addEventListener('click', function() {
      agoraOpenEditModal({
        type: 'thread',
        id: thread.id,
        title: thread.title,
        body: thread.body
      });
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      showConfirmToast('დარწმუნებული ხარ რომ გსურს ამ თემის წაშლა?', async function() {
        await agoraDeleteThread(thread.id);
      });
    });
  }


}

// ============================================================
// replies render
// ============================================================
function agoraRenderReplies(container, items, paginData) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="agora-replies-divider">კომენტარები</div>
      <div class="agora-empty" style="padding:24px">
        <div class="agora-empty-text">კომენტარები არ არის — იყავი პირველი</div>
      </div>`;
    return;
  }

  // კომენტარის ნომერი — გვერდის მიხედვით
  const offset = ((_agoraReplyPage - 1) * 20);

  const repliesHTML = items.map((r, i) => agoraReplyCard(r, offset + i + 1)).join('');
  container.innerHTML = `
    <div class="agora-replies-divider">კომენტარები — ${paginData.total}</div>
    ${repliesHTML}`;

  // action buttons
  container.querySelectorAll('.agora-reply-item').forEach(el => {
    agoraBindReplyActions(el);
  });

  // user card triggers
  agoraBindUserCardTriggers(container);
}

// ============================================================
// reply card HTML
// ============================================================
function agoraReplyCard(r, num) {
  const user   = agoraGetUser();
  const isMe   = user && user.uid === r.authorUid;
  const isAdm  = agoraIsAdmin();
  const canAct = isMe || isAdm;
  const inWin  = (Date.now() - r.createdAt) < 3600000;
  const canEdit = canAct && (isAdm || inWin);

  // avatar
  const avatarHtml = r.authorAvatar
    ? `<img class="agora-author-avatar agora-user-card-trigger" data-uid="${agoraEscape(r.authorUid||'')}" src="${agoraEscape(r.authorAvatar)}" alt="" loading="lazy">`
    : `<div class="agora-author-avatar agora-author-avatar-placeholder agora-user-card-trigger" data-uid="${agoraEscape(r.authorUid||'')}">${agoraEscape((r.authorName||'?')[0].toUpperCase())}</div>`;

  // quote blocks — ახალი array ან ძველი single quote (backward compat)
  let quoteHtml = '';
  if (r.quotes && r.quotes.length > 0) {
    quoteHtml = r.quotes.map(q => `
      <div class="agora-quote-block">
        <div class="agora-quote-author">↩ ${agoraEscape(q.author || '?')} ${q.num ? `<span>#${q.num}</span>` : ''}</div>
        <div class="agora-quote-body">${agoraEscape(q.body.length > 150 ? q.body.substring(0,150)+'…' : q.body)}</div>
      </div>`).join('');
  } else if (r.quotedBody) {
    quoteHtml = `<div class="agora-quote-block">
        <div class="agora-quote-author">↩ ${agoraEscape(r.quotedAuthor || '?')} ${r.quotedNum ? `<span>#${r.quotedNum}</span>` : ''}</div>
        <div class="agora-quote-body">${agoraEscape(r.quotedBody.length > 150 ? r.quotedBody.substring(0,150)+'…' : r.quotedBody)}</div>
      </div>`;
  }

  // quote button — ჩანს logged-in user-ებს
  const canReply = !!(agoraGetToken() || agoraIsAdmin());
  const quoteBtnHtml = canReply
    ? `<button class="agora-action-btn agora-quote-btn" data-act="quote-reply" title="ციტირება">↩ ციტირება</button>`
    : '';

  return `
    <div class="agora-reply-item" data-reply-id="${agoraEscape(r.id)}" data-reply-num="${num}" data-reply-author="${agoraEscape(r.authorName)}" data-reply-body="${agoraEscape((r.body||'').substring(0,200))}">
      <div class="agora-reply-meta">
        <span class="agora-reply-num">#${num}</span>
        ${avatarHtml}
        <span class="agora-reply-author agora-user-card-trigger" data-uid="${agoraEscape(r.authorUid||'')}">${agoraEscape(r.authorName)}</span>
        <span>·</span>
        <span>${agoraTimeAgo(r.createdAt)}</span>
        ${r.editedAt ? `<span class="agora-edited-tag">(რედ. ${agoraTimeAgo(r.editedAt)})</span>` : ''}
      </div>
      ${quoteHtml}
      <div class="agora-reply-body" id="replyBody_${agoraEscape(r.id)}">${agoraEscape(r.body)}</div>
      <div class="agora-item-actions" style="margin-top:8px">
        ${quoteBtnHtml}
        ${canEdit ? `
          <button class="agora-action-btn" data-act="edit-reply">✏️</button>
          <button class="agora-action-btn danger" data-act="delete-reply">🗑</button>
        ` : ''}
      </div>

    </div>`;
}

// ============================================================
// reply action binding
// ============================================================
function agoraBindReplyActions(el) {
  const replyId  = el.dataset.replyId;
  const editBtn  = el.querySelector('[data-act="edit-reply"]');
  const delBtn   = el.querySelector('[data-act="delete-reply"]');
  const quoteBtn = el.querySelector('[data-act="quote-reply"]');
  const saveBtn  = el.querySelector('.reply-save-btn');
  const cancelBtn = el.querySelector('.reply-cancel-btn');
  const editDiv  = document.getElementById(`replyEdit_${replyId}`);
  const bodyDiv  = document.getElementById(`replyBody_${replyId}`);

  // ── ციტირება ──
  if (quoteBtn) {
    quoteBtn.addEventListener('click', function() {
      const num    = parseInt(el.dataset.replyNum) || '';
      const author = el.dataset.replyAuthor || '';

      // მობაილზე მონიშნული ტექსტი — პრიორიტეტი
      let body = '';
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        // შევამოწმოთ selection ამ reply-ში არის
        let anchor = sel.anchorNode;
        let inThis = false;
        while (anchor) {
          if (anchor === el) { inThis = true; break; }
          anchor = anchor.parentElement;
        }
        if (inThis) body = sel.toString().trim();
      }
      // fallback — მთელი body (data attribute)
      if (!body) body = el.dataset.replyBody || '';

      agoraAddQuote({ id: replyId, num, author, body });
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', function() {
      if (!_agoraCurrentThread) return;
      agoraOpenEditModal({
        type: 'reply',
        threadId: _agoraCurrentThread.id,
        id: replyId,
        body: bodyDiv ? bodyDiv.textContent : ''
      });
    });
  }

  if (delBtn) {
    delBtn.addEventListener('click', function() {
      showConfirmToast('კომენტარი წაიშლება. დარწმუნებული ხარ?', async function() {
        if (!_agoraCurrentThread) return;
        await agoraDeleteReply(_agoraCurrentThread.id, replyId);
      });
    });
  }


}

// ============================================================
// reply form render
// ============================================================
function agoraRenderReplyForm(container, thread) {
  if (!container) return;

  const token = agoraGetToken();
  const isAdm = agoraIsAdmin();

  if (thread.status === 'locked') {
    container.innerHTML = `<div class="agora-locked-notice">🔒 ეს თემა დახურულია</div>`;
    return;
  }

  if (!token && !isAdm) {
    container.innerHTML = `
      <div class="agora-reply-form">
        <div class="agora-login-notice">
          კომენტარის დასაწერად <span id="agoraLoginLink">შედი ანგარიშში</span>
        </div>
      </div>`;
    const link = container.querySelector('#agoraLoginLink');
    if (link) {
      link.addEventListener('click', function() {
        closeAgora();
        openModal('loginModal');
        switchAuthTab('login');
      });
    }
    return;
  }

  container.innerHTML = `
    <div class="agora-reply-form">
      <div class="agora-reply-form-title">შენი პასუხი</div>
      <div class="agora-error" id="replyError"></div>
      <div id="agoraQuoteStack" class="agora-quote-stack"></div>
      <textarea class="agora-textarea" id="replyTextarea" placeholder="დაწერე კომენტარი..."></textarea>
      <div class="agora-char-count"><span id="replyCharCount">0</span> / 50000</div>
      <button class="agora-reply-submit" id="replySubmitBtn">გამოქვეყნება ↑</button>
    </div>`;

  const ta      = container.querySelector('#replyTextarea');
  const countEl = container.querySelector('#replyCharCount');
  const btn     = container.querySelector('#replySubmitBtn');

  // ციტატების stack-ის გამოტანა
  agoraUpdateQuoteStack();

  ta.addEventListener('input', function() {
    countEl.textContent = ta.value.length;
  });

  // 📱 კლავიატურა ჩნდება — textarea-ს scroll into view
  ta.addEventListener('focus', function() {
    setTimeout(() => {
      ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  });


  btn.addEventListener('click', async function() {
    await agoraSubmitReply(thread.id, ta, btn);
  });

  ta.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      agoraSubmitReply(thread.id, ta, btn);
    }
  });
}

// ============================================================
// quote stack management
// ============================================================
function agoraAddQuote(q) {
  // duplicate check — იგივე reply-ი უკვე დამატებული?
  if (_agoraQuotes.some(x => x.id === q.id && x.body === q.body)) {
    showToast('ეს ციტატა უკვე დამატებულია', 'info');
    return;
  }
  _agoraQuotes.push(q);
  agoraUpdateQuoteStack();
  // scroll to form + focus
  const form = document.getElementById('agoraReplyFormWrap');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const ta = document.getElementById('replyTextarea');
  if (ta) setTimeout(() => ta.focus(), 350);
}

function agoraRemoveQuote(index) {
  _agoraQuotes.splice(index, 1);
  agoraUpdateQuoteStack();
}

function agoraUpdateQuoteStack() {
  const stack = document.getElementById('agoraQuoteStack');
  if (!stack) return;

  if (!_agoraQuotes.length) {
    stack.innerHTML = '';
    return;
  }

  stack.innerHTML = _agoraQuotes.map((q, i) => {
    const snippet = q.body.length > 120 ? q.body.substring(0, 120) + '…' : q.body;
    return `<div class="agora-quote-stack-item" data-qindex="${i}">
      <div class="agora-quote-stack-meta">↩ <strong>${agoraEscape(q.author)}</strong>${q.num ? ` <span>#${q.num}</span>` : ''}</div>
      <div class="agora-quote-stack-body">${agoraEscape(snippet)}</div>
      <button class="agora-quote-stack-remove" data-qindex="${i}" title="ციტატის წაშლა">✕</button>
    </div>`;
  }).join('');

  stack.querySelectorAll('.agora-quote-stack-remove').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      agoraRemoveQuote(parseInt(this.dataset.qindex));
    });
  });
}

// ============================================================
// პაგინაცია
// ============================================================
function agoraRenderPagination(containerId, page, totalPages, onPageClick) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';

  // ← წინა
  html += `<button class="agora-page-btn" data-page="${page-1}" ${page <= 1 ? 'disabled' : ''}>←</button>`;

  // გვერდების ღილაკები (max 7 ჩანს)
  const pages = agoraPageRange(page, totalPages);
  for (const p of pages) {
    if (p === '...') {
      html += `<span class="agora-page-btn" style="border:none;cursor:default;opacity:0.4">…</span>`;
    } else {
      html += `<button class="agora-page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  }

  // → შემდეგი
  html += `<button class="agora-page-btn" data-page="${page+1}" ${page >= totalPages ? 'disabled' : ''}>→</button>`;

  el.innerHTML = html;

  el.querySelectorAll('.agora-page-btn[data-page]').forEach(btn => {
    if (!btn.disabled && btn.dataset.page) {
      btn.addEventListener('click', function() {
        onPageClick(parseInt(this.dataset.page));
        // scroll up
        document.getElementById('agoraView')?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
}

function agoraPageRange(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', current-1, current, current+1, '...', total];
}

// ============================================================
// reply page load (pagination)
// ============================================================
async function agoraLoadReplyPage(threadId, page) {
  const repliesEl = document.getElementById('agoraReplies');
  repliesEl.innerHTML = '<div class="agora-loading">იტვირთება</div>';

  try {
    const { ok, data } = await agoraFetch({ action: 'get-replies', threadId, page });
    if (!ok) throw new Error(data.error || 'შეცდომა');

    _agoraReplyPage  = data.page;
    _agoraReplyTotal = data.totalPages;

    agoraRenderReplies(repliesEl, data.items, data);
    agoraRenderPagination('agoraRepliesPagination', data.page, data.totalPages, p => {
      agoraLoadReplyPage(threadId, p);
    });
  } catch (e) {
    repliesEl.innerHTML = `<div class="agora-empty"><div class="agora-empty-text">❌ ${agoraEscape(e.message)}</div></div>`;
  }
}

// ============================================================
// ახალი thread-ის modal
// ============================================================
function agoraOpenNewThreadModal() {
  const token = agoraGetToken();
  const isAdm = agoraIsAdmin();
  if (!token && !isAdm) {
    showToast('ახალი თემის გასახსნელად შედი ანგარიშში', 'info');
    return;
  }

  // reset state
  _newThreadType      = 'public';
  _debateOpponentUid  = null;
  _debateOpponentNick = null;

  // reset fields
  const titleEl   = document.getElementById('newThreadTitle');
  const bodyEl    = document.getElementById('newThreadBody');
  const errEl     = document.getElementById('newThreadError');
  const oppWrap   = document.getElementById('debateOpponentWrap');
  const oppInput  = document.getElementById('debateOpponentInput');
  const oppStatus = document.getElementById('debateOpponentStatus');
  const oppFound  = document.getElementById('debateOpponentFound');
  const submitBtn = document.getElementById('newThreadSubmitBtn');
  const btnPub    = document.getElementById('typeBtnPublic');
  const btnDeb    = document.getElementById('typeBtnDebate');

  if (titleEl)   titleEl.value = '';
  if (bodyEl)    bodyEl.value  = '';
  if (errEl)     { errEl.textContent = ''; errEl.classList.remove('active'); }
  if (oppWrap)   oppWrap.style.display = 'none';
  if (oppInput)  oppInput.value = '';
  if (oppStatus) { oppStatus.textContent = ''; oppStatus.style.color = ''; }
  if (oppFound)  { oppFound.style.display = 'none'; oppFound.textContent = ''; }
  if (submitBtn) submitBtn.textContent = 'გამოქვეყნება';

  const activeStyle   = 'border:1px solid var(--gold);background:rgba(201,168,76,0.12);color:var(--gold);font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:1.5px;padding:8px 16px;cursor:pointer;';
  const inactiveStyle = 'border:1px solid rgba(201,168,76,0.25);background:none;color:var(--text-dim);font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:1.5px;padding:8px 16px;cursor:pointer;';

  if (btnPub) btnPub.style.cssText = activeStyle;
  if (btnDeb) btnDeb.style.cssText = inactiveStyle;

  if (btnPub && !btnPub.dataset.ntBound) {
    btnPub.dataset.ntBound = '1';
    btnPub.addEventListener('click', function() {
      _newThreadType = 'public';
      if (oppWrap)   oppWrap.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'გამოქვეყნება';
      btnPub.style.cssText = activeStyle;
      if (btnDeb) btnDeb.style.cssText = inactiveStyle;
    });
  }
  if (btnDeb && !btnDeb.dataset.ntBound) {
    btnDeb.dataset.ntBound = '1';
    btnDeb.addEventListener('click', function() {
      _newThreadType = 'debate';
      if (oppWrap)   oppWrap.style.display = 'block';
      if (submitBtn) submitBtn.textContent = '⚔ გამოწვევის გაგზავნა';
      btnDeb.style.cssText = activeStyle;
      if (btnPub) btnPub.style.cssText = inactiveStyle;
    });
  }

  // opponent search
  if (oppInput && !oppInput.dataset.ntBound) {
    oppInput.dataset.ntBound = '1';
    let _oppTimer = null;
    oppInput.addEventListener('input', function() {
      const q = this.value.trim();
      _debateOpponentUid  = null;
      _debateOpponentNick = null;
      if (oppStatus) { oppStatus.textContent = ''; }
      if (oppFound)  { oppFound.style.display = 'none'; }
      clearTimeout(_oppTimer);
      if (!q || q.length < 2) return;
      _oppTimer = setTimeout(async () => {
        if (oppStatus) oppStatus.textContent = '⏳';
        try {
          const tok = await agoraGetValidToken();
          const { ok, data } = await agoraFetch({ action: 'find-user', nickname: q, userToken: tok });
          if (ok && data.user) {
            _debateOpponentUid  = data.user.uid;
            _debateOpponentNick = data.user.nickname;
            if (oppStatus) { oppStatus.textContent = '✓'; oppStatus.style.color = '#c9a84c'; }
            if (oppFound) {
              oppFound.textContent    = `✓ ${data.user.nickname}`;
              oppFound.style.color    = '#c9a84c';
              oppFound.style.display  = 'block';
            }
          } else {
            _debateOpponentUid = null;
            if (oppStatus) { oppStatus.textContent = '✗'; oppStatus.style.color = '#f87171'; }
            if (oppFound) {
              oppFound.textContent   = 'მომხმარებელი ვერ მოიძებნა';
              oppFound.style.color   = '#f87171';
              oppFound.style.display = 'block';
            }
          }
        } catch { if (oppStatus) oppStatus.textContent = ''; }
      }, 400);
    });
  }

  openModal('newThreadModal');
  setTimeout(() => {
    titleEl?.focus();
    const titleCountEl = document.getElementById('titleCharCount');
    if (titleEl && titleCountEl && !titleEl.dataset.ntBound) {
      titleEl.dataset.ntBound = '1';
      titleEl.addEventListener('input', function() {
        titleCountEl.textContent = `${this.value.length} / 80`;
        titleCountEl.style.color = this.value.length > 70 ? '#e53e3e' : 'var(--text-dim)';
      });
    }
  }, 100);
}

async function agoraSubmitNewThread() {
  const title    = document.getElementById('newThreadTitle')?.value.trim();
  const body     = document.getElementById('newThreadBody')?.value.trim();
  const btn      = document.getElementById('newThreadSubmitBtn');

  agoraClearError('newThreadError');

  if (!title || title.length < 5) { agoraShowError('newThreadError', 'სათაური მინ. 5 სიმბოლო'); return; }
  if (!body  || body.length  < 10) { agoraShowError('newThreadError', 'შინაარსი მინ. 10 სიმბოლო'); return; }

  // ── DEBATE ──────────────────────────────────────────────────
  if (_newThreadType === 'debate') {
    if (!_debateOpponentUid) {
      agoraShowError('newThreadError', 'ოპონენტი ვერ მოიძებნა — შეამოწმე nickname');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'AI ამოწმებს...';
    try {
      const token        = await agoraGetValidToken();
      const user         = agoraGetUser();
      const authorName   = user?.nickname || localStorage.getItem('userNickname') || 'მომხმარებელი';
      const authorAvatar = user?.photoURL || null;

      const { ok, data } = await agoraFetch({
        action:      'create-debate',
        title, threadBody: body,
        opponentUid: _debateOpponentUid,
        userToken:   token, authorName, authorAvatar
      });

      if (!ok) {
        if (data.warned) {
          agoraShowWarningToast(data.message, data.banned, data.quote || '');
          if (data.banned) closeModal('newThreadModal');
        } else {
          agoraShowError('newThreadError', data.quote ? `${data.error}\n\n❝ "${data.quote}"` : (data.error || 'შეცდომა'));
        }
        return;
      }
      closeModal('newThreadModal');
      showToast('⚔️ გამოწვევა გაიგზავნა!', 'success');
      agoraOpenThread(data.threadId);
    } catch {
      agoraShowError('newThreadError', '📡 კავშირის შეცდომა');
    } finally {
      btn.disabled = false;
      btn.textContent = '⚔ გამოწვევის გაგზავნა';
    }
    return;
  }

  // ── PUBLIC ──────────────────────────────────────────────────
  btn.disabled = true;
  btn.textContent = 'AI ამოწმებს...';

  const token    = await agoraGetValidToken();
  const user     = agoraGetUser();
  const authorName   = user?.nickname || localStorage.getItem('userNickname') || 'მომხმარებელი';
  const authorAvatar = user?.photoURL || null;

  try {
    const { ok, data } = await agoraFetch({
      action: 'create-thread', title, threadBody: body,
      userToken: token, authorName, authorAvatar
    });

    if (!ok) {
      if (data.warned) {
        agoraShowWarningToast(data.message, data.banned, data.quote || '');
        if (data.banned) closeModal('newThreadModal');
      } else {
        agoraShowError('newThreadError', data.quote ? `${data.error || 'შეცდომა'}\n\n❝ "${data.quote}"` : (data.error || 'შეცდომა'));
      }
      return;
    }

    closeModal('newThreadModal');
    showToast('✅ თემა გაიხსნა!', 'success');
    try {
      if (typeof currentUser !== 'undefined' && currentUser) {
        currentUser.topicsCount = (currentUser.topicsCount || 0) + 1;
        const st = document.getElementById('statTopics');
        if (st) st.textContent = currentUser.topicsCount;
      }
    } catch { /* silent */ }
    agoraOpenThread(data.threadId);

  } catch {
    agoraShowError('newThreadError', '📡 კავშირის შეცდომა. სცადე ხელახლა.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'გამოქვეყნება';
  }
}

// ============================================================
// reply submit
// ============================================================
async function agoraSubmitReply(threadId, ta, btn) {
  const body = ta.value.trim();
  agoraClearError('replyError');

  if (!body || body.length < 2) {
    agoraShowError('replyError', 'კომენტარი ძალიან მოკლეა');
    return;
  }

  const token  = await agoraGetValidToken();
  const user   = agoraGetUser();
  const authorName   = user?.nickname || localStorage.getItem('userNickname') || 'მომხმარებელი';
  const authorAvatar = user?.photoURL || null;

  btn.disabled = true;
  btn.textContent = 'AI ამოწმებს...';

  try {
    const payload = {
      action:       'create-reply',
      threadId,
      replyBody:    body,
      userToken:    token,
      authorName,
      authorAvatar
    };

    // ციტატები — array
    if (_agoraQuotes.length > 0) {
      payload.quotes = _agoraQuotes.map(q => ({
        replyId: q.id,
        body:    q.body,
        author:  q.author,
        num:     q.num
      }));
    }

    const { ok, data } = await agoraFetch(payload);

    if (!ok) {
      if (data.warned) {
        agoraShowWarningToast(data.message, data.banned, data.quote || '');
      } else {
        const errMsg = data.quote
          ? `${data.error || 'შეცდომა'}\n\n❝ "${data.quote}"`
          : (data.error || 'შეცდომა');
        agoraShowError('replyError', errMsg);
      }
      return;
    }

    ta.value = '';
    const countEl = document.getElementById('replyCharCount');
    if (countEl) countEl.textContent = '0';

    // ციტატების გასუფთავება
    _agoraQuotes = [];
    agoraUpdateQuoteStack();

    showToast('✅ კომენტარი გამოქვეყნდა!', 'success');

    // ბოლო გვერდზე გადასვლა და reload
    const { ok: ok2, data: d2 } = await agoraFetch({ action: 'get-thread', threadId });
    if (ok2) {
      _agoraCurrentThread = d2.thread;
      const repliesEl = document.getElementById('agoraReplies');
      const lastPage  = d2.replies.totalPages;
      _agoraReplyPage  = lastPage;
      _agoraReplyTotal = lastPage;

      const replyFEl = document.getElementById('agoraReplyFormWrap');
      agoraRenderReplyForm(replyFEl, d2.thread);

      if (lastPage > 1) {
        await agoraLoadReplyPage(threadId, lastPage);
      } else {
        agoraRenderReplies(repliesEl, d2.replies.items, d2.replies);
        agoraRenderPagination('agoraRepliesPagination', 1, 1, () => {});
      }
    }

  } catch (e) {
    agoraShowError('replyError', '📡 კავშირის შეცდომა.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'გამოქვეყნება ↑';
  }
}

// ============================================================
// edit thread
// ============================================================
async function agoraEditThread(threadId, newTitle, newBody) {
  const token = await agoraGetValidToken();
  const btn   = document.getElementById('editThreadSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const { ok, data } = await agoraFetch({
      action: 'edit-thread',
      threadId,
      title: newTitle,
      threadBody: newBody,
      userToken: token
    });

    if (!ok) {
      showToast(data.error || 'შეცდომა', 'error');
      return;
    }

    showToast('✅ თემა განახლდა!', 'success');
    agoraOpenThread(threadId); // reload

  } catch (e) {
    showToast('📡 კავშირის შეცდომა.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'შენახვა'; }
  }
}

// ============================================================
// delete thread
// ============================================================
async function agoraDeleteThread(threadId) {
  const token = await agoraGetValidToken();
  try {
    const { ok, data } = await agoraFetch({
      action: 'delete-thread',
      threadId,
      userToken: token
    });

    if (!ok) {
      showToast(data.error || 'შეცდომა', 'error');
      return;
    }

    showToast('🗑 თემა წაიშალა', 'info');
    agoraShowList(1);
  } catch (e) {
    showToast('📡 კავშირის შეცდომა.', 'error');
  }
}

// ============================================================
// edit reply
// ============================================================
async function agoraEditReply(threadId, replyId, newBody) {
  const token = await agoraGetValidToken();
  const btn   = document.querySelector(`.reply-save-btn[data-reply-id="${replyId}"]`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const { ok, data } = await agoraFetch({
      action: 'edit-reply',
      threadId,
      replyId,
      replyBody: newBody,
      userToken: token
    });

    if (!ok) {
      showToast(data.error || 'შეცდომა', 'error');
      return;
    }

    showToast('✅ კომენტარი განახლდა!', 'success');
    agoraLoadReplyPage(threadId, _agoraReplyPage);
  } catch (e) {
    showToast('📡 კავშირის შეცდომა.', 'error');
  }
}

// ============================================================
// delete reply
// ============================================================
async function agoraDeleteReply(threadId, replyId) {
  const token = await agoraGetValidToken();
  try {
    const { ok, data } = await agoraFetch({
      action: 'delete-reply',
      threadId,
      replyId,
      userToken: token
    });

    if (!ok) {
      showToast(data.error || 'შეცდომა', 'error');
      return;
    }

    showToast('🗑 კომენტარი წაიშალა', 'info');
    agoraLoadReplyPage(threadId, _agoraReplyPage);
  } catch (e) {
    showToast('📡 კავშირის შეცდომა.', 'error');
  }
}

// ============================================================
// AI warning toast
// ============================================================
function agoraShowWarningToast(message, isBanned, quote) {
  const old = document.getElementById('__agora_warn__');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = '__agora_warn__';
  el.className = 'agora-warn-toast';

  let html = `
    <button class="agora-warn-close" id="__agora_warn_close__">✕</button>
    <div class="agora-warn-msg">${agoraEscape(message)}</div>`;
  if (quote) {
    html += `<div class="agora-warn-quote">❝ "${agoraEscape(quote)}"</div>`;
  }
  el.innerHTML = html;
  document.body.appendChild(el);

  document.getElementById('__agora_warn_close__').addEventListener('click', () => el.remove());

  if (isBanned) {
    setTimeout(() => {
      if (window._doLogoutConfirmed) window._doLogoutConfirmed();
    }, 3000);
  }
}


// ============================================================
// Edit Modal — thread ან reply-ის რედაქტირება
// ============================================================
function agoraOpenEditModal(opts) {
  // opts: { type, id, threadId?, title?, body }
  const existing = document.getElementById('agoraEditModal');
  if (existing) existing.remove();

  const isThread = opts.type === 'thread';

  const modal = document.createElement('div');
  modal.id = 'agoraEditModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);padding:16px;
  `;

  modal.innerHTML = `
    <div style="background:#1a1610;border:1px solid #c9a84c44;border-radius:12px;
      padding:24px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;">
      <div style="font-size:1rem;font-weight:600;color:#c9a84c;margin-bottom:16px;">
        ✏️ ${isThread ? 'თემის რედაქტირება' : 'კომენტარის რედაქტირება'}
      </div>
      ${isThread ? `
        <input type="text" id="agoraEditTitle" class="agora-modal-input"
          maxlength="120" value="${agoraEscape(opts.title || '')}"
          style="margin-bottom:12px;" />
      ` : ''}
      <textarea id="agoraEditBody" class="agora-textarea"
        style="min-height:120px;">${agoraEscape(opts.body || '')}</textarea>
      <div class="agora-error" id="agoraEditError" style="margin-top:8px;"></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button id="agoraEditSaveBtn" class="agora-reply-submit">შენახვა</button>
        <button id="agoraEditCancelBtn" class="agora-action-btn">გაუქმება</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const saveBtn   = document.getElementById('agoraEditSaveBtn');
  const cancelBtn = document.getElementById('agoraEditCancelBtn');

  cancelBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  saveBtn.addEventListener('click', async function() {
    const newBody  = document.getElementById('agoraEditBody')?.value.trim();
    const errEl    = document.getElementById('agoraEditError');

    if (!newBody || newBody.length < 2) {
      errEl.textContent = 'ძალიან მოკლეა';
      errEl.classList.add('active');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '...';

    if (isThread) {
      const newTitle = document.getElementById('agoraEditTitle')?.value.trim();
      if (!newTitle || newTitle.length < 5) {
        errEl.textContent = 'სათაური მინ. 5 სიმბოლო';
        errEl.classList.add('active');
        saveBtn.disabled = false;
        saveBtn.textContent = 'შენახვა';
        return;
      }
      await agoraEditThread(opts.id, newTitle, newBody);
    } else {
      await agoraEditReply(opts.threadId, opts.id, newBody);
    }

    modal.remove();
  });
}

// ============================================================
// 👤 USER CARD POPUP
// ============================================================
let _userCardCache = {};

async function agoraShowUserCard(uid, anchorEl) {
  if (!uid) return;

  // ძველი popup წავშალოთ
  document.querySelectorAll('.agora-user-card-popup').forEach(e => e.remove());

  const popup = document.createElement('div');
  popup.className = 'agora-user-card-popup';
  popup.innerHTML = `<div class="auc-loading">იტვირთება...</div>`;
  document.body.appendChild(popup);

  // პოზიციონირება anchor-ის ქვევით
  const rect = anchorEl.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  popup.style.position = 'fixed';
  popup.style.top  = (rect.bottom + 6) + 'px';
  popup.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
  popup.style.zIndex = '99999';

  // გარეთ კლიკი — დახურვა
  const closeHandler = (e) => {
    if (!popup.contains(e.target) && e.target !== anchorEl) {
      popup.remove();
      document.removeEventListener('click', closeHandler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler, true), 100);

  // cache ან fetch
  let profile = _userCardCache[uid];
  if (!profile) {
    try {
      const { ok, data } = await agoraFetch({ action: 'get-user-profile', uid });
      profile = ok ? data : null;
      if (profile) _userCardCache[uid] = profile;
    } catch { profile = null; }
  }

  if (!profile) {
    popup.innerHTML = `<div class="auc-loading">ვერ ჩაიტვირთა</div>`;
    return;
  }

  const avatarSrc = profile.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((profile.nickname||'?')[0])}&background=c9a84c&color=1a1610&size=64&bold=true`;

  const roleHtml = profile.isOwner
    ? `<span class="auc-role">👑 Owner — მთავარი ადმინისტრატორი</span>`
    : `<span class="auc-nickname">${agoraEscape(profile.nickname)}</span>`;

  popup.innerHTML = `
    <div class="auc-top">
      <img class="auc-avatar" src="${agoraEscape(avatarSrc)}" alt="">
      <div class="auc-info">
        ${roleHtml}
      </div>
    </div>
    <div class="auc-stats">
      <div class="auc-stat"><span class="auc-num">${profile.articlesCount || 0}</span><span class="auc-label">სტატია</span></div>
      <div class="auc-stat"><span class="auc-num">${profile.topicsCount || 0}</span><span class="auc-label">თემა</span></div>
    </div>`;
}

function agoraBindUserCardTriggers(container) {
  container.querySelectorAll('.agora-user-card-trigger').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const uid = this.dataset.uid;
      if (uid) agoraShowUserCard(uid, this);
    });
  });
}


// ============================================================
// 🔔 NOTIFICATIONS
// ============================================================
async function agoraNotifLoad() {
  // მხოლოდ logged-in user-ებისთვის
  const hasToken = !!(
    (typeof agoraGetToken === 'function' && agoraGetToken()) ||
    (typeof agoraIsAdmin === 'function' && agoraIsAdmin())
  );
  if (!hasToken) return;

  try {
    const userToken = await agoraGetValidToken();
    if (!userToken) return;
    const { ok, data } = await agoraFetch({ action: 'get-notifications', userToken });
    if (!ok) return;
    _notifData = data.notifications || [];
    agoraNotifUpdateBadge(data.unread || 0);
  } catch { /* silent */ }
}

function agoraNotifUpdateBadge(count) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function agoraNotifToggle() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  if (isOpen) {
    dropdown.classList.remove('open');
  } else {
    dropdown.classList.add('open');
    agoraNotifRender();
  }
}

function agoraNotifRender() {
  const listEl = document.getElementById('notifList');
  if (!listEl) return;

  if (!_notifData.length) {
    listEl.innerHTML = '<div class="notif-empty">შეტყობინებები არ არის</div>';
    return;
  }

  listEl.innerHTML = _notifData.map(n => {
    const readClass = n.read ? '' : 'notif-unread';
    let icon = '💬';
    let text = '';
    if (n.type === 'reply') {
      icon = '↩';
      text = `<b>${agoraEscape(n.fromName || '')}</b> გიპასუხა: <i>${agoraEscape(n.threadTitle || '')}</i>`;
    } else if (n.type === 'quote') {
      icon = '❝';
      text = `<b>${agoraEscape(n.fromName || '')}</b> გიციტირა: <i>${agoraEscape(n.threadTitle || '')}</i>`;
    } else if (n.type === 'new-thread') {
      icon = '🏛';
      text = `<b>${agoraEscape(n.fromName || '')}</b> გახსნა ახალი თემა: <i>${agoraEscape(n.threadTitle || '')}</i>`;
    } else if (n.type === 'debate-invite') {
      icon = '⚔';
      text = `<b>${agoraEscape(n.fromName || '')}</b> გიწვევს 1vs1 დებატში: <i>${agoraEscape(n.threadTitle || '')}</i>`;
    } else if (n.type === 'debate-accepted') {
      icon = '⚔';
      text = `<b>${agoraEscape(n.fromName || '')}</b> მიიღო შენი გამოწვევა — დებატი დაიწყო!`;
    } else if (n.type === 'debate-declined') {
      icon = '⚔';
      text = `<b>${agoraEscape(n.fromName || '')}</b> უარი თქვა გამოწვევაზე`;
    } else if (n.type === 'debate-turn') {
      icon = '⚔';
      text = n.message || 'შენი სვლაა დებატში';
    } else if (n.type === 'debate-verdict') {
      icon = '⚖';
      text = n.message || 'AI კრიტიკოსმა შეაფასა დებატი';
    }
    return `<div class="notif-item ${readClass}" data-thread="${n.threadId || ''}">
      <span class="notif-icon">${icon}</span>
      <div class="notif-content">
        <div class="notif-text">${text}</div>
        <div class="notif-time">${agoraTimeAgo(n.createdAt)}</div>
      </div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', function() {
      const tid = this.dataset.thread;
      document.getElementById('notifDropdown').classList.remove('open');
      if (tid) {
        openAgora();
        setTimeout(() => agoraOpenThread(tid), 300);
      }
    });
  });
}

async function agoraNotifMarkAll() {
  try {
    const userToken = await agoraGetValidToken();
    if (!userToken) return;
    await agoraFetch({ action: 'mark-notifications-read', userToken });
    _notifData = _notifData.map(n => ({ ...n, read: true }));
    agoraNotifUpdateBadge(0);
    agoraNotifRender();
  } catch { /* silent */ }
}


// ============================================================
// ✂️ Selection Quote Bubble
// ============================================================
function agoraInitSelectionBubble() {
  // Bubble გაუქმებულია — ლოგიკა მხოლოდ "↩ ციტირება" ღილაკშია
}


// ============================================================
// 🚫 Admin — დაბლოკილი მომხმარებლების პანელი
// ============================================================
async function agoraOpenBannedPanel() {
  const existing = document.getElementById('agoraBannedPanel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'agoraBannedPanel';
  panel.className = 'agora-banned-panel';
  panel.innerHTML = `
    <div class="abp-header">
      <span class="abp-title">🚫 დაბლოკილი მომხმარებლები</span>
      <button class="abp-close" id="abpClose">✕</button>
    </div>
    <div class="abp-list" id="abpList">
      <div class="agora-loading">იტვირთება...</div>
    </div>`;
  document.getElementById('agoraView').appendChild(panel);

  document.getElementById('abpClose').addEventListener('click', () => panel.remove());

  // ჩატვირთვა
  try {
    const token = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action: 'get-agora-banned', userToken: token });
    const listEl = document.getElementById('abpList');
    if (!listEl) return;

    if (!ok || !data.users || !data.users.length) {
      listEl.innerHTML = '<div class="abp-empty">დაბლოკილი მომხმარებელი არ არის</div>';
      return;
    }

    listEl.innerHTML = data.users.map(u => {
      const avatar = u.photoURL
        ? `<img class="abp-avatar" src="${agoraEscape(u.photoURL)}" alt="">`
        : `<div class="abp-avatar abp-avatar-ph">${agoraEscape((u.nickname||'?')[0].toUpperCase())}</div>`;
      const when = u.bannedAt ? agoraTimeAgo(u.bannedAt) : '';
      return `<div class="abp-item" data-uid="${agoraEscape(u.uid)}">
        ${avatar}
        <div class="abp-info">
          <div class="abp-nick">${agoraEscape(u.nickname)}</div>
          ${when ? `<div class="abp-when">დაბლოკვა: ${when}</div>` : ''}
        </div>
        <button class="abp-unban-btn" data-uid="${agoraEscape(u.uid)}">განბლოკვა</button>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.abp-unban-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const uid = this.dataset.uid;
        this.disabled = true;
        this.textContent = '...';
        try {
          const tok = await agoraGetValidToken();
          const { ok, data } = await agoraFetch({ action: 'unban-agora', userToken: tok, targetUid: uid });
          if (ok) {
            showToast('✅ მომხმარებელი განიბლოკა', 'success');
            this.closest('.abp-item').remove();
            if (!document.querySelector('.abp-item')) {
              document.getElementById('abpList').innerHTML = '<div class="abp-empty">დაბლოკილი მომხმარებელი არ არის</div>';
            }
          } else {
            showToast(data.error || 'შეცდომა', 'error');
            this.disabled = false;
            this.textContent = 'განბლოკვა';
          }
        } catch {
          showToast('📡 კავშირის შეცდომა', 'error');
          this.disabled = false;
          this.textContent = 'განბლოკვა';
        }
      });
    });
  } catch {
    const listEl = document.getElementById('abpList');
    if (listEl) listEl.innerHTML = '<div class="abp-empty">❌ ჩატვირთვის შეცდომა</div>';
  }
}


document.addEventListener('DOMContentLoaded', function() {
  // ✂️ Selection Quote Bubble
  agoraInitSelectionBubble();

  // header agora button
  const agoraBtn = document.getElementById('agoraBtn');
  if (agoraBtn) {
    agoraBtn.addEventListener('click', openAgora);
  }

  // back button — სიაზე დაბრუნება
  const backBtn = document.getElementById('agoraBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      _agoraQuotes = [];
      agoraShowList(_agoraListPage);
    });
  }

  // new thread button
  const newBtn = document.getElementById('agoraNewBtn');
  if (newBtn) {
    newBtn.addEventListener('click', agoraOpenNewThreadModal);
  }

  // new thread modal submit
  const submitBtn = document.getElementById('newThreadSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', agoraSubmitNewThread);
  }

  // new thread modal close
  const closeBtn = document.getElementById('closeNewThreadModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeModal('newThreadModal');
    });
  }

  // new thread body char count — ლიმიტი არ არის

  // Escape key closes agora
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const agoraView = document.getElementById('agoraView');
      if (agoraView && agoraView.classList.contains('active')) {
        closeAgora();
      }
    }
  });

  // 🔔 Notification bell
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      agoraNotifToggle();
    });
  }

  const markAllBtn = document.getElementById('notifMarkAll');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      agoraNotifMarkAll();
    });
  }

  // dropdown — გარეთ კლიკი ხურავს
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#notifWrap')) {
      const dd = document.getElementById('notifDropdown');
      if (dd) dd.classList.remove('open');
    }
  });

  // notification-ების ჩატვირთვა (auth-ს დროს ვაძლევთ 2 წამს)
  setTimeout(() => {
    agoraNotifLoad();
    _notifInterval = setInterval(agoraNotifLoad, 60000);
  }, 2000);
});

// ============================================================
// თემების ძებნა
// ============================================================
let _agoraSearchTimer = null;
let _agoraSearchActive = false;

function agoraInitSearch() {
  const input   = document.getElementById('agoraSearchInput');
  const clear   = document.getElementById('agoraSearchClear');
  const results = document.getElementById('agoraSearchResults');
  const list    = document.getElementById('agoraThreadList');
  const pages   = document.getElementById('agoraListPagination');

  if (!input || input.dataset.searchInited) return;
  input.dataset.searchInited = '1';

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clear.classList.toggle('hidden', !q);

    clearTimeout(_agoraSearchTimer);
    if (!q) {
      agoraSearchClearState();
      return;
    }
    _agoraSearchTimer = setTimeout(() => agoraDoSearch(q), 350);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.classList.add('hidden');
    agoraSearchClearState();
    input.focus();
  });
}

function agoraSearchClearState() {
  _agoraSearchActive = false;
  const results = document.getElementById('agoraSearchResults');
  const list    = document.getElementById('agoraThreadList');
  const pages   = document.getElementById('agoraListPagination');
  if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  if (list)    list.style.display = '';
  if (pages)   pages.style.display = '';
}

async function agoraDoSearch(query) {
  const results = document.getElementById('agoraSearchResults');
  const list    = document.getElementById('agoraThreadList');
  const pages   = document.getElementById('agoraListPagination');

  if (!results) return;

  _agoraSearchActive = true;
  if (list)  list.style.display  = 'none';
  if (pages) pages.style.display = 'none';
  results.style.display = 'block';
  results.innerHTML = '<div class="agora-loading">ძებნა...</div>';

  try {
    const { ok, data } = await agoraFetch({ action: 'search-threads', query });
    if (!ok) throw new Error(data.error || 'შეცდომა');

    if (!data.threads || data.threads.length === 0) {
      results.innerHTML = `<div class="agora-empty"><div class="agora-empty-icon">🔍</div><div class="agora-empty-text">ვერაფერი მოიძებნა</div></div>`;
      return;
    }

    results.innerHTML = `
      <div class="agora-search-count">მოიძებნა: ${data.threads.length} თემა</div>
      ${data.threads.map(t => agoraThreadCard(t)).join('')}
    `;

    results.querySelectorAll('.agora-thread-item').forEach(el => {
      el.addEventListener('click', function() {
        const input = document.getElementById('agoraSearchInput');
        const clear = document.getElementById('agoraSearchClear');
        if (input) input.value = '';
        if (clear) clear.classList.add('hidden');
        agoraSearchClearState();
        agoraOpenThread(this.dataset.id);
      });
    });
  } catch (e) {
    results.innerHTML = `<div class="agora-empty"><div class="agora-empty-text">❌ ${agoraEscape(e.message)}</div></div>`;
  }
}


// ============================================================
// ⚔ DEBATE UI
// ============================================================

function _dbClearTimers() {
  _debateTimerIds.forEach(id => clearInterval(id));
  _debateTimerIds = [];
}

function _dbCountdown(elId, deadline) {
  function tick() {
    const el  = document.getElementById(elId);
    if (!el) { clearInterval(tid); return; }
    const rem = Math.max(0, deadline - Date.now());
    const h   = Math.floor(rem / 3600000);
    const m   = Math.floor((rem % 3600000) / 60000);
    const s   = Math.floor((rem % 60000) / 1000);
    el.textContent = [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
    el.style.color = rem < 3600000 ? '#f87171' : rem < 7200000 ? '#f59e0b' : 'var(--gold)';
    if (rem <= 0) clearInterval(tid);
  }
  tick();
  const tid = setInterval(tick, 1000);
  _debateTimerIds.push(tid);
}

function _dbTimerRow(id, label) {
  return `<span style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:1.5px;color:var(--text-dim);margin-right:8px;">${label}</span><span id="${id}" style="font-family:'Cinzel',serif;font-size:0.72rem;color:var(--gold);">--:--:--</span>`;
}

function _dbPhaseHdr(label, timerHtml) {
  return `<div class="db-phase-hdr">
    <span>${label}</span>
    ${timerHtml ? `<span style="display:flex;align-items:center;gap:4px;">${timerHtml}</span>` : ''}
  </div>`;
}

function _dbTurnsHtml(turnsObj, authorUid, authorNick, oppNick, photoMap) {
  photoMap = photoMap || {};
  if (!turnsObj || !Object.keys(turnsObj).length)
    return `<div class="db-empty-turns">ჯერ პასუხი არ გაცემულა</div>`;
  const entries = Object.values(turnsObj).sort((a, b) => a.createdAt - b.createdAt);
  return entries.map((t, idx) => {
    const isA     = t.uid === authorUid;
    const nick    = agoraEscape(t.nickname || '?');
    const initial = (t.nickname || '?')[0].toUpperCase();
    const photo   = photoMap[t.uid] || null;
    const avatarHtml = photo
      ? `<img class="agora-author-avatar" src="${agoraEscape(photo)}" alt="">`
      : `<div class="agora-author-avatar agora-author-avatar-placeholder">${initial}</div>`;
    return `<div class="db-turn-card ${isA ? 'db-turn-author' : ''}">
      <div class="db-turn-meta">
        <span class="db-turn-num">#${idx + 1}</span>
        ${avatarHtml}
        <span class="db-turn-nick">${nick}</span>
      </div>
      <div class="db-turn-body">${agoraEscape(t.body)}</div>
    </div>`;
  }).join('');
}

function _dbSubmitForm() {
  return `<div class="db-submit-wrap">
    <label class="db-label">შენი ჯერია</label>

    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button id="dbAgreeBtn" class="db-btn db-btn-gold" style="flex:1;font-size:0.6rem;padding:10px 8px;">✓ გეთანხმები</button>
      <button id="dbNoAnswerBtn" class="db-btn" style="flex:1;font-size:0.6rem;padding:10px 8px;background:none;border:1px solid rgba(201,168,76,0.2);color:var(--text-dim);">— პასუხი არ მაქვს</button>
    </div>

    <div style="height:1px;background:rgba(201,168,76,0.12);margin-bottom:12px;"></div>

    <textarea id="dbTurnInput" class="db-textarea" rows="6" placeholder="არგუმენტი... (მინ. 200 სიმბოლო)"></textarea>
    <div id="dbTurnCounter" style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--text-dim);text-align:right;margin-top:4px;letter-spacing:1px;">0 / 200</div>
    <div id="dbTurnError" class="db-error"></div>
    <button id="dbSubmitTurnBtn" class="db-btn db-btn-gold db-btn-full" style="margin-top:10px;">პასუხი →</button>
  </div>`;
}

function _dbProgressBar(done, total, aName, aCountRaw, oName, oCountRaw, aUid, oUid, photoMap) {
  const [aDone, aMax] = aCountRaw.split('/').map(Number);
  const [oDone, oMax] = oCountRaw.split('/').map(Number);
  const pct = Math.round((done / total) * 100);
  photoMap = photoMap || {};

  function playerCard(nick, uid, doneCnt, maxCnt) {
    const initials = (nick||'?')[0].toUpperCase();
    const photo    = photoMap[uid] || null;
    const avatarEl = photo
      ? `<img src="${agoraEscape(photo)}" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(201,168,76,0.3);">`
      : `<div style="width:26px;height:26px;border-radius:50%;background:var(--surface2);border:1px solid rgba(201,168,76,0.25);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:0.65rem;color:var(--gold-dim);flex-shrink:0;">${initials}</div>`;
    const dots = Array.from({length: maxCnt}, (_, i) =>
      `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 2px;background:${i < doneCnt ? 'var(--gold)' : 'rgba(201,168,76,0.15)'};"></span>`
    ).join('');
    return `<div style="display:flex;align-items:center;gap:8px;">
      ${avatarEl}
      <div>
        <div style="font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">${agoraEscape(nick)}</div>
        <div style="line-height:1;">${dots}</div>
      </div>
    </div>`;
  }

  return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;padding:12px 14px;background:var(--surface);border:1px solid rgba(201,168,76,0.1);">
    ${playerCard(aName, aUid, aDone, aMax)}
    <div style="font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:1.5px;color:var(--gold-dim);text-transform:uppercase;flex-shrink:0;">vs</div>
    ${playerCard(oName, oUid, oDone, oMax)}
  </div>
  <div style="height:2px;background:rgba(201,168,76,0.08);margin-bottom:18px;"><div style="height:100%;background:rgba(201,168,76,0.35);width:${pct}%;transition:width 0.5s;"></div></div>`;
}

// ── Main router ──────────────────────────────────────────────
function agoraRenderDebateView(thread, debate, container, photoMap) {
  _dbClearTimers();
  photoMap = photoMap || {};
  const user  = agoraGetUser();
  const uid   = user?.uid;
  const phase = debate.phase;

  let html = '';

  if (phase === 'pending') {
    if (uid === debate.opponentUid)   html = _dbInviteScreen(debate);
    else if (uid === debate.authorUid) html = _dbPendingScreen(debate);
    else html = `<div style="text-align:center;padding:32px;color:var(--text-dim);font-style:italic;">⚔️ ${agoraEscape(debate.authorNickname||'?')} ელოდება ${agoraEscape(debate.opponentNickname||'?')}-ის პასუხს...</div>`;
  } else if (phase === 'cancelled') {
    html = `<div style="text-align:center;padding:32px;color:var(--text-dim);">⚔️ გამოწვევა გაუქმდა.</div>`;
  } else if (phase === 'opening') {
    html = _dbOpeningView(debate, uid, photoMap);
  } else if (phase === 'cross-asking') {
    html = _dbCrossAskView(debate, uid);
  } else if (phase === 'cross-answering') {
    html = _dbCrossAnswerView(debate, uid);
  } else if (phase === 'final') {
    html = _dbFinalView(debate, uid, photoMap);
  } else if (phase === 'verdict') {
    html = _dbVerdictView(debate);
  }

  container.innerHTML = html;
  _dbBindActions(container, thread, debate, uid);

  // timers
  if (phase === 'pending' && debate.inviteDeadline)
    _dbCountdown('dbInviteTimer', debate.inviteDeadline);
  if (['opening','cross-asking','cross-answering','final'].includes(phase)) {
    if (debate.turnDeadline)  _dbCountdown('dbTurnTimer',  debate.turnDeadline);
    if (debate.totalDeadline) _dbCountdown('dbTotalTimer', debate.totalDeadline);
  }
}

// ── Invite screen ────────────────────────────────────────────
function _dbInviteScreen(debate) {
  return `
    ${_dbPhaseHdr('⚔ გამოწვევა მოგივიდა', _dbTimerRow('dbInviteTimer','ᲕᲐᲓᲐ:'))}
    <div class="db-invite-box">
      <div class="db-invite-name">${agoraEscape(debate.authorNickname||'?')}</div>
      <div class="db-invite-sub">გიწვევს 1vs1 ფილოსოფიურ დებატში</div>
    </div>
    <div class="db-rules-box">
      ① საწყისი ეტაპი — 5+5 სვლა &nbsp;·&nbsp; ② დაკითხვა — კი/არა/არ ვიცი &nbsp;·&nbsp; ③ საბოლოო — 10+10 სვლა &nbsp;·&nbsp; ⚖ AI კრიტიკოსი
      <span class="db-warn">⚠ ყოველ სვლაზე 6 სთ. სვლის გამოტოვება = 7-დღიანი ბანი.</span>
    </div>
    <div class="db-btn-row">
      <button id="dbAcceptBtn" class="db-btn db-btn-gold">✓ მივიღო</button>
      <button id="dbDeclineBtn" class="db-btn db-btn-danger">✕ უარი</button>
    </div>`;
}

// ── Pending screen ───────────────────────────────────────────
function _dbPendingScreen(debate) {
  return `
    ${_dbPhaseHdr('⏳ პასუხს ელოდება', _dbTimerRow('dbInviteTimer','ᲕᲐᲓᲐ:'))}
    <div class="db-pending-msg">${agoraEscape(debate.opponentNickname||'?')} ჯერ არ გამოხმაურებულა</div>
    <div class="db-pending-center">
      <button id="dbCancelBtn" class="db-btn db-btn-danger">✕ გამოწვევის გაუქმება</button>
    </div>`;
}

// ── Opening phase ────────────────────────────────────────────
function _dbOpeningView(debate, uid, photoMap) {
  const turns  = debate.opening || {};
  const tArr   = Object.values(turns);
  const aCount = tArr.filter(t=>t.uid===debate.authorUid).length;
  const oCount = tArr.filter(t=>t.uid===debate.opponentUid).length;
  const mine   = uid === debate.currentTurn;
  const other  = uid === debate.authorUid ? debate.opponentNickname : debate.authorNickname;

  return _dbPhaseHdr('① საწყისი ეტაპი',
    _dbTimerRow('dbTurnTimer','სვლა:') + '&nbsp;&nbsp;' + _dbTimerRow('dbTotalTimer','სულ:'))
    + _dbProgressBar(tArr.length, 10, debate.authorNickname||'?', `${aCount}/5`, debate.opponentNickname||'?', `${oCount}/5`, debate.authorUid, debate.opponentUid, photoMap)
    + _dbTurnsHtml(turns, debate.authorUid, debate.authorNickname, debate.opponentNickname, photoMap)
    + (mine ? _dbSubmitForm()
             : uid ? `<div class="db-waiting">⏳ ${agoraEscape(other||'?')}-ის ჯერია...</div>` : '');
}

// ── Cross-asking phase ───────────────────────────────────────
function _dbCrossAskView(debate, uid) {
  const isAsker = uid === debate.authorUid;
  return _dbPhaseHdr('② დაკითხვა', _dbTimerRow('dbTurnTimer','ვადა:') + '&nbsp;&nbsp;' + _dbTimerRow('dbTotalTimer','სულ:'))
    + (isAsker ? `
      <div style="color:var(--text-dim);font-size:0.88rem;margin-bottom:16px;line-height:1.75;font-family:'EB Garamond',serif;">
        გამოაქვეყნე <strong style="color:var(--text)">5–20 კითხვა</strong>. ოპონენტი მხოლოდ
        <strong style="color:#4ade80">კი</strong> / <strong style="color:#f87171">არა</strong> / <span style="color:var(--text-dim)">არ ვიცი</span>-ით პასუხობს.
      </div>
      <div id="dbCrossQList"></div>
      <button id="dbAddQBtn" class="db-btn" style="background:none;border:1px dashed rgba(201,168,76,0.3);color:var(--text-dim);font-size:0.62rem;letter-spacing:1.5px;padding:8px 14px;margin-bottom:12px;">+ კითხვის დამატება</button>
      <div id="dbCrossError" class="db-error" style="margin-bottom:8px;"></div>
      <button id="dbSubmitQBtn" class="db-btn db-btn-gold db-btn-full">კითხვების გამოქვეყნება (მინ. 5)</button>`
    : `<div class="db-waiting">⏳ ოპონენტი კითხვებს ამზადებს...</div>`);
}

// ── Cross-answering phase ────────────────────────────────────
function _dbCrossAnswerView(debate, uid) {
  const isAns   = uid === debate.opponentUid;
  const questions = debate.cross?.questions || {};
  const answers   = debate.cross?.answers   || {};
  const qArr      = Object.entries(questions).sort(([a],[b]) => a-b);

  let html = _dbPhaseHdr('② დაკითხვა — პასუხი', _dbTimerRow('dbTurnTimer','ვადა:') + '&nbsp;&nbsp;' + _dbTimerRow('dbTotalTimer','სულ:'));
  html += `<div style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);margin-bottom:14px;">${Object.keys(answers).length} / ${qArr.length} პასუხი</div>`;

  qArr.forEach(([idx, q]) => {
    const ans = answers[idx];
    const done = ans !== undefined;
    const aLabel = done ? (ans.answer==='yes'?'✓ კი':ans.answer==='no'?'✗ არა':'— არ ვიცი') : '';
    const aColor = done ? (ans.answer==='yes'?'#4ade80':ans.answer==='no'?'#f87171':'var(--text-dim)') : '';
    html += `<div style="background:var(--surface);border:1px solid rgba(201,168,76,0.14);padding:14px 16px;margin-bottom:8px;">
      <div style="font-family:'EB Garamond',serif;font-size:0.95rem;color:var(--text);margin-bottom:10px;line-height:1.65;">${agoraEscape(q.body)}</div>
      ${done
        ? `<div style="font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:1.5px;color:${aColor};">${aLabel}</div>`
        : isAns
          ? `<div class="db-ans-row">
              <button class="db-ans-btn db-ans-btn-yes" data-idx="${idx}" data-ans="yes">✓ კი</button>
              <button class="db-ans-btn db-ans-btn-no"  data-idx="${idx}" data-ans="no">✗ არა</button>
              <button class="db-ans-btn db-ans-btn-idk" data-idx="${idx}" data-ans="idk">— არ ვიცი</button>
            </div>`
          : `<div style="color:var(--text-dim);font-size:0.8rem;font-style:italic;">პასუხი ჯერ არ არის</div>`
      }
    </div>`;
  });
  return html;
}

// ── Final phase ──────────────────────────────────────────────
function _dbFinalView(debate, uid, photoMap) {
  const turns  = debate.final || {};
  const tArr   = Object.values(turns);
  const aCount = tArr.filter(t=>t.uid===debate.authorUid).length;
  const oCount = tArr.filter(t=>t.uid===debate.opponentUid).length;
  const mine   = uid === debate.currentTurn;
  const other  = uid === debate.authorUid ? debate.opponentNickname : debate.authorNickname;

  return _dbPhaseHdr('③ საბოლოო პაექრობა',
    _dbTimerRow('dbTurnTimer','სვლა:') + '&nbsp;&nbsp;' + _dbTimerRow('dbTotalTimer','სულ:'))
    + _dbProgressBar(tArr.length, 20, debate.authorNickname||'?', `${aCount}/10`, debate.opponentNickname||'?', `${oCount}/10`, debate.authorUid, debate.opponentUid, photoMap)
    + _dbTurnsHtml(turns, debate.authorUid, debate.authorNickname, debate.opponentNickname, photoMap)
    + (mine ? _dbSubmitForm()
             : uid ? `<div class="db-waiting">⏳ ${agoraEscape(other||'?')}-ის ჯერია...</div>` : '');
}

// ── Verdict screen ───────────────────────────────────────────
function _dbVerdictView(debate) {
  const v = debate.verdict;
  if (!v) return `<div class="db-waiting">⚖ AI კრიტიკოსი ვერდიქტს ამზადებს...</div>`;

  function bar(n) {
    return `<div style="height:3px;background:rgba(201,168,76,0.1);margin-top:3px;"><div style="height:100%;background:var(--gold);width:${Math.round((n/10)*100)}%;transition:width 0.5s;"></div></div>`;
  }
  function scoreBlock(nick) {
    const s = (v.scores||{})[nick] || {};
    return `<div class="db-score-item">
      <div class="db-score-nick">${agoraEscape(nick)}</div>
      <div style="font-family:'EB Garamond',serif;font-size:0.82rem;color:var(--text-dim);margin-bottom:3px;">ლოგიკა: <span class="db-score-val" style="font-size:0.85rem;">${s.logic_score||0}/10</span> ${bar(s.logic_score||0)}</div>
      <div style="font-family:'EB Garamond',serif;font-size:0.82rem;color:var(--text-dim);margin-bottom:3px;">დაკითხვა: <span class="db-score-val" style="font-size:0.85rem;">${s.cross_score||0}/10</span> ${bar(s.cross_score||0)}</div>
      <div style="font-family:'EB Garamond',serif;font-size:0.82rem;color:var(--text-dim);">გამ. პ.: <span class="db-score-val" style="font-size:0.85rem;">${s.ignored_points||0}/10</span> ${bar(s.ignored_points||0)}</div>
    </div>`;
  }

  const aN = debate.authorNickname || '?';
  const oN = debate.opponentNickname || '?';

  return `<div class="db-verdict-wrap">`
    + _dbPhaseHdr('⚖ AI კრიტიკოსი — ვერდიქტი', '')
    + `<div class="db-verdict-winner">
        <div class="db-verdict-crown">🏆</div>
        <div class="db-verdict-label" style="margin-bottom:6px;text-transform:uppercase;letter-spacing:2px;font-family:'Cinzel',serif;font-size:0.62rem;">გამარჯვებული</div>
        <div class="db-verdict-name">${agoraEscape(v.winnerNickname||'?')}</div>
        ${v.reason ? `<div class="db-verdict-label" style="margin-top:10px;">${agoraEscape(v.reason)}</div>` : ''}
        ${v.forfeitUid ? `<div style="margin-top:8px;font-size:0.8rem;color:#f87171;font-family:'EB Garamond',serif;">⚠ სვლის გამოტოვების გამო</div>` : ''}
      </div>`
    + (v.analysis ? `<div class="db-verdict-analysis" style="margin-bottom:16px;">${agoraEscape(v.analysis)}</div>` : '')
    + `<div class="db-verdict-scores">${scoreBlock(aN)}${scoreBlock(oN)}</div>`
    + `</div>`;
}

// ── Action binder ────────────────────────────────────────────
function _dbBindActions(container, thread, debate, uid) {
  const tid = thread.id;

  const acceptBtn = container.querySelector('#dbAcceptBtn');
  if (acceptBtn) acceptBtn.addEventListener('click', () => _dbAccept(tid, acceptBtn));

  const declineBtn = container.querySelector('#dbDeclineBtn');
  if (declineBtn) declineBtn.addEventListener('click', () => {
    showConfirmToast('გამოწვევაზე უარს დადასტურება სჭირდება.', () => _dbDecline(tid, declineBtn));
  });

  const cancelBtn = container.querySelector('#dbCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    showConfirmToast('გამოწვევა გაუქმდება.', () => _dbCancel(tid, cancelBtn));
  });

  const submitTurnBtn = container.querySelector('#dbSubmitTurnBtn');
  if (submitTurnBtn) submitTurnBtn.addEventListener('click', () => _dbSubmitTurn(tid, submitTurnBtn));

  // character counter
  const ta = container.querySelector('#dbTurnInput');
  const counter = container.querySelector('#dbTurnCounter');
  if (ta && counter) {
    ta.addEventListener('input', () => {
      const len = ta.value.trim().length;
      counter.textContent = `${len} / 200`;
      counter.style.color = len >= 200 ? 'var(--gold)' : 'var(--text-dim)';
    });
  }

  // quick buttons
  const agreeBtn = container.querySelector('#dbAgreeBtn');
  if (agreeBtn) agreeBtn.addEventListener('click', () => {
    showConfirmToast('„გეთანხმები" — გაიგზავნოს?', () => _dbSubmitTurn(tid, agreeBtn, 'agree'));
  });

  const noAnsBtn = container.querySelector('#dbNoAnswerBtn');
  if (noAnsBtn) noAnsBtn.addEventListener('click', () => {
    showConfirmToast('„პასუხი არ მაქვს" — გაიგზავნოს?', () => _dbSubmitTurn(tid, noAnsBtn, 'no_answer'));
  });

  const addQBtn = container.querySelector('#dbAddQBtn');
  if (addQBtn) _dbInitQForm(container, tid);

  container.querySelectorAll('.db-ans-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      _dbSubmitAnswer(tid, parseInt(this.dataset.idx), this.dataset.ans, this);
    });
  });
}

// Cross question form
function _dbInitQForm(container, tid) {
  const qList  = container.querySelector('#dbCrossQList');
  const addBtn = container.querySelector('#dbAddQBtn');
  const subBtn = container.querySelector('#dbSubmitQBtn');
  if (!qList || !addBtn || !subBtn) return;
  let qCount = 0;

  function addQ() {
    if (qCount >= 20) return;
    qCount++;
    const div = document.createElement('div');
    div.className = 'db-q-row';
    div.innerHTML = `
      <textarea class="db-q-input" rows="2" placeholder="კითხვა ${qCount}..."></textarea>
      <button class="db-rm-q">✕</button>`;
    div.querySelector('.db-rm-q').addEventListener('click', () => { div.remove(); qCount--; });
    qList.appendChild(div);
  }

  addQ();
  addBtn.addEventListener('click', addQ);
  subBtn.addEventListener('click', () => _dbSubmitQuestions(container, tid, subBtn));
}

// ── Submit actions ───────────────────────────────────────────
async function _dbAccept(tid, btn) {
  btn.disabled = true; btn.textContent = '...';
  try {
    const tok = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action:'accept-debate', threadId:tid, userToken:tok });
    if (ok) { showToast('⚔️ დებატი დაიწყო!', 'success'); setTimeout(()=>agoraOpenThread(tid), 800); }
    else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; btn.textContent='✓ მივიღო'; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; btn.textContent='✓ მივიღო'; }
}

async function _dbDecline(tid, btn) {
  btn.disabled = true;
  try {
    const tok = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action:'decline-debate', threadId:tid, userToken:tok });
    if (ok) { showToast('გამოწვევაზე უარი თქვი.','info'); agoraShowList(_agoraListPage); }
    else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; }
}

async function _dbCancel(tid, btn) {
  btn.disabled = true;
  try {
    const tok = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action:'cancel-debate', threadId:tid, userToken:tok });
    if (ok) { showToast('გამოწვევა გაუქმდა.','info'); agoraShowList(_agoraListPage); }
    else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; }
}

async function _dbSubmitTurn(tid, btn, quickType) {
  const ta    = document.getElementById('dbTurnInput');
  const errEl = document.getElementById('dbTurnError');
  if (errEl) errEl.style.display = 'none';

  let body;
  if (quickType === 'agree') {
    body = '✓ გეთანხმები';
  } else if (quickType === 'no_answer') {
    body = '— პასუხი არ მაქვს';
  } else {
    if (!ta) return;
    body = ta.value.trim();
    if (!body || body.length < 200) {
      if (errEl) { errEl.textContent = `მინ. 200 სიმბოლო (ახლა: ${body.length})`; errEl.style.display = 'block'; }
      return;
    }
  }

  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'იგზავნება...';
  try {
    const tok  = await agoraGetValidToken();
    const user = agoraGetUser();
    const authorName = user?.nickname || localStorage.getItem('userNickname') || 'მომხმარებელი';
    const { ok, data } = await agoraFetch({ action:'submit-turn', threadId:tid, turnBody:body, userToken:tok, authorName });
    if (ok) { showToast('✅ სვლა გაკეთდა!','success'); setTimeout(()=>agoraOpenThread(tid), 600); }
    else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; btn.textContent=origText; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; btn.textContent=origText; }
}

async function _dbSubmitQuestions(container, tid, btn) {
  const inputs = container.querySelectorAll('.db-q-input');
  const errEl  = container.querySelector('#dbCrossError');
  if (errEl) errEl.style.display = 'none';
  const questions = Array.from(inputs).map(i=>i.value.trim()).filter(Boolean);
  if (questions.length < 5) {
    if (errEl) { errEl.textContent='მინ. 5 კითხვა'; errEl.style.display='block'; }
    return;
  }
  btn.disabled=true; btn.textContent='იგზავნება...';
  try {
    const tok = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action:'submit-cross-questions', threadId:tid, questions, userToken:tok });
    if (ok) { showToast('✅ კითხვები გამოქვეყნდა!','success'); setTimeout(()=>agoraOpenThread(tid), 600); }
    else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; btn.textContent='კითხვების გამოქვეყნება (მინ. 5)'; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; btn.textContent='კითხვების გამოქვეყნება (მინ. 5)'; }
}

async function _dbSubmitAnswer(tid, qIdx, answer, btn) {
  btn.disabled = true;
  try {
    const tok = await agoraGetValidToken();
    const { ok, data } = await agoraFetch({ action:'submit-cross-answer', threadId:tid, questionIdx:qIdx, answer, userToken:tok });
    if (ok) {
      const aLabel = answer==='yes'?'✓ კი':answer==='no'?'✗ არა':'— არ ვიცი';
      const aColor = answer==='yes'?'#4ade80':answer==='no'?'#f87171':'var(--text-dim)';
      const btnRow = btn.parentElement;
      if (btnRow) btnRow.outerHTML = `<div style="font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:1.5px;color:${aColor};">${aLabel}</div>`;
      if (data.allAnswered) {
        showToast('✅ ყველა პასუხი გაცემულია! საბოლოო პაექრობა იწყება.','success');
        setTimeout(()=>agoraOpenThread(tid), 1000);
      }
    } else { showToast(data.error||'შეცდომა','error'); btn.disabled=false; }
  } catch { showToast('📡 კავშირის შეცდომა','error'); btn.disabled=false; }
}
