// ============================================================
// api/agora.js — ΑΓΟΡΑ ფორუმი
// Session 41: თემები, კომენტარები, AI მოდერაცია
// ============================================================

const FIREBASE_DB  = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const PROJECT_ID   = "gen-lang-client-0339684222";
const API_KEY      = "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao";
const ADMIN_UID    = "bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2";

const ALLOWED_ORIGINS = [
  "https://philosoph.vercel.app",
  "https://filosofia-xi.vercel.app"
];

const THREADS_PER_PAGE = 20;
const REPLIES_PER_PAGE = 20;
const MAX_REPLY_PAGES  = 50;                         // 50 × 20 = 1000 → thread-ი დაიხურება
const MAX_REPLIES      = MAX_REPLY_PAGES * REPLIES_PER_PAGE;
const EDIT_WINDOW_MS   = 60 * 60 * 1000;             // 1 საათი
const MAX_WARNINGS     = 3;
const BAN_DAYS         = 60;
const MAX_THREAD_BODY  = 2000;
const MAX_REPLY_BODY   = 1000;
const MAX_TITLE_LEN    = 120;


// ============================================================
// Service Account Token (identitytoolkit scope ჩართულია)
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
  const enc = (o) => btoa(JSON.stringify(o)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const sigInput  = `${enc(header)}.${enc(payload)}`;
  const pemBody   = sa.private_key.replace(/-----[^-]+-----/g,"").replace(/\s/g,"");
  const keyBytes  = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", keyBytes, { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" }, false, ["sign"]);
  const sig    = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(sigInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const jwt    = `${sigInput}.${sigB64}`;
  const tokenRes  = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const td    = await tokenRes.json();
  _cachedToken = td.access_token;
  _tokenExpiry  = Date.now() + 3600000;
  return _cachedToken;
}

// ============================================================
// Firebase REST helpers
// ============================================================
async function fbGet(path) {
  const token = await getAdminToken();
  const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`);
  if (!res.ok) return null;
  return await res.json();
}

async function fbSet(path, data) {
  const token = await getAdminToken();
  const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  return res.ok;
}

async function fbPatch(path, data) {
  const token = await getAdminToken();
  const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  return res.ok;
}

async function fbDelete(path) {
  const token = await getAdminToken();
  const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, { method: "DELETE" });
  return res.ok;
}

async function fbPush(path, data) {
  const token = await getAdminToken();
  const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  if (!res.ok) return null;
  const result = await res.json();
  return result.name; // Firebase-ის მიერ გენერირებული ID
}

// ============================================================
// მომხმარებლის token-ის შემოწმება
// ============================================================
async function verifyUserToken(token) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

// ============================================================
// UID-ით email-ის მოძიება (ბანისთვის)
// ============================================================
async function lookupEmailByUid(uid) {
  try {
    const adminTok = await getAdminToken();
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminTok}` },
        body: JSON.stringify({ localId: [uid] })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.users?.[0]?.email || null;
  } catch {
    return null;
  }
}

