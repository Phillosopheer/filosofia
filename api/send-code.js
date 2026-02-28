// ============================================================
// api/send-code.js
// დანიშნულება: მომხმარებლის ელ. ფოსტაზე 6-ნიშნა კოდის გაგზავნა
// გამოიძახება: რეგისტრაციის 1-ლი ნაბიჯზე "კოდის გაგზავნა →" ღილაკზე
// Session 37: + VPN/Proxy/Tor ბლოკი + fpHash ბანი + Incognito ბლოკი
// Session 38: + Brevo API (Resend-ის ნაცვლად) + დეტალური შეცდომები
// ============================================================

// Brevo API გასაღები — Vercel Environment Variables-იდან
// Brevo უფასოა, 300 email/დღე, ნებისმიერ email-ზე გაგზავნს
const BREVO_KEY   = process.env.BREVO_KEY;

// Firebase Realtime Database-ის მისამართი — banned-fingerprints-ის შესამოწმებლად
const FIREBASE_DB = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";


// ============================================================
// ფუნქცია: isVPN(ip)
// დანიშნულება: ამოწმებს, არის თუ არა მომხმარებლის IP — VPN, Proxy ან Tor
// გამოიძახება: კოდის გაგზავნამდე, სერვერზე
// API: ip-api.com — უფასო, 45 მოთხოვნა/წუთამდე
// ============================================================
async function isVPN(ip) {
  // თუ IP ცარიელია, უცნობია, ან localhost-ია — ნუ ვბლოკავთ
  if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.')) return false;
  try {
    // ip-api.com-ს ვეკითხებით: ეს IP VPN-ია, Proxy-ია ან Hosting-ია?
    // fields=status,proxy,hosting — მხოლოდ ეს ველები გვჭირდება (სწრაფია)
    const res  = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`);
    const data = await res.json();

    // თუ API-მ გვიპასუხა 'success' და proxy=true ან hosting=true → VPN/Proxy ჩაითვლება
    return data.status === 'success' && (data.proxy === true || data.hosting === true);
  } catch {
    // თუ ip-api.com მიუწვდომელია — ნუ ვბლოკავთ (false = OK)
    return false;
  }
}


// ============================================================
// ფუნქცია: isFpBanned(fpHash)
// დანიშნულება: ამოწმებს, ხომ არ არის მოწყობილობა (Browser Fingerprint) დაბლოკილი
// Firebase-ში ადმინი წერს: /banned-fingerprints/{fpHash} = { reason, bannedAt }
// ============================================================
async function isFpBanned(fpHash) {
  // თუ fpHash ცარიელია — ვერ ვამოწმებთ, ნუ ვბლოკავთ
  if (!fpHash) return false;
  try {
    // Firebase-ს ვეკითხებით: ეს fingerprint ბანის სიაშია?
    const res  = await fetch(`${FIREBASE_DB}/banned-fingerprints/${fpHash}.json`);
    if (!res.ok) return false;
    const data = await res.json();

    // null → ბანი არ არის | ობიექტი → ბანია
    return data !== null;
  } catch {
    // Firebase-სთან კავშირი ვერ მოხდა — ნუ ვბლოკავთ
    return false;
  }
}


// ============================================================
// კოდების in-memory შენახვა
// Map() — გასაღები: email, მნიშვნელობა: { code, expires, sentAt, attempts }
// სერვერი გადაიტვირთება → კოდები იშლება (ნორმალურია Vercel-ზე)
// ============================================================
const codes = new Map();


// ============================================================
// მთავარი handler — Vercel-ი ამ ფუნქციას ეძახის POST /api/send-code-ზე
// ============================================================
export default async function handler(req, res) {

  // CORS Headers — მხოლოდ ჩვენი საიტიდან მოთხოვნები მიიღება
  res.setHeader('Access-Control-Allow-Origin', 'https://philosoph.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS — browser-ი ჯერ "კარზე აკაკუნებს" (preflight), ვუპასუხებთ OK-ით
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET, PUT და სხვა მეთოდები — არ მივიღებთ
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // request body-დან ამოვიღებთ: email, action, fpHash (fingerprint), incognito (bool)
  const { email, action, fpHash, incognito } = req.body || {};


  // ============================================================
  // სექცია: კოდის შემოწმება (action === 'verify')
  // გამოიძახება: step 2-ზე, მომხმარებელი შეიყვანს კოდს
  // ============================================================
  if (action === 'verify') {
    const { code } = req.body;

    // Map-ში ვეძებთ ამ email-ის ჩანაწერს
    const entry = codes.get(email);

    // თუ ჩანაწერი არ არის — კოდი ვადაგასულია ან არასოდეს გაგზავნილა
    if (!entry) return res.status(400).json({ ok: false, error: 'კოდი ვადაგასულია' });

    // თუ 5 წუთი გავიდა (Date.now() > expires) — კოდი ვადაგასულია
    if (Date.now() > entry.expires) {
      codes.delete(email);
      return res.status(400).json({ ok: false, error: 'კოდი ვადაგასულია' });
    }

    // კოდი სწორია? ვადარებთ — String() + trim() რომ spaces/numbers პრობლემა არ იყოს
    if (entry.code !== String(code).trim()) {
      entry.attempts = (entry.attempts || 0) + 1;

      // 5 მცდელობის შემდეგ კოდი ბათილდება (brute-force დაცვა)
      if (entry.attempts >= 5) codes.delete(email);
      return res.status(400).json({ ok: false, error: 'კოდი არასწორია' });
    }

    // კოდი სწორია! ვშლით Map-იდან (ერთხელ გამოყენება)
    codes.delete(email);
    return res.json({ ok: true });
  }


  // ============================================================
  // სექცია: კოდის გაგზავნა
  // ============================================================

  // Email ფორმატის ვალიდაცია
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email არასწორია' });
  }


  // ---- უსაფრთხოების შემოწმება #1: Incognito ----
  // script.js-ი detectIncognito()-ს ეძახის client-side და შედეგს გვიგზავნის
  // incognito === true → ვუარყოფთ რეგისტრაციას
  if (incognito === true) {
    return res.status(403).json({
      error: '🔒 Incognito / Private რეჟიმში რეგისტრაცია დაუშვებელია. გთხოვ გახსენი ჩვეულებრივი ბრაუზერი.'
    });
  }


  // ---- უსაფრთხოების შემოწმება #2: VPN / Proxy / Tor ----
  // x-forwarded-for — Vercel ამატებს (შეიძლება მრავალი IP იყოს, პირველი გვჭირდება)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
          || req.headers['x-real-ip']
          || req.socket?.remoteAddress
          || 'unknown';

  const vpn = await isVPN(ip);
  if (vpn) {
    return res.status(403).json({
      error: '🌐 VPN, Proxy ან Tor-ის გამოყენება რეგისტრაციისას დაუშვებელია. გამორთე VPN და სცადე ხელახლა.'
    });
  }


  // ---- უსაფრთხოების შემოწმება #3: Browser Fingerprint ბანი ----
  // ადმინი ბანავს → /banned-fingerprints/{fpHash} Firebase-ში
  if (fpHash && await isFpBanned(fpHash)) {
    return res.status(403).json({
      error: '🚫 შენი მოწყობილობა ამ საიტზე დაბლოკილია.'
    });
  }


  // ---- Rate Limit: ერთ email-ზე 1 კოდი 1 წუთში ----
  const existing = codes.get(email);
  if (existing && Date.now() < existing.sentAt + 60000) {
    return res.status(429).json({ error: '⏳ გთხოვ 1 წუთი დაიცადო შემდეგ მცდელობამდე' });
  }


  // ---- 6-ნიშნა შემთხვევითი კოდის გენერაცია ----
  // Math.random() * 900000 + 100000 → ყოველთვის 6 ნიშნა (100000-999999)
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Map-ში ვინახავთ კოდს + ვადას (5 წუთი) + გაგზავნის დროს + მცდელობების მთვლელს
  codes.set(email, {
    code,
    expires:  Date.now() + 5 * 60 * 1000, // 5 წუთი ms-ში
    sentAt:   Date.now(),                   // rate limit-ისთვის
    attempts: 0                             // brute-force დაცვა
  });


  // ---- Brevo API-ით ელ. ფოსტის გაგზავნა ----
  // Brevo = Sendinblue, უფასო 300 email/დღე, ნებისმიერ email-ზე გაგზავნს!
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,        // Brevo-ს გასაღები (Authorization-ის ნაცვლად)
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // გამგზავნი — Brevo-ს account email (ჩვენი Brevo ანგარიშის email)
        sender: {
          name:  'ფილოსოფია',
          email: 'nodoqebadze21@gmail.com'  // Brevo ანგარიშის email
        },
        // მიმღებთა სია — მომხმარებლის email
        to: [{ email }],
        subject: 'რეგისტრაციის კოდი — ფილოსოფია',
        // HTML ტექსტი — ლამაზი ფორმატი
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

    // Brevo-მ შეცდომა დააბრუნა
    if (!r.ok) {
      const errBody = await r.text();
      console.error('Brevo error:', r.status, errBody);

      // 401 — BREVO_KEY არასწორია
      if (r.status === 401) {
        return res.status(500).json({ error: '🔑 სერვერის კონფიგურაციის შეცდომა (Brevo გასაღები)' });
      }
      // 429 — ძალიან ბევრი მოთხოვნა (300/დღე ლიმიტი)
      if (r.status === 429) {
        return res.status(500).json({ error: '⏳ დღიური ლიმიტი ამოიწურა. ხვალ სცადე.' });
      }
      // 400 — Email ფორმატი ან სხვა ვალიდაციის შეცდომა
      if (r.status === 400) {
        return res.status(500).json({ error: '📧 Email მისამართი არასწორია' });
      }
      return res.status(500).json({ error: `📧 კოდის გაგზავნა ვერ მოხერხდა (შეცდომა ${r.status})` });
    }

    // ყველაფერი კარგად! კოდი გაიგზავნა.
    return res.json({ ok: true });

  } catch (e) {
    // ქსელის პრობლემა — Brevo მიუწვდომელია
    console.error('Brevo fetch error:', e.message);
    return res.status(500).json({ error: '📡 სერვერის კავშირის შეცდომა. სცადე ხელახლა.' });
  }
}
