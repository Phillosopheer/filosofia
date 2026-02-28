// api/ban-user.js — მომხმარებლის დაბლოკვა (Admin Only)
// Session 37: Firebase Auth disable + fpHash ban + banned-users log

const FIREBASE_DB  = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const PROJECT_ID   = "gen-lang-client-0339684222";
const API_KEY      = "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao";
const ADMIN_UID    = "bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2";

const ALLOWED_ORIGINS = [
  "https://philosoph.vercel.app",
  "https://filosofia-xi.vercel.app"
];

// ===== Service Account → Access Token =====
let cachedToken = null;
let tokenExpiry  = 0;

async function getAdminToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email, sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/identitytoolkit"
  };
  const header = { alg: "RS256", typ: "JWT" };
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const pemBody  = sa.private_key.replace(/-----[^-]+-----/g,"").replace(/\s/g,"");
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const jwt = `${signingInput}.${sigB64}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const tokenData = await tokenRes.json();
  cachedToken = tokenData.access_token;
  tokenExpiry  = Date.now() + 3600000;
  return cachedToken;
}

// ===== Firebase DB REST =====
async function fbGet(path) {
  const token = await getAdminToken();
  const res = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`);
  if (!res.ok) return null;
  return await res.json();
}

async function fbSet(path, data) {
  const token = await getAdminToken();
  const res = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.ok;
}

// ===== Verify idToken + Check Admin =====
async function verifyAdmin(idToken) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const uid = data?.users?.[0]?.localId;
  if (!uid || uid !== ADMIN_UID) return null;
  return uid;
}

// ===== Disable Firebase Auth User =====
async function disableAuthUser(targetUid) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ localId: targetUid, disableUser: true })
    }
  );
  return res.ok;
}

// ===== HANDLER =====
export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, targetUid, reason } = req.body || {};

  if (!idToken || !targetUid) {
    return res.status(400).json({ error: "idToken და targetUid სავალდებულოა" });
  }

  try {
    // 1. Verify admin
    const adminUid = await verifyAdmin(idToken);
    if (!adminUid) {
      return res.status(403).json({ error: "არაავტორიზებული" });
    }

    // 2. Cannot ban yourself
    if (targetUid === ADMIN_UID) {
      return res.status(400).json({ error: "საკუთარი თავის დაბლოკვა შეუძლებელია" });
    }

    // 3. Get user data (fpHash, nickname, email)
    const userData = await fbGet(`/users/${targetUid}`);
    const fpHash   = userData?.fpHash || null;

    // 4. Ban fingerprint if available
    if (fpHash) {
      await fbSet(`/banned-fingerprints/${fpHash}`, {
        bannedAt: Date.now(),
        reason: reason || "admin ban",
        uid: targetUid
      });
    }

    // 5. Log banned user
    await fbSet(`/banned-users/${targetUid}`, {
      bannedAt: Date.now(),
      reason: reason || "admin ban",
      nickname: userData?.nickname || "unknown",
      email: userData?.email || "unknown",
      fpHash: fpHash || null
    });

    // 6. Disable Firebase Auth account
    const authDisabled = await disableAuthUser(targetUid);

    return res.json({
      ok: true,
      fpHash: fpHash,
      authDisabled,
      message: fpHash
        ? "✅ დაბლოკილია: Auth + fingerprint + DB"
        : "✅ დაბლოკილია: Auth + DB (fpHash არ ჰქონდა)"
    });

  } catch (e) {
    console.error("ban-user error:", e);
    return res.status(500).json({ error: "სერვერის შეცდომა: " + e.message });
  }
}