// ============================================================
// Firebase Auth-ში მომხმარებლის გათიშვა
// ============================================================
async function disableAuthUser(uid) {
  try {
    const adminTok = await getAdminToken();
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminTok}` },
        body: JSON.stringify({ localId: uid, disableUser: true })
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// ბანის სისტემა — 60 დღე
// ============================================================
async function banUserForAbuse(uid) {
  const email = await lookupEmailByUid(uid);
  const bannedUntil = Date.now() + BAN_DAYS * 86400000;

  // Firebase Auth-ში გათიშვა
  await disableAuthUser(uid);

  // /agora-warnings/{uid}/banned = true
  await fbPatch(`/agora-warnings/${uid}`, { banned: true, bannedAt: Date.now() });

  // banned-emails-ში ჩაწერა
  if (email) {
    const safeEmail = email.replace(/[.#$[\]@]/g, '_');
    await fbSet(`/banned-emails/${safeEmail}`, {
      bannedUntil,
      banDays: BAN_DAYS,
      reason: "agora_abuse"
    });
  }
}

// ============================================================
// Gemini AI მოდერაცია
// ============================================================
async function callGemini(prompt) {
  const keys = Object.keys(process.env)
    .filter(k => k.startsWith("GEMINI_KEY_"))
    .sort()
    .map(k => process.env[k])
    .filter(Boolean);

  if (!keys.length) return null;

  for (const key of keys) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 350 }
          })
        }
      );
      if (r.status === 429 || r.status === 403) continue;
      const d = await r.json();
      if (r.ok) return d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { continue; }
  }
  return null;
}

async function moderateThread(title, body) {
  const prompt = `შენ ხარ ფილოსოფიური ფორუმის AI მოდერატორი. ფორუმი მხოლოდ ფილოსოფიური თემებისთვისაა.

მომხმარებელი ხსნის ახალ თემას:
სათაური: ${title}
შინაარსი: ${body}

შეამოწმე:
1. "philosophical": true — თუ ეს ეთიკას, მეტაფიზიკას, ლოგიკას, ეპისტემოლოგიას, ონტოლოგიას, ეგზისტენციალიზმს, ესთეტიკას, ფილოსოფიის ისტორიას, რელიგიის ფილოსოფიას, პოლიტიკურ ფილოსოფიას, ღირებულებათა ფილოსოფიას ან ნებისმიერ სხვა ფილოსოფიურ დარგს ეხება. ძალიან ფართო გაგება — ფილოსოფიური კითხვა ყოველდღიური ცხოვრებაზეც კი "philosophical":true-ა.
2. "abuse": true — მხოლოდ მკაფიო გინება, ლანძღვა, ძალადობრივი ენა, რასიზმი.

უპასუხე მხოლოდ JSON, სხვა არაფერი:
{"philosophical":true/false,"abuse":true/false,"message":"მიზეზი ქართულად"}`;

  const text = await callGemini(prompt);
  if (!text) return { philosophical: true, abuse: false, message: "" };

  try {
    const m = text.match(/\{[\s\S]*?\}/);
    return JSON.parse(m ? m[0] : text);
  } catch {
    return { philosophical: true, abuse: false, message: "" };
  }
}

async function moderateReply(body) {
  const prompt = `შენ ხარ ფილოსოფიური ფორუმის AI მოდერატორი.

მომხმარებლის კომენტარი:
${body}

"ok": true — ნორმალური კომენტარი.
"abuse": true — მხოლოდ მკაფიო გინება, ლანძღვა, ძალადობრივი ენა, სპამი.

უპასუხე მხოლოდ JSON, სხვა არაფერი:
{"ok":true/false,"abuse":true/false,"message":"მიზეზი ქართულად"}`;

  const text = await callGemini(prompt);
  if (!text) return { ok: true, abuse: false, message: "" };

  try {
    const m = text.match(/\{[\s\S]*?\}/);
    return JSON.parse(m ? m[0] : text);
  } catch {
    return { ok: true, abuse: false, message: "" };
  }
}

// ============================================================
// პაგინაციის helper
// ============================================================
function paginate(arr, page, perPage) {
  const total      = arr.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safePage   = Math.max(1, Math.min(page, totalPages));
  const start      = (safePage - 1) * perPage;
  const items      = arr.slice(start, start + perPage);
  return { items, page: safePage, totalPages, total };
}

// ============================================================
// მთავარი HANDLER
// ============================================================
export default async function handler(req, res) {
  // CORS
  const origin    = req.headers["origin"]  || "";
  const referer   = req.headers["referer"] || "";
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin || ALLOWED_ORIGINS[0]);
    return res.status(200).end();
  }
  if (!isAllowed)            return res.status(403).json({ error: "Forbidden" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body   = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const { action } = body;
  const now = Date.now();


  // ============================================================
  // action: 'get-threads' — თემების სია (pagination)
  // ============================================================
  if (action === "get-threads") {
    const page = parseInt(body.page) || 1;
    try {
      const raw = await fbGet("/agora-threads");
      if (!raw) return res.json({ threads: [], page: 1, totalPages: 1, total: 0 });

      // object → array, დელეტ-ებული გამოვრიცხოთ
      const threads = Object.entries(raw)
        .map(([id, d]) => ({ id, ...d }))
        .filter(t => t.status !== "deleted")
        .sort((a, b) => {
          // pinned-ები ზევით
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return  1;
          return b.createdAt - a.createdAt;
        });

      const result = paginate(threads, page, THREADS_PER_PAGE);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // action: 'get-thread' — ერთი thread-ის მონაცემები + პირველი გვერდის replies
  // ============================================================
  if (action === "get-thread") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    try {
      const thread = await fbGet(`/agora-threads/${threadId}`);
      if (!thread || thread.status === "deleted") {
        return res.status(404).json({ error: "თემა ვერ მოიძებნა" });
      }

      // replies პირველი გვერდი
      const rawReplies = await fbGet(`/agora-replies/${threadId}`);
      const replies = rawReplies
        ? Object.entries(rawReplies)
            .map(([id, d]) => ({ id, ...d }))
            .filter(r => r.status !== "deleted")
            .sort((a, b) => a.createdAt - b.createdAt)
        : [];

      const replyResult = paginate(replies, 1, REPLIES_PER_PAGE);
      return res.json({ thread: { id: threadId, ...thread }, replies: replyResult });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // action: 'get-replies' — კომენტარების გვერდი
  // ============================================================
  if (action === "get-replies") {
    const { threadId, page } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    try {
      const rawReplies = await fbGet(`/agora-replies/${threadId}`);
      const replies = rawReplies
        ? Object.entries(rawReplies)
            .map(([id, d]) => ({ id, ...d }))
            .filter(r => r.status !== "deleted")
            .sort((a, b) => a.createdAt - b.createdAt)
        : [];

      const result = paginate(replies, parseInt(page) || 1, REPLIES_PER_PAGE);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // დანარჩენი actions-ები — auth სავალდებულოა
  // ============================================================
  const { userToken } = body;
  if (!userToken) return res.status(401).json({ error: "ავტორიზაცია საჭიროა" });

  const user = await verifyUserToken(userToken);
  if (!user) return res.status(401).json({ error: "სესია ამოიწურა. გთხოვ ხელახლა შეხვიდე." });

  const isAdmin = user.uid === ADMIN_UID;

  // ---- ბანი შემოწმება ----
  const safeEmail = user.email.replace(/[.#$[\]@]/g, '_');
  const banData   = await fbGet(`/banned-emails/${safeEmail}`);
  if (banData?.bannedUntil && now < banData.bannedUntil) {
    const daysLeft = Math.ceil((banData.bannedUntil - now) / 86400000);
    return res.status(403).json({ error: `🚫 შენი ანგარიში დაბლოკილია. დარჩენილია: ${daysLeft} დღე.` });
  }


  // ============================================================
  // action: 'create-thread' — ახალი თემა
  // ============================================================
  if (action === "create-thread") {
    const { title, threadBody } = body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: "სათაური მინ. 5 სიმბოლო უნდა იყოს" });
    }
    if (title.trim().length > MAX_TITLE_LEN) {
      return res.status(400).json({ error: `სათაური მაქს. ${MAX_TITLE_LEN} სიმბოლო` });
    }
    if (!threadBody || threadBody.trim().length < 10) {
      return res.status(400).json({ error: "შინაარსი მინ. 10 სიმბოლო უნდა იყოს" });
    }
    if (threadBody.trim().length > MAX_THREAD_BODY) {
      return res.status(400).json({ error: `შინაარსი მაქს. ${MAX_THREAD_BODY} სიმბოლო` });
    }

    // AI მოდერაცია
    const modResult = await moderateThread(title.trim(), threadBody.trim());

    if (modResult.abuse) {
      // გაფრთხილება ან ბანი
      const warnData = await fbGet(`/agora-warnings/${user.uid}`);
      const count    = (warnData?.count || 0) + 1;

      if (count >= MAX_WARNINGS) {
        await banUserForAbuse(user.uid);
        return res.status(403).json({
          warned:  true,
          banned:  true,
          count:   MAX_WARNINGS,
          message: `🚫 3/3 გაფრთხილება. ${BAN_DAYS} დღით დაიბლოკე.`
        });
      }

      await fbSet(`/agora-warnings/${user.uid}`, {
        count, lastWarningAt: now, reason: "abuse"
      });
      return res.status(403).json({
        warned:  true,
        banned:  false,
        count,
        max:     MAX_WARNINGS,
        message: `⚠️ გაფრთხილება ${count}/${MAX_WARNINGS}: ${modResult.message || "შეურაცხმყოფელი შინაარსი."}`
      });
    }

    if (!modResult.philosophical) {
      return res.status(400).json({
        error: `🏛️ ეს თემა ფილოსოფიასთან არ არის დაკავშირებული. ${modResult.message || ""}`
      });
    }

    // Thread-ის შექმნა
    const threadData = {
      title:      title.trim(),
      body:       threadBody.trim(),
      authorUid:  user.uid,
      authorName: body.authorName || "მომხმარებელი",
      createdAt:  now,
      editedAt:   null,
      replyCount: 0,
      status:     "open",
      pinned:     false
    };

    const threadId = await fbPush("/agora-threads", threadData);
    if (!threadId) return res.status(500).json({ error: "თემის შექმნა ვერ მოხერხდა" });

    // მომხმარებლის topicsCount + 1
    try {
      const userData = await fbGet(`/users/${user.uid}`);
      const newCount = (userData?.topicsCount || 0) + 1;
      await fbPatch(`/users/${user.uid}`, { topicsCount: newCount });
    } catch { /* silent */ }

    return res.json({ ok: true, threadId });
  }


  // ============================================================
  // action: 'create-reply' — კომენტარი
  // ============================================================
  if (action === "create-reply") {
    const { threadId, replyBody } = body;

    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    if (!replyBody || replyBody.trim().length < 2) {
      return res.status(400).json({ error: "კომენტარი ძალიან მოკლეა" });
    }
    if (replyBody.trim().length > MAX_REPLY_BODY) {
      return res.status(400).json({ error: `კომენტარი მაქს. ${MAX_REPLY_BODY} სიმბოლო` });
    }

    // Thread-ის სტატუსი
    const thread = await fbGet(`/agora-threads/${threadId}`);
    if (!thread || thread.status === "deleted") {
      return res.status(404).json({ error: "თემა ვერ მოიძებნა" });
    }
    if (thread.status === "locked") {
      return res.status(403).json({ error: "🔒 ეს თემა დახურულია" });
    }
    if (thread.replyCount >= MAX_REPLIES) {
      // auto-lock
      await fbPatch(`/agora-threads/${threadId}`, { status: "locked" });
      return res.status(403).json({ error: "🔒 თემა დაიხურა — 1000 კომენტარს მიაღწია" });
    }

    // AI მოდერაცია
    const modResult = await moderateReply(replyBody.trim());

    if (modResult.abuse) {
      const warnData = await fbGet(`/agora-warnings/${user.uid}`);
      const count    = (warnData?.count || 0) + 1;

      if (count >= MAX_WARNINGS) {
        await banUserForAbuse(user.uid);
        return res.status(403).json({
          warned:  true,
          banned:  true,
          count:   MAX_WARNINGS,
          message: `🚫 3/3 გაფრთხილება. ${BAN_DAYS} დღით დაიბლოკე.`
        });
      }

      await fbSet(`/agora-warnings/${user.uid}`, {
        count, lastWarningAt: now, reason: "abuse"
      });
      return res.status(403).json({
        warned:  true,
        banned:  false,
        count,
        max:     MAX_WARNINGS,
        message: `⚠️ გაფრთხილება ${count}/${MAX_WARNINGS}: ${modResult.message || "შეურაცხმყოფელი შინაარსი."}`
      });
    }

    // Reply-ს შექმნა
    const replyData = {
      body:       replyBody.trim(),
      authorUid:  user.uid,
      authorName: body.authorName || "მომხმარებელი",
      createdAt:  now,
      editedAt:   null,
      status:     "visible"
    };

    const replyId = await fbPush(`/agora-replies/${threadId}`, replyData);
    if (!replyId) return res.status(500).json({ error: "კომენტარის გამოქვეყნება ვერ მოხერხდა" });

    // replyCount + 1 და auto-lock შემოწმება
    const newCount = (thread.replyCount || 0) + 1;
    const newStatus = newCount >= MAX_REPLIES ? "locked" : thread.status;
    await fbPatch(`/agora-threads/${threadId}`, { replyCount: newCount, status: newStatus });

    return res.json({
      ok: true,
      replyId,
      locked: newStatus === "locked"
    });
  }


  // ============================================================
  // action: 'edit-thread' — thread-ის რედაქტირება
  // ============================================================
  if (action === "edit-thread") {
    const { threadId, title, threadBody } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const thread = await fbGet(`/agora-threads/${threadId}`);
    if (!thread || thread.status === "deleted") {
      return res.status(404).json({ error: "თემა ვერ მოიძებნა" });
    }

    // უფლება: ავტორი (1სთ) ან Admin
    const isAuthor = thread.authorUid === user.uid;
    const inWindow = (now - thread.createdAt) < EDIT_WINDOW_MS;
    if (!isAdmin && !(isAuthor && inWindow)) {
      return res.status(403).json({ error: "⏰ რედაქტირების 1-საათიანი ვადა ამოიწურა" });
    }

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: "სათაური მინ. 5 სიმბოლო" });
    }
    if (!threadBody || threadBody.trim().length < 10) {
      return res.status(400).json({ error: "შინაარსი მინ. 10 სიმბოლო" });
    }

    await fbPatch(`/agora-threads/${threadId}`, {
      title:    title.trim(),
      body:     threadBody.trim(),
      editedAt: now
    });
    return res.json({ ok: true });
  }


  // ============================================================
  // action: 'edit-reply' — კომენტარის რედაქტირება
  // ============================================================
  if (action === "edit-reply") {
    const { threadId, replyId, replyBody } = body;
    if (!threadId || !replyId) return res.status(400).json({ error: "threadId/replyId სავალდებულოა" });

    const reply = await fbGet(`/agora-replies/${threadId}/${replyId}`);
    if (!reply || reply.status === "deleted") {
      return res.status(404).json({ error: "კომენტარი ვერ მოიძებნა" });
    }

    const isAuthor = reply.authorUid === user.uid;
    const inWindow = (now - reply.createdAt) < EDIT_WINDOW_MS;
    if (!isAdmin && !(isAuthor && inWindow)) {
      return res.status(403).json({ error: "⏰ რედაქტირების 1-საათიანი ვადა ამოიწურა" });
    }

    if (!replyBody || replyBody.trim().length < 2) {
      return res.status(400).json({ error: "კომენტარი ძალიან მოკლეა" });
    }

    await fbPatch(`/agora-replies/${threadId}/${replyId}`, {
      body:     replyBody.trim(),
      editedAt: now
    });
    return res.json({ ok: true });
  }


  // ============================================================
  // action: 'delete-thread' — thread-ის წაშლა
  // ============================================================
  if (action === "delete-thread") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const thread = await fbGet(`/agora-threads/${threadId}`);
    if (!thread || thread.status === "deleted") {
      return res.status(404).json({ error: "თემა ვერ მოიძებნა" });
    }

    const isAuthor = thread.authorUid === user.uid;
    const inWindow = (now - thread.createdAt) < EDIT_WINDOW_MS;
    if (!isAdmin && !(isAuthor && inWindow)) {
      return res.status(403).json({ error: "⏰ წაშლის 1-საათიანი ვადა ამოიწურა. ადმინს მიმართე." });
    }

    await fbPatch(`/agora-threads/${threadId}`, { status: "deleted" });

    // topicsCount - 1
    try {
      const userData = await fbGet(`/users/${thread.authorUid}`);
      const newCount = Math.max(0, (userData?.topicsCount || 0) - 1);
      await fbPatch(`/users/${thread.authorUid}`, { topicsCount: newCount });
    } catch { /* silent */ }

    return res.json({ ok: true });
  }


  // ============================================================
  // action: 'delete-reply' — კომენტარის წაშლა
  // ============================================================
  if (action === "delete-reply") {
    const { threadId, replyId } = body;
    if (!threadId || !replyId) return res.status(400).json({ error: "threadId/replyId სავალდებულოა" });

    const reply = await fbGet(`/agora-replies/${threadId}/${replyId}`);
    if (!reply || reply.status === "deleted") {
      return res.status(404).json({ error: "კომენტარი ვერ მოიძებნა" });
    }

    const isAuthor = reply.authorUid === user.uid;
    const inWindow = (now - reply.createdAt) < EDIT_WINDOW_MS;
    if (!isAdmin && !(isAuthor && inWindow)) {
      return res.status(403).json({ error: "⏰ წაშლის 1-საათიანი ვადა ამოიწურა." });
    }

    await fbPatch(`/agora-replies/${threadId}/${replyId}`, { status: "deleted" });

    // replyCount - 1
    try {
      const thread   = await fbGet(`/agora-threads/${threadId}`);
      const newCount = Math.max(0, (thread?.replyCount || 0) - 1);
      await fbPatch(`/agora-threads/${threadId}`, { replyCount: newCount });
    } catch { /* silent */ }

    return res.json({ ok: true });
  }


  return res.status(400).json({ error: "უცნობი action" });
}
