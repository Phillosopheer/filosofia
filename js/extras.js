/* extras.js — ოქროს ნაწილაკები */
'use strict';

// ===== მობილური Console (admin-only) =====
(function initMobileConsole() {
  var logs = [];
  var orig = { log: console.log, warn: console.warn, error: console.error };
  ['log','warn','error'].forEach(function(type) {
    console[type] = function() {
      var msg = Array.from(arguments).map(function(a) {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
      }).join(' ');
      logs.push({ type: type, msg: msg, time: new Date().toLocaleTimeString() });
      if (logs.length > 200) logs.shift();
      var badge = document.getElementById('_mob_con_badge');
      if (badge && type === 'error') { badge.style.display = 'flex'; badge.innerText = (parseInt(badge.innerText)||0)+1; }
      orig[type].apply(console, arguments);
    };
  });
  window.addEventListener('error', function(e) {
    console.error('[JS] ' + e.message + ' (' + (e.filename||'').split('/').pop() + ':' + e.lineno + ')');
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.error('[Promise] ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
  });

  function openConsole() {
    var existing = document.getElementById('_mob_console_panel');
    if (existing) { existing.remove(); return; }
    var panel = document.createElement('div');
    panel.id = '_mob_console_panel';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:55vh;background:#111;border-top:2px solid #c9a84c;z-index:99999;display:flex;flex-direction:column;font-family:monospace;font-size:11px;';
    var header = document.createElement('div');
    header.style.cssText = 'background:#1e1a15;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;color:#c9a84c;font-size:12px;flex-shrink:0;';
    var clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear';
    clearBtn.style.cssText = 'background:#333;color:#fff;border:none;padding:2px 8px;cursor:pointer;font-size:11px;margin-right:6px;';
    clearBtn.onclick = function() { area.innerHTML = ''; };
    var closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = 'background:#c9a84c;color:#000;border:none;padding:2px 8px;cursor:pointer;font-size:11px;';
    closeBtn.onclick = function() { panel.remove(); };
    var title = document.createElement('span');
    title.innerText = '📟 Console (' + logs.length + ' ჩანაწერი)';
    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:4px;';
    btns.appendChild(clearBtn);
    btns.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(btns);
    var area = document.createElement('div');
    area.style.cssText = 'flex:1;overflow-y:auto;padding:6px 10px;';
    logs.forEach(function(l) {
      var d = document.createElement('div');
      d.style.cssText = 'margin-bottom:3px;padding:2px 0;border-bottom:1px solid #222;color:'+(l.type==='error'?'#ef4444':l.type==='warn'?'#f59e0b':'#aaa')+';word-break:break-all;white-space:pre-wrap;';
      d.innerText = '['+l.time+'] '+l.msg;
      area.appendChild(d);
    });
    panel.appendChild(header);
    panel.appendChild(area);
    document.body.appendChild(panel);
    area.scrollTop = area.scrollHeight;
  }

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.createElement('button');
    btn.id = '_mob_con_btn';
    btn.title = 'Console';
    btn.style.cssText = 'display:none;position:fixed;bottom:90px;left:12px;width:40px;height:40px;border-radius:50%;background:#1e1a15;border:1px solid #c9a84c;color:#c9a84c;font-size:18px;cursor:pointer;z-index:9999;align-items:center;justify-content:center;';
    btn.innerText = '📟';
    var badge = document.createElement('span');
    badge.id = '_mob_con_badge';
    badge.style.cssText = 'display:none;position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;align-items:center;justify-content:center;font-family:monospace;';
    badge.innerText = '0';
    btn.appendChild(badge);
    btn.onclick = function() { badge.style.display='none'; badge.innerText='0'; openConsole(); };
    document.body.appendChild(btn);

    var observer = new MutationObserver(function() {
      btn.style.display = document.body.classList.contains('admin-mode') ? 'flex' : 'none';
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    btn.style.display = document.body.classList.contains('admin-mode') ? 'flex' : 'none';
  });
})();

// ===== ოქროს ნაწილაკები =====
(function initParticles() {
  var c = document.getElementById('particles');
  if (!c) return;
  for (var i = 0; i < 40; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    var sz = (Math.random() * 3 + 2).toFixed(1);
    p.style.left              = (Math.random() * 100).toFixed(1) + '%';
    p.style.width             = sz + 'px';
    p.style.height            = sz + 'px';
    p.style.animationDuration = (Math.random() * 12 + 8).toFixed(1) + 's';
    p.style.animationDelay    = (Math.random() * 5).toFixed(1) + 's';
    c.appendChild(p);
  }
})();
