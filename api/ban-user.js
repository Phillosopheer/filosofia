// api/ban-user.js — მომხმარებლების მართვა (Admin Only)
// Session 37: ban + unban + delete + days support + list users

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

async function fbDelete(path) {
  const token = await getAdminToken();
  const res = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
    method: "DELETE"
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

// ===== Firebase Auth: Disable User =====
async function setAuthDisabled(targetUid, disabled) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ localId: targetUid, disableUser: disabled })
    }
  );
  return res.ok;
}

// ===== Firebase Auth: Delete User =====
async function deleteAuthUser(targetUid) {
  const token = await getAdminToken();
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ localId: targetUid })
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

  const { idToken, action, targetUid, reason, days } = req.body || {};

  if (!idToken) return res.status(400).json({ error: "idToken სავალდებულოა" });

  try {
    // Verify admin
    const adminUid = await verifyAdmin(idToken);
    if (!adminUid) return res.status(403).json({ error: "არაავტორიზებული" });

    // ===== LIST USERS =====
    if (action === "list") {
      const usersData = await fbGet("/users");
      if (!usersData) return res.json({ ok: true, users: [] });

      const bannedData = await fbGet("/banned-users") || {};

      const users = Object.entries(usersData)
        .filter(([uid]) => uid !== ADMIN_UID)
        .map(([uid, u]) => ({
          uid,
          nickname: u.nickname || "უცნობი",
          email: u.email || "",
          articlesCount: u.articlesCount || 0,
          createdAt: u.createdAt || 0,
          banned: !!bannedData[uid],
          bannedUntil: bannedData[uid]?.bannedUntil || null,
          banReason: bannedData[uid]?.reason || null
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.json({ ok: true, users });
    }

    // Actions below require targetUid
    if (!targetUid) return res.status(400).json({ error: "targetUid სავალდებულოა" });
    if (targetUid === ADMIN_UID) return res.status(400).json({ error: "ადმინის შეცვლა შეუძლებელია" });

    const userData = await fbGet(`/users/${targetUid}`);

    // ===== BAN =====
    if (action === "ban") {
      const banDays   = parseInt(days) || 999;
      const banUntil  = Date.now() + banDays * 24 * 60 * 60 * 1000;
      const fpHash    = userData?.fpHash || null;

      // Block fingerprint
      if (fpHash) {
        await fbSet(`/banned-fingerprints/${fpHash}`, {
          bannedAt: Date.now(), bannedUntil: banUntil, reason: reason || "admin ban", uid: targetUid
        });
      }

      // Log in banned-users
      await fbSet(`/banned-users/${targetUid}`, {
        bannedAt: Date.now(), bannedUntil: banUntil, banDays,
        reason: reason || "admin ban",
        nickname: userData?.nickname || "unknown",
        email: userData?.email || "unknown",
        fpHash: fpHash || null
      });

      // Disable Firebase Auth
      await setAuthDisabled(targetUid, true);

      return res.json({
        ok: true,
        message: `✅ დაბლოკილია ${banDays} დღით`
      });
    }

    // ===== UNBAN =====
    if (action === "unban") {
      const fpHash = userData?.fpHash || null;

      // Remove fingerprint ban
      if (fpHash) await fbDelete(`/banned-fingerprints/${fpHash}`);

      // Remove from banned-users
      await fbDelete(`/banned-users/${targetUid}`);

      // Enable Firebase Auth
      await setAuthDisabled(targetUid, false);

      return res.json({ ok: true, message: "✅ განბლოკილია" });
    }

    // ===== DELETE =====
    if (action === "delete") {
      const fpHash = userData?.fpHash || null;

      // Remove fingerprint ban entry if exists
      if (fpHash) await fbDelete(`/banned-fingerprints/${fpHash}`);

      // Remove user data
      await fbDelete(`/users/${targetUid}`);

      // Remove from banned-users if exists
      await fbDelete(`/banned-users/${targetUid}`);

      // Remove from usernames
      const nick = userData?.nickname;
      if (nick) await fbDelete(`/usernames/${nick.toLowerCase()}`);

      // Delete Firebase Auth account
      await deleteAuthUser(targetUid);

      return res.json({ ok: true, message: "✅ მომხმარებელი წაშლილია" });
    }

    return res.status(400).json({ error: "უცნობი action" });

  } catch (e) {
    console.error("ban-user error:", e);
    return res.status(500).json({ error: "სერვერის შეცდომა: " + e.message });
  }
}
