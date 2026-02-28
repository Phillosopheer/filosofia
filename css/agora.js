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
  return window.userToken || localStorage.getItem('userToken') || localStorage.getItem('idToken') || null;
}

function agoraGetUser() {
  return window.currentUser || null;
}

function agoraIsAdmin() {
  return !!(window.idToken);
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
    ? `<img class="agora-author-avatar" src="${agoraEscape(t.authorAvatar)}" alt="" loading="lazy">`
    : `<div class="agora-author-avatar agora-author-avatar-placeholder">${agoraEscape((t.authorName||'?')[0].toUpperCase())}</div>`;

  return `
    <div class="agora-thread-header">
      <div class="agora-thread-header-title">${agoraEscape(t.title)}</div>
      <div class="agora-thread-header-meta">
        ${avatarHtml}
        <span class="agora-reply-author">${agoraEscape(t.authorName)}</span>
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
        <div id="threadInlineEdit" class="agora-inline-edit" style="display:none">
          <input type="text" id="editThreadTitle" class="agora-modal-input" maxlength="120" value="${agoraEscape(t.title)}" />
          <textarea id="editThreadBody" class="agora-textarea" style="margin-top:8px" maxlength="2000">${agoraEscape(t.body)}</textarea>
          <div class="agora-inline-edit-btns">
            <button class="agora-reply-submit" id="editThreadSaveBtn">შენახვა</button>
            <button class="agora-action-btn" id="editThreadCancelBtn">გაუქმება</button>
          </div>
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
      const editDiv = document.getElementById('threadInlineEdit');
      const bodyDiv = document.getElementById('threadBodyDisplay');
      if (editDiv) {
        editDiv.style.display = 'block';
        bodyDiv.style.display = 'none';
        actionsEl.style.display = 'none';
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      showConfirmToast('დარწმუნებული ხარ რომ გსურს ამ თემის წაშლა?', async function() {
        await agoraDeleteThread(thread.id);
      });
    });
  }

  // inline edit form
  const saveBtn   = document.getElementById('editThreadSaveBtn');
  const cancelBtn = document.getElementById('editThreadCancelBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      const newTitle = document.getElementById('editThreadTitle')?.value.trim();
      const newBody  = document.getElementById('editThreadBody')?.value.trim();
      await agoraEditThread(thread.id, newTitle, newBody);
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      document.getElementById('threadInlineEdit').style.display = 'none';
      document.getElementById('threadBodyDisplay').style.display = 'block';
      actionsEl.style.display = 'flex';
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
    ? `<img class="agora-author-avatar" src="${agoraEscape(r.authorAvatar)}" alt="" loading="lazy">`
    : `<div class="agora-author-avatar agora-author-avatar-placeholder">${agoraEscape((r.authorName||'?')[0].toUpperCase())}</div>`;

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
        <span class="agora-reply-author">${agoraEscape(r.authorName)}</span>
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
      ${canEdit ? `
        <div class="agora-inline-edit" id="replyEdit_${agoraEscape(r.id)}" style="display:none">
          <textarea class="agora-textarea reply-edit-textarea" maxlength="2000">${agoraEscape(r.body)}</textarea>
          <div class="agora-inline-edit-btns">
            <button class="agora-reply-submit reply-save-btn" data-reply-id="${agoraEscape(r.id)}">შენახვა</button>
            <button class="agora-action-btn reply-cancel-btn">გაუქმება</button>
          </div>
        </div>
      ` : ''}
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

  if (editBtn && editDiv) {
    editBtn.addEventListener('click', function() {
      editDiv.style.display = 'block';
      editBtn.closest('.agora-item-actions').style.display = 'none';
      bodyDiv.style.display = 'none';
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

  if (saveBtn && editDiv) {
    saveBtn.addEventListener('click', async function() {
      const ta = editDiv.querySelector('textarea');
      if (!ta || !_agoraCurrentThread) return;
      await agoraEditReply(_agoraCurrentThread.id, replyId, ta.value.trim());
    });
  }

  if (cancelBtn && editDiv) {
    cancelBtn.addEventListener('click', function() {
      editDiv.style.display = 'none';
      const actDiv = editDiv.closest('.agora-reply-item').querySelector('.agora-item-actions');
      if (actDiv) actDiv.style.display = 'flex';
      bodyDiv.style.display = 'block';
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
      <textarea class="agora-textarea" id="replyTextarea" maxlength="2000" placeholder="დაწერე კომენტარი..."></textarea>
      <div class="agora-char-count"><span id="replyCharCount">0</span>/2000</div>
      <button class="agora-reply-submit" id="replySubmitBtn">გამოქვეყნება ↑</button>
    </div>`;

  const ta      = container.querySelector('#replyTextarea');
  const countEl = container.querySelector('#replyCharCount');
  const btn     = container.querySelector('#replySubmitBtn');
  const clearBtn = container.querySelector('#agoraQuoteClear');

  // ციტატის preview განახლება
  agoraUpdateQuotePreview();

  ta.addEventListener('input', function() {
    const len = ta.value.length;
    countEl.textContent = len;
    countEl.parentElement.classList.toggle('warn', len > 1800);
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

  const token    = agoraGetToken();
  const user     = agoraGetUser();
  const authorName = user?.nickname || user?.email?.split('@')[0] || 'მომხმარებელი';

  try {
    const { ok, data } = await agoraFetch({
      action: 'create-thread',
      title,
      threadBody: body,
      userToken:  token,
      authorName
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

  const token  = agoraGetToken();
  const user   = agoraGetUser();
  const authorName = user?.nickname || user?.email?.split('@')[0] || 'მომხმარებელი';

  btn.disabled = true;
  btn.textContent = 'AI ამოწმებს...';

  try {
    const payload = {
      action:     'create-reply',
      threadId,
      replyBody:  body,
      userToken:  token,
      authorName
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
  const token = agoraGetToken();
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
  const token = agoraGetToken();
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
  const token = agoraGetToken();
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
  const token = agoraGetToken();
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
});
