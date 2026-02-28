// ============================================================
// api/reset-password.js
// პაროლის აღდგენა ელ. ფოსტით
// Session 41: send (კოდი) + reset (პაროლის შეცვლა)
// ============================================================

const BREVO_KEY   = process.env.BREVO_KEY;
const FIREBASE_DB = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const PROJECT_ID  = "gen-lang-client-0339684222";

// ============================================================
// Service Account Token — identitytoolkit scope ჩართულია
// ============================================================
let _cachedToken = null;
let _tokenExpiry = 0;

async function getAdminToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60000) return _cachedToken;
  const sa  = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email, sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
    scope: [
      "https://www.googleapis.com/auth/firebase.database",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/identitytoolkit"
    ].join(" ")
  };
  const header = { alg: "RS256", typ: "JWT" };
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const pemBody   = sa.private_key.replace(/-----[^-]+-----/g,"").replace(/\s/g,"");
  const keyBytes  = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const sig    = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const jwt    = `${signingInput}.${sigB64}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const tokenData  = await tokenRes.json();
  _cachedToken = tokenData.access_token;
  _tokenExpiry  = Date.now() + 3600000;
  return _cachedToken;
}

// ============================================================
// ფუნქცია: lookupUidByEmail
// Firebase Auth Admin API-ით UID-ის მოძიება ელ. ფოსტით
// ============================================================
async function lookupUidByEmail(email) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email: [email] })
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.users?.[0]?.localId || null;
}

// ============================================================
// ფუნქცია: updateUserPassword
// Firebase Auth Admin API-ით პაროლის შეცვლა
// ============================================================
async function updateUserPassword(uid, newPassword) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ localId: uid, password: newPassword })
    }
  );
  return res.ok;
}

// ============================================================
// in-memory კოდების შენახვა
// Map გასაღები: email
// მნიშვნელობა: { code, expires, sentAt, attempts }
// ============================================================
const resetCodes = new Map();

// ============================================================
// მთავარი handler
// ============================================================
export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "https://philosoph.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const { action, email, code, newPassword } = req.body || {};

  // ---- ელ. ფოსტის ვალიდაცია ----
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "ელ. ფოსტა არასწორია" });
  }


  // ============================================================
  // action: 'send' — კოდის გაგზავნა
  // ============================================================
  if (action === "send") {

    // Rate limit: 1 კოდი 2 წუთში
    const existing = resetCodes.get(email);
    if (existing && Date.now() < existing.sentAt + 120000) {
      const secs = Math.ceil((existing.sentAt + 120000 - Date.now()) / 1000);
      return res.status(429).json({ error: `⏳ გთხოვ ${secs} წამი დაიცადო` });
    }

    // 6-ნიშნა კოდი
    const code6 = String(Math.floor(100000 + Math.random() * 900000));

    // Map-ში ვინახავთ — 10 წუთი ვადა
    resetCodes.set(email, {
      code:     code6,
      expires:  Date.now() + 10 * 60 * 1000,
      sentAt:   Date.now(),
      attempts: 0
    });

    // Brevo-ით კოდის გაგზავნა
    try {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key":      BREVO_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender:  { name: "ფილოსოფია", email: "nodoqebadze21@gmail.com" },
          to:      [{ email }],
          subject: "პაროლის აღდგენა — ფილოსოფია",
          htmlContent: `
            <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#0e0c0a;color:#e8e0d0;padding:40px;border-radius:12px;border:1px solid #3a3020;">
              <h2 style="color:#c9a84c;font-size:1.4rem;margin-bottom:8px;">ΦΙΛΟΣΟΦΙΑ</h2>
              <p style="color:#9a9080;font-size:0.85rem;margin-bottom:28px;">ქართული ფილოსოფიური პლატფორმა</p>
              <p style="margin-bottom:16px;">პაროლის აღდგენის კოდია:</p>
              <div style="background:#1a1610;border:1px solid #c9a84c;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:2.4rem;letter-spacing:12px;color:#c9a84c;font-weight:bold;">${code6}</span>
              </div>
              <p style="color:#9a9080;font-size:0.8rem;">კოდი 10 წუთის განმავლობაში მოქმედებს.<br>თუ შენ არ მოითხოვე — უგულვებელყავი.</p>
            </div>
          `
        })
      });

      if (!r.ok) {
        const errBody = await r.text();
        console.error("Brevo reset error:", r.status, errBody);
        resetCodes.delete(email);
        if (r.status === 401) return res.status(500).json({ error: "🔑 სერვერის კონფიგურაციის შეცდომა" });
        if (r.status === 429) return res.status(500).json({ error: "⏳ დღიური ლიმიტი ამოიწურა. ხვალ სცადე." });
        return res.status(500).json({ error: `📧 კოდის გაგზავნა ვერ მოხერხდა (${r.status})` });
      }

      return res.json({ ok: true });

    } catch (e) {
      console.error("Brevo fetch error:", e.message);
      resetCodes.delete(email);
      return res.status(500).json({ error: "📡 სერვერის კავშირის შეცდომა. სცადე ხელახლა." });
    }
  }


  // ============================================================
  // action: 'reset' — კოდის შემოწმება + პაროლის შეცვლა
  // ============================================================
  if (action === "reset") {

    // ---- პაროლის ვალიდაცია ----
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "პაროლი მინ. 6 სიმბოლო უნდა იყოს" });
    }

    // ---- კოდის შემოწმება ----
    if (!code) {
      return res.status(400).json({ error: "კოდი ცარიელია" });
    }

    const entry = resetCodes.get(email);
    if (!entry) {
      return res.status(400).json({ error: "კოდი ვადაგასულია. სცადე ხელახლა." });
    }

    if (Date.now() > entry.expires) {
      resetCodes.delete(email);
      return res.status(400).json({ error: "კოდი ვადაგასულია. სცადე ხელახლა." });
    }

    if (entry.code !== String(code).trim()) {
      entry.attempts = (entry.attempts || 0) + 1;
      if (entry.attempts >= 5) {
        resetCodes.delete(email);
        return res.status(400).json({ error: "კოდი 5-ჯერ არასწორად შეიყვანე. სცადე ხელახლა." });
      }
      const left = 5 - entry.attempts;
      return res.status(400).json({ error: `კოდი არასწორია. დარჩენილია ${left} მცდელობა.` });
    }

    // კოდი სწორია — ვიძებთ UID-ს
    let uid;
    try {
      uid = await lookupUidByEmail(email);
    } catch (e) {
      console.error("lookupUidByEmail error:", e.message);
      return res.status(500).json({ error: "📡 სერვერის შეცდომა. სცადე ხელახლა." });
    }

    if (!uid) {
      resetCodes.delete(email);
      return res.status(404).json({ error: "🔍 ამ ელ. ფოსტით ანგარიში ვერ მოიძებნა." });
    }

    // პაროლის შეცვლა
    let ok;
    try {
      ok = await updateUserPassword(uid, newPassword);
    } catch (e) {
      console.error("updateUserPassword error:", e.message);
      return res.status(500).json({ error: "📡 სერვერის შეცდომა. სცადე ხელახლა." });
    }

    if (!ok) {
      return res.status(500).json({ error: "⚠️ პაროლის შეცვლა ვერ მოხერხდა. სცადე ხელახლა." });
    }

    // წარმატება — კოდი ვშლით
    resetCodes.delete(email);
    return res.json({ ok: true });
  }


  // ---- უცნობი action ----
  return res.status(400).json({ error: "უცნობი მოთხოვნა" });
}
