/* extras.js — ოქროს ნაწილაკები */
'use strict';

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
