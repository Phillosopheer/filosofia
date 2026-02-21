/* extras.js — ნაწილაკები + footer ბმულები */
'use strict';

// ━━━━━━━━━━━━━━━━ PARTICLES ━━━━━━━━━━━━━━━━
(function initParticles() {
  var c = document.getElementById('particles');
  if (!c) return;
  for (var i = 0; i < 22; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    var sz = (Math.random() * 1.5 + 0.5).toFixed(1);
    p.style.left   = (Math.random() * 100).toFixed(1) + '%';
    p.style.width  = sz + 'px';
    p.style.height = sz + 'px';
    p.style.animationDuration = (Math.random() * 15 + 10).toFixed(1) + 's';
    p.style.animationDelay    = (Math.random() * 12).toFixed(1) + 's';
    c.appendChild(p);
  }
})();

// ━━━━━━━━━━━━━━━━ FOOTER LINKS ━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', function() {
  // Glossary footer link
  var footerGl = document.getElementById('footerGlossaryLink');
  var glossaryBtn = document.getElementById('glossaryOpenBtn');
  if (footerGl && glossaryBtn) {
    footerGl.addEventListener('click', function(e) {
      e.preventDefault();
      glossaryBtn.click();
    });
  }

  // Categories footer link (opens sidebar)
  var footerCat = document.getElementById('footerCatLink');
  var menuBtn   = document.getElementById('menuBtn');
  if (footerCat && menuBtn) {
    footerCat.addEventListener('click', function(e) {
      e.preventDefault();
      menuBtn.click();
    });
  }
});
