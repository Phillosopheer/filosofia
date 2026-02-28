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
let _agoraQuote       = null;   // { id, num, author, body } — ციტატა
let _notifData        = [];     // შეტყობინებების cache
let _notifInterval    = null;

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
  const classes = ['agora-thread-item',
    locked ? 'agora-thread-locked' : '',
    pinned ? 'pinned' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" data-id="${agoraEscape(t.id)}">
      ${pinned ? '<div class="agora-thread-pin">📌 PINNED</div>' : ''}
      <div class="agora-thread-title">${agoraEscape(t.title)}</div>
      <div class="agora-thread-meta">
        <div class="agora-thread-author">
          <span>${agoraEscape(t.authorName)}</span>
          <span>·</span>
          <span>${agoraTimeAgo(t.createdAt)}</span>
        </div>
        <div class="agora-thread-replies">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>${t.replyCount || 0}</span>
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

  // quote block (თუ ეს კომენტარი სხვის ციტატაა)
  const quoteHtml = r.quotedBody
    ? `<div class="agora-quote-block">
        <div class="agora-quote-author">↩ ${agoraEscape(r.quotedAuthor || '?')} ${r.quotedNum ? `<span>#${r.quotedNum}</span>` : ''}</div>
        <div class="agora-quote-body">${agoraEscape(r.quotedBody.length > 150 ? r.quotedBody.substring(0,150)+'…' : r.quotedBody)}</div>
      </div>`
    : '';

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
      const body   = el.dataset.replyBody   || '';
      _agoraQuote = { id: replyId, num, author, body };
      agoraUpdateQuotePreview();
      // scroll to reply form
      const form = document.getElementById('agoraReplyFormWrap');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // focus textarea
      const ta = document.getElementById('replyTextarea');
      if (ta) ta.focus();
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
      <div id="agoraQuotePreview" class="agora-quote-preview" style="display:none">
        <div class="agora-quote-preview-inner">
          <div id="agoraQuotePreviewText"></div>
          <button class="agora-quote-clear" id="agoraQuoteClear" title="ციტატის გაუქმება">✕</button>
        </div>
      </div>
      <textarea class="agora-textarea" id="replyTextarea" placeholder="დაწერე კომენტარი..."></textarea>
      <div class="agora-char-count"><span id="replyCharCount">0</span> / 50000</div>
      <button class="agora-reply-submit" id="replySubmitBtn">გამოქვეყნება ↑</button>
    </div>`;

  const ta      = container.querySelector('#replyTextarea');
  const countEl = container.querySelector('#replyCharCount');
  const btn     = container.querySelector('#replySubmitBtn');
  const clearBtn = container.querySelector('#agoraQuoteClear');

  // ციტატის preview განახლება
  agoraUpdateQuotePreview();

  ta.addEventListener('input', function() {
    countEl.textContent = ta.value.length;
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      _agoraQuote = null;
      agoraUpdateQuotePreview();
    });
  }

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
// quote preview-ს განახლება
// ============================================================
function agoraUpdateQuotePreview() {
  const preview = document.getElementById('agoraQuotePreview');
  const text    = document.getElementById('agoraQuotePreviewText');
  if (!preview || !text) return;

  if (_agoraQuote) {
    const snippet = _agoraQuote.body.length > 120
      ? _agoraQuote.body.substring(0, 120) + '…'
      : _agoraQuote.body;
    text.innerHTML = `<strong>↩ ${agoraEscape(_agoraQuote.author)} #${_agoraQuote.num}:</strong> ${agoraEscape(snippet)}`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
    text.innerHTML = '';
  }
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
  // reset form
  const titleEl   = document.getElementById('newThreadTitle');
  const bodyEl    = document.getElementById('newThreadBody');
  const countEl   = document.getElementById('newThreadBodyCount');
  const errEl     = document.getElementById('newThreadError');
  if (titleEl) titleEl.value = '';
  if (bodyEl)  bodyEl.value  = '';
  if (countEl) countEl.textContent = '0';
  if (errEl)   { errEl.textContent = ''; errEl.classList.remove('active'); }
  openModal('newThreadModal');
  setTimeout(() => titleEl?.focus(), 100);
}

async function agoraSubmitNewThread() {
  const title    = document.getElementById('newThreadTitle')?.value.trim();
  const body     = document.getElementById('newThreadBody')?.value.trim();
  const errEl    = document.getElementById('newThreadError');
  const btn      = document.getElementById('newThreadSubmitBtn');

  agoraClearError('newThreadError');

  if (!title || title.length < 5) {
    agoraShowError('newThreadError', 'სათაური მინ. 5 სიმბოლო');
    return;
  }
  if (!body || body.length < 10) {
    agoraShowError('newThreadError', 'შინაარსი მინ. 10 სიმბოლო');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'AI ამოწმებს...';

  const token    = await agoraGetValidToken();
  const user     = agoraGetUser();
  const authorName   = user?.nickname || localStorage.getItem('userNickname') || 'მომხმარებელი';
  const authorAvatar = user?.photoURL || null;

  try {
    const { ok, data } = await agoraFetch({
      action: 'create-thread',
      title,
      threadBody: body,
      userToken:  token,
      authorName,
      authorAvatar
    });

    if (!ok) {
      if (data.warned) {
        agoraShowWarningToast(data.message, data.banned);
        if (data.banned) {
          closeModal('newThreadModal');
        }
      } else {
        agoraShowError('newThreadError', data.error || 'შეცდომა');
      }
      return;
    }

    closeModal('newThreadModal');
    showToast('✅ თემა გაიხსნა!', 'success');

    // topicsCount — local განახლება (profile popup-ისთვის)
    try {
      if (typeof currentUser !== 'undefined' && currentUser) {
        currentUser.topicsCount = (currentUser.topicsCount || 0) + 1;
        const st = document.getElementById('statTopics');
        if (st) st.textContent = currentUser.topicsCount;
      }
    } catch { /* silent */ }

    agoraOpenThread(data.threadId);

  } catch (e) {
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

    // ციტატა
    if (_agoraQuote) {
      payload.quotedReplyId = _agoraQuote.id;
      payload.quotedBody    = _agoraQuote.body;
      payload.quotedAuthor  = _agoraQuote.author;
      payload.quotedNum     = _agoraQuote.num;
    }

    const { ok, data } = await agoraFetch(payload);

    if (!ok) {
      if (data.warned) {
        agoraShowWarningToast(data.message, data.banned);
      } else {
        agoraShowError('replyError', data.error || 'შეცდომა');
      }
      return;
    }

    ta.value = '';
    const countEl = document.getElementById('replyCharCount');
    if (countEl) countEl.textContent = '0';

    // ციტატის გასუფთავება
    _agoraQuote = null;
    agoraUpdateQuotePreview();

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
function agoraShowWarningToast(message, isBanned) {
  // ადრინდელი ტოსტი წაშლა
  const old = document.getElementById('__agora_warn__');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = '__agora_warn__';
  el.className = 'agora-warn-toast';
  el.textContent = message;
  document.body.appendChild(el);

  const timeout = isBanned ? 8000 : 5000;
  setTimeout(() => el.remove(), timeout);

  if (isBanned) {
    // 60 დღიანი ბანი — სესიის გასუფთავება
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
// INIT — event listeners
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // header agora button
  const agoraBtn = document.getElementById('agoraBtn');
  if (agoraBtn) {
    agoraBtn.addEventListener('click', openAgora);
  }

  // back button — სიაზე დაბრუნება
  const backBtn = document.getElementById('agoraBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      _agoraQuote = null;
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
