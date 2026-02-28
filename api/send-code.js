// api/send-code.js — ვერიფიკაციის კოდის გაგზავნა Resend-ით

const RESEND_KEY   = process.env.RESEND_KEY;
const FIREBASE_DB  = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";

// ===== fpHash ბანის შემოწმება =====
async function isFpBanned(fpHash) {
  if (!fpHash) return false;
  try {
    // banned-fingerprints — public read
    const res = await fetch(`${FIREBASE_DB}/banned-fingerprints/${fpHash}.json`);
    if (!res.ok) return false;
    const data = await res.json();
    return data !== null;
  } catch { return false; }
}

// კოდების in-memory შენახვა (5 წუთი)
const codes = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://philosoph.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, action } = req.body || {};

  // ===== კოდის შემოწმება =====
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
    codes.delete(email);
    return res.json({ ok: true });
  }

  // ===== კოდის გაგზავნა =====
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email არასწორია' });
  }

  // fpHash ბანის შემოწმება
  const { fpHash } = req.body || {};
  if (fpHash && await isFpBanned(fpHash)) {
    return res.status(403).json({ error: '🚫 შენი მოწყობილობა დაბლოკილია.' });
  }

  // Rate limit — ერთ email-ზე 1 კოდი 1 წუთში
  const existing = codes.get(email);
  if (existing && Date.now() < existing.sentAt + 60000) {
    return res.status(429).json({ error: 'გთხოვ 1 წუთი დაიცადო' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(email, { code, expires: Date.now() + 5 * 60 * 1000, sentAt: Date.now(), attempts: 0 });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ფილოსოფია <onboarding@resend.dev>',
        to: email,
        subject: 'რეგისტრაციის კოდი — ფილოსოფია',
        html: `
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
      const err = await r.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'კოდის გაგზავნა ვერ მოხერხდა' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'სერვერის შეცდომა' });
  }
}
