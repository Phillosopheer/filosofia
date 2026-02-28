// ============================================================
// api/send-code.js
// დანიშნულება: მომხმარებლის ელ. ფოსტაზე 6-ნიშნა კოდის გაგზავნა
// Session 37: + VPN/Proxy/Tor ბლოკი + fpHash ბანი + Incognito ბლოკი
// Session 38: + Brevo API + დეტალური შეცდომები + IP ბანი
// ============================================================

// Brevo API გასაღები — Vercel Environment Variables-იდან
const BREVO_KEY   = process.env.BREVO_KEY;

// Firebase Realtime Database-ის მისამართი
const FIREBASE_DB = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";


// ============================================================
// ფუნქცია: isVPN(ip)
// ამოწმებს, არის თუ არა IP — VPN, Proxy ან Tor
// ip-api.com — უფასო, 45 მოთხოვნა/წუთამდე
// ============================================================
async function isVPN(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.')) return false;
  try {
    const res  = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`);
    const data = await res.json();
    return data.status === 'success' && (data.proxy === true || data.hosting === true);
  } catch {
    return false;
  }
}


// ============================================================
// ფუნქცია: isFpBanned(fpHash)
// ამოწმებს, ხომ არ არის Browser Fingerprint დაბლოკილი
// Firebase: /banned-fingerprints/{fpHash}
// ============================================================
async function isFpBanned(fpHash) {
  if (!fpHash) return false;
  try {
    const res  = await fetch(`${FIREBASE_DB}/banned-fingerprints/${fpHash}.json`);
    if (!res.ok) return false;
    const data = await res.json();
    return data !== null;
  } catch {
    return false;
  }
}


// ============================================================
// ფუნქცია: isIpBanned(ip)
// ამოწმებს, ხომ არ არის IP მისამართი დაბლოკილი
// Firebase: /banned-ips/{ip_with_underscores}
// (Firebase key-ში წერტილი არ შეიძლება → ვანაცვლებთ _-ით)
// ============================================================
async function isIpBanned(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.')) return false;
  try {
    // IP-ში წერტილებს ვანაცვლებთ _-ით, Firebase key-ისთვის
    // მაგ: 192.168.1.1 → 192_168_1_1
    const safeIp = ip.replace(/\./g, '_').replace(/:/g, '_');
    const res    = await fetch(`${FIREBASE_DB}/banned-ips/${safeIp}.json`);
    if (!res.ok) return false;
    const data = await res.json();
    return data !== null;
  } catch {
    return false;
  }
}


// ============================================================
// კოდების in-memory შენახვა
// Map() — გასაღები: email
// მნიშვნელობა: { code, expires, sentAt, attempts, ip }
// ip — ვინახავთ verify-ზე გასაცემად, doRegister-ი Firebase-ში ჩაწერს
// ============================================================
const codes = new Map();


// ============================================================
// მთავარი handler
// ============================================================
export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', 'https://philosoph.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, action, fpHash, incognito } = req.body || {};


  // ============================================================
  // სექცია: კოდის შემოწმება (action === 'verify')
  // გამოიძახება: step 2-ზე, მომხმარებელი კოდს შეიყვანს
  // ============================================================
  if (action === 'verify') {
    const { code } = req.body;
    const entry = codes.get(email);

    if (!entry) return res.status(400).json({ ok: false, error: 'კოდი ვადაგასულია' });

    if (Date.now() > entry.expires) {
      codes.delete(email);
      return res.status(400).json({ ok: false, error: 'კოდი ვადაგასულია' });
    }

    if (entry.code !== String(code).trim()) {
      entry.attempts = (entry.attempts || 0) + 1;
      if (entry.attempts >= 5) codes.delete(email);
      return res.status(400).json({ ok: false, error: 'კოდი არასწორია' });
    }

    // კოდი სწორია! IP-საც ვაბრუნებთ — script.js პროფილში ჩაწერს
    const userIp = entry.ip || null;
    codes.delete(email);
    return res.json({ ok: true, ip: userIp });
  }


  // ============================================================
  // სექცია: კოდის გაგზავნა
  // ============================================================

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email არასწორია' });
  }

  // მომხმარებლის IP-ს ამოღება
  // x-forwarded-for — Vercel ამატებს (შეიძლება მრავალი IP, პირველი გვჭირდება)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
          || req.headers['x-real-ip']
          || req.socket?.remoteAddress
          || 'unknown';


  // ---- შემოწმება #1: Incognito ----
  if (incognito === true) {
    return res.status(403).json({
      error: '🔒 Incognito / Private რეჟიმში რეგისტრაცია დაუშვებელია. გთხოვ გახსენი ჩვეულებრივი ბრაუზერი.'
    });
  }

  // ---- შემოწმება #2: VPN / Proxy / Tor ----
  const vpn = await isVPN(ip);
  if (vpn) {
    return res.status(403).json({
      error: '🌐 VPN, Proxy ან Tor-ის გამოყენება რეგისტრაციისას დაუშვებელია. გამორთე VPN და სცადე ხელახლა.'
    });
  }

  // ---- შემოწმება #3: IP ბანი ----
  // ადმინი ბანავს → /banned-ips/{safeIp} Firebase-ში
  if (await isIpBanned(ip)) {
    return res.status(403).json({
      error: '🚫 შენი IP მისამართი ამ საიტზე დაბლოკილია.'
    });
  }

  // ---- შემოწმება #4: Browser Fingerprint (სავალდებულო) ----
  // fpHash სავალდებულოა — null-ის შემთხვევაში ვუარყოფთ
  if (!fpHash) {
    return res.status(403).json({
      error: '🚫 ბრაუზერის ვერიფიკაცია ვერ მოხერხდა. სცადე ჩვეულებრივ ბრაუზერში.'
    });
  }
  // ადმინი ბანავს → /banned-fingerprints/{fpHash} Firebase-ში
  if (await isFpBanned(fpHash)) {
    return res.status(403).json({
      error: '🚫 შენი მოწყობილობა ამ საიტზე დაბლოკილია.'
    });
  }

  // ---- Rate Limit: 1 კოდი 1 წუთში ----
  const existing = codes.get(email);
  if (existing && Date.now() < existing.sentAt + 60000) {
    return res.status(429).json({ error: '⏳ გთხოვ 1 წუთი დაიცადო შემდეგ მცდელობამდე' });
  }

  // ---- 6-ნიშნა კოდის გენერაცია ----
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Map-ში ვინახავთ კოდს + IP-ს (verify-ზე გასაცემად)
  codes.set(email, {
    code,
    expires:  Date.now() + 5 * 60 * 1000,
    sentAt:   Date.now(),
    attempts: 0,
    ip        // IP ვინახავთ — doRegister-ი Firebase-ში ჩაწერს lastIp-ად
  });


  // ---- Brevo API-ით ელ. ფოსტის გაგზავნა ----
  // Brevo = 300 email/დღე უფასოდ, ნებისმიერ email-ზე გაგზავნს
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender:  { name: 'ფილოსოფია', email: 'nodoqebadze21@gmail.com' },
        to:      [{ email }],
        subject: 'რეგისტრაციის კოდი — ფილოსოფია',
        htmlContent: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#0e0c0a;color:#e8e0d0;padding:40px;border-radius:12px;border:1px solid #3a3020;">
            <h2 style="color:#c9a84c;font-size:1.4rem;margin-bottom:8px;">ΦΙΛΟΣΟΦΙΑ</h2>
            <p style="color:#9a9080;font-size:0.85rem;margin-bottom:28px;">ქართული ფილოსოფიური პლატფორმა</p>
            <p style="margin-bottom:16px;">შენი დადასტურების კოდია:</p>
            <div style="background:#1a1610;border:1px solid #c9a84c;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-size:2.4rem;letter-spacing:12px;color:#c9a84c;font-weight:bold;">${code}</span>
            </div>
            <p style="color:#9a9080;font-size:0.8rem;">კოდი 5 წუთის განმავლობაში მოქმედებს.<br>თუ შენ არ გამოიგზავნე — უგულვებელყავი.</p>
          </div>
        `
      })
    });

    if (!r.ok) {
      const errBody = await r.text();
      console.error('Brevo error:', r.status, errBody);
      if (r.status === 401) return res.status(500).json({ error: '🔑 სერვერის კონფიგურაციის შეცდომა (Brevo გასაღები)' });
      if (r.status === 429) return res.status(500).json({ error: '⏳ დღიური ლიმიტი ამოიწურა. ხვალ სცადე.' });
      if (r.status === 400) return res.status(500).json({ error: '📧 Email მისამართი არასწორია' });
      return res.status(500).json({ error: `📧 კოდის გაგზავნა ვერ მოხერხდა (შეცდომა ${r.status})` });
    }

    return res.json({ ok: true });

  } catch (e) {
    console.error('Brevo fetch error:', e.message);
    return res.status(500).json({ error: '📡 სერვერის კავშირის შეცდომა. სცადე ხელახლა.' });
  }
}
