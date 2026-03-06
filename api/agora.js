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
const EDIT_WINDOW_MS   = 60 * 60 * 1000;             // 1 საათი
const MAX_WARNINGS     = 3;
const BAN_DAYS         = 60;
const MAX_THREAD_BODY  = 50000;  // პრაქტიკულად ულიმიტო
const MAX_REPLY_BODY   = 50000;  // პრაქტიკულად ულიმიტო
const MAX_TITLE_LEN    = 80;

// ── დებატების კონსტანტები ──────────────────────────────────
const INVITE_TIMEOUT_MS  = 6 * 3600 * 1000;   // 6 სთ — მოწვევის ვადა (გაუქმება, ჯარიმა არ არის)
const TURN_TIMEOUT_MS    = 6 * 3600 * 1000;   // 6 სთ — სვლის ვადა (ჯარიმა!)
const TOTAL_DEBATE_MS    = 24 * 3600 * 1000;  // 24 სთ — დებატის სრული ვადა
const DEBATE_BAN_DAYS    = 7;
const OPENING_TURNS_EACH = 5;    // 5+5 = 10 სვლა გახსნაში
const FINAL_TURNS_EACH   = 10;   // 10+10 = 20 სვლა ბოლოში
const CROSS_MIN_Q        = 5;
const CROSS_MAX_Q        = 20;


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
// Notification helpers
// ============================================================
async function writeNotification(uid, data) {
  try {
    await fbPush(`/notifications/${uid}`, { ...data, read: false, createdAt: Date.now() });
  } catch { /* silent */ }
}

async function notifyAllUsers(excludeUid, notifData) {
  try {
    const users = await fbGet('/users');
    if (!users) return;
    const uids = Object.keys(users).filter(uid => uid !== excludeUid);
    await Promise.all(uids.map(uid => writeNotification(uid, notifData)));
  } catch { /* silent */ }
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
  const prompt = `შენ ხარ ფილოსოფიური ფორუმის მკაცრი AI მოდერატორი. ფორუმი მხოლოდ და მხოლოდ ფილოსოფიისთვისაა.

მომხმარებელი ხსნის ახალ თემას:
სათაური: ${title}
შინაარსი: ${body}

შეამოწმე ორი რამ:

1. "philosophical": true/false
true — თუ თემა პირდაპირ ეხება ფილოსოფიას: ეთიკა, მეტაფიზიკა, ლოგიკა, ეპისტემოლოგია, ონტოლოგია, ეგზისტენციალიზმი, ესთეტიკა, ფილოსოფიის ისტორია, რელიგიის ფილოსოფია, პოლიტიკური ფილოსოფია, ღირებულებების ფილოსოფია.
false — კულინარია, სპორტი, გართობა, ტექნოლოგია, ამბები, ყოველდღიური ცხოვრება, რეცეპტები, მოგზაურობა, მუსიკა და სხვა არაფილოსოფიური თემა.
მაგ: "საჭლის მომზადება" → false; "სიკვდილის შიში" → true; "ფეხბურთი" → false.

2. "abuse": true/false
true — გინება, ლანძღვა, პირდაპირი შეურაცხყოფა, რასიზმი.
ასევე true — მაღალფარდოვანი, "კულტურული" ენით ჩაცმული, მაგრამ კონტექსტით დამამცირებელი ტექსტი, რომელიც პიროვნებაზე, მის გონებაზე, ღირებულებაზე ან ადამიანურ ღირსებაზე თავდასხმას ახდენს.
მაგ: "შენსნაირები რომ არსებობენ იმიტომ გვაქვს პრობლემები" → abuse:true; "ამ დონის ადამიანს აზროვნება არ შეუძლია" → abuse:true.
false — ჯანსაღი კამათი, კრიტიკა, განსხვავებული მოსაზრება, მკაცრი, მაგრამ კორექტული ენა.

"quote": პრობლემური ტექსტის ციტატა (თუ abuse:true ან philosophical:false — დაასახელე კონკრეტული ფრაზა ტექსტიდან რომელიც პრობლემაა; თუ ყველაფერი კარგია — "")
"message": ქართული განმარტება — 2-3 წინადადებით კონკრეტულად ახსენი რა არის პრობლემა და რა შეასწოროს მომხმარებელმა.

⚠️ ᲔᲜᲝᲑᲠᲘᲕᲘ ᲬᲔᲡᲘ: message ველი წერე სრულყოფილ, სალიტერატურო ქართულად. გამოიყენე გრამატიკულად სწორი, ბუნებრივი ქართული წინადადებები. ნუ გამოიყენებ გაუმართავ სიტყვათა კომბინაციებს.

უპასუხე მხოლოდ JSON, სხვა არაფერი:
{"philosophical":true/false,"abuse":true/false,"quote":"პრობლემური ფრაზა ან empty string","message":"განმარტება ქართულად"}`;

  const text = await callGemini(prompt);
  if (!text) return { philosophical: true, abuse: false, message: "" };

  try {
    const m = text.match(/\{[\s\S]*?\}/);
    return JSON.parse(m ? m[0] : text);
  } catch {
    return { philosophical: true, abuse: false, message: "" };
  }
}

async function moderateReply(replyBody, threadTitle, threadBodySnippet) {
  const topicCtx = threadTitle
    ? `თემა: "${threadTitle}"\nთემის შინაარსი: ${(threadBodySnippet || "").substring(0, 300)}\n\n`
    : "";

  const prompt = `შენ ხარ ფილოსოფიური ფორუმის მკაცრი AI მოდერატორი.

${topicCtx}მომხმარებლის კომენტარი:
${replyBody}

შეამოწმე ორი რამ:

1. "ontopic": true/false
true — კომენტარი ეხება ამ ფილოსოფიურ თემას ან ფილოსოფიურ განზოგადებას.
false — სრულიად გამოუსადეგარია: რეცეპტები, ამინდი, ფეხბურთი, სარეკლამო ტექსტი, სხვა თემა.

2. "abuse": true/false

abuse:true — შემდეგი ტიპები:

პირდაპირი: გინება, ლანძღვა, შეურაცხყოფა, სპამი.

დახვეწილი/პატრონიზმი — გარეგნულად "თავაზიანი", მაგრამ შინაარსით პიროვნებას ინტელექტუალურად ამცირებს. ამოიცანი:
- "გაგების დონე", "ეტაპი", "საფეხური", "განვითარება" — პიროვნებაზე მიმართული ("ჯერ კიდევ ადრეულ ეტაპზე", "შემდგომ განვითარებაში")
- "ყველას აქვს გამოხატვის უფლება, მიუხედავად გაგების დონისა" — ფარული დამცირება
- "გისურვებ წარმატებას შემდგომ განვითარებაში" — ზემოდან ქვემოთ, მასწავლებელი-ბავშვი ტონი
- "შენი მოსაზრება ამხელს იმ გონებრივ ჩარჩოს" — ინტელექტის გაკრიტიკება
- "ამ დონის ადამიანისთვის ბუნებრივია", "ბუნებრივი შეზღუდვა" — გონებრივი უუნარობის მინიშნება
- ქება+დამცირება: "კარგია რომ ცდილობ, მაგრამ ამ საკითხს გაგება სჭირდება"

მაგ: "შენი პოზიცია პატივსაცემია — ყველას აქვს გამოხატვის უფლება, მიუხედავად გაგების დონისა. ვინც ჯერ ადრეულ საფეხურზეა. გისურვებ წარმატებას განვითარებაში." → abuse:true
მაგ: "შენი არგუმენტი სუსტია, რადგან X მიზეზით" → abuse:false (კრიტიკა, მაგრამ არა დამცირება)
მაგ: "ეს პოზიცია ეწინააღმდეგება კანტის მოსაზრებას" → abuse:false

"quote": კონკრეტული პრობლემური ფრაზა ტექსტიდან (თუ abuse:true ან ontopic:false; თუ კარგია — "")
"message": ქართული განმარტება — 2-3 წინადადებით კონკრეტულად ახსენი რა არის პრობლემა (რომელი ფრაზა, რატომ დაირღვა წესი) და რა შეასწოროს მომხმარებელმა.

⚠️ ᲔᲜᲝᲑᲠᲘᲕᲘ ᲬᲔᲡᲘ: message ველი წერე სრულყოფილ, სალიტერატურო ქართულად. გამოიყენე გრამატიკულად სწორი, ბუნებრივი ქართული წინადადებები. ნუ გამოიყენებ გაუმართავ სიტყვათა კომბინაციებს.

უპასუხე მხოლოდ JSON, სხვა არაფერი:
{"ontopic":true/false,"abuse":true/false,"quote":"პრობლემური ფრაზა ან empty string","message":"განმარტება ქართულად"}`;

  const text = await callGemini(prompt);
  if (!text) return { ontopic: true, abuse: false, message: "" };

  try {
    const m = text.match(/\{[\s\S]*?\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    // backward compat — ok field
    if (parsed.ok !== undefined && parsed.ontopic === undefined) {
      parsed.ontopic = parsed.ok;
    }
    return parsed;
  } catch {
    return { ontopic: true, abuse: false, message: "" };
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
// Emoji გამოვლენა — სმაილები/emojis აკრძალულია
// ============================================================
function containsEmoji(text) {
  // Unicode emoji ranges
  const emojiRegex = /[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27FF}|\u{FE00}-\u{FEFF}|\u{1F300}-\u{1F9FF}|\u{231A}-\u{231B}|\u{23E9}-\u{23F3}|\u{25AA}-\u{25FE}|\u{2614}-\u{2615}|\u{2648}-\u{2653}|\u{267F}|\u{2693}|\u{26A1}|\u{26AA}-\u{26AB}|\u{26BD}-\u{26BE}|\u{26C4}-\u{26C5}|\u{26CE}|\u{26D4}|\u{26EA}|\u{26F2}-\u{26F3}|\u{26F5}|\u{26FA}|\u{26FD}|\u{2702}|\u{2705}|\u{2708}-\u{270D}|\u{270F}|\u{2712}|\u{2714}|\u{2716}|\u{271D}|\u{2721}|\u{2728}|\u{2733}-\u{2734}|\u{2744}|\u{2747}|\u{274C}|\u{274E}|\u{2753}-\u{2755}|\u{2757}|\u{2763}-\u{2764}|\u{2795}-\u{2797}|\u{27A1}|\u{27B0}|\u{27BF}|\u{2934}-\u{2935}|\u{2B05}-\u{2B07}|\u{2B1B}-\u{2B1C}|\u{2B50}|\u{2B55}|\u{3030}|\u{303D}|\u{3297}|\u{3299}]/u;
  return emojiRegex.test(text);
}


// ============================================================
// DEBATE HELPERS
// ============================================================

async function getDebateNickname(uid) {
  try {
    const d = await fbGet(`/users/${uid}`);
    return d?.nickname || "მომხმარებელი";
  } catch { return "მომხმარებელი"; }
}

async function banForMissedTurn(uid) {
  try {
    const email       = await lookupEmailByUid(uid);
    const bannedUntil = Date.now() + DEBATE_BAN_DAYS * 86400000;
    await disableAuthUser(uid);
    await fbPatch(`/agora-warnings/${uid}`, {
      banned: true, bannedAt: Date.now(), reason: "debate_missed_turn"
    });
    if (email) {
      const safeEmail = email.replace(/[.#$[\]@]/g, '_');
      await fbSet(`/banned-emails/${safeEmail}`, {
        bannedUntil, banDays: DEBATE_BAN_DAYS, reason: "debate_missed_turn"
      });
    }
  } catch { /* silent */ }
}

async function judgeDebate(debate, threadId, forfeitUid = null) {
  try {
    const opening = debate.opening ? Object.values(debate.opening).sort((a,b)=>a.createdAt-b.createdAt) : [];
    const finalT  = debate.final   ? Object.values(debate.final).sort((a,b)=>a.createdAt-b.createdAt) : [];
    const crossQ  = debate.cross?.questions  ? Object.values(debate.cross.questions).sort((a,b)=>a.createdAt-b.createdAt)  : [];
    const crossA  = debate.cross?.answers    ? Object.values(debate.cross.answers).sort((a,b)=>a.createdAt-b.createdAt)    : [];
    const cross2Q = debate.cross2?.questions ? Object.values(debate.cross2.questions).sort((a,b)=>a.createdAt-b.createdAt) : [];
    const cross2A = debate.cross2?.answers   ? Object.values(debate.cross2.answers).sort((a,b)=>a.createdAt-b.createdAt)   : [];

    const authorName   = debate.authorNickname   || "ავტორი";
    const opponentName = debate.opponentNickname || "ოპონენტი";

    let transcript = `=== საწყისი ეტაპი ===\n`;
    opening.forEach(t => { transcript += `[${t.nickname}]: ${t.body}\n\n`; });

    if (crossQ.length) {
      const r1AskerName = debate.cross?.askerUid === debate.authorUid ? authorName : opponentName;
      const r1AnsName   = debate.cross?.askerUid === debate.authorUid ? opponentName : authorName;
      transcript += `\n=== დაკითხვა I (${r1AskerName} კითხვებს სვამს, ${r1AnsName} პასუხობს) ===\n`;
      crossQ.forEach((q, i) => {
        const a = crossA[i];
        transcript += `კითხვა: ${q.body}\nპასუხი: ${a ? (a.answer==="yes"?"კი":a.answer==="no"?"არა":"არ ვიცი") : "—"}\n\n`;
      });
    }
    if (cross2Q.length) {
      const r2AskerName = debate.cross2?.askerUid === debate.authorUid ? authorName : opponentName;
      const r2AnsName   = debate.cross2?.askerUid === debate.authorUid ? opponentName : authorName;
      transcript += `\n=== დაკითხვა II (${r2AskerName} კითხვებს სვამს, ${r2AnsName} პასუხობს) ===\n`;
      cross2Q.forEach((q, i) => {
        const a = cross2A[i];
        transcript += `კითხვა: ${q.body}\nპასუხი: ${a ? (a.answer==="yes"?"კი":a.answer==="no"?"არა":"არ ვიცი") : "—"}\n\n`;
      });
    }

    if (finalT.length) {
      transcript += `\n=== საბოლოო პაექრობა ===\n`;
      finalT.forEach(t => { transcript += `[${t.nickname}]: ${t.body}\n\n`; });
    }

    const forfeitNote = forfeitUid
      ? `\n⚠️ შენიშვნა: ${forfeitUid===debate.authorUid ? authorName : opponentName}-მა სვლა ვადაში ვერ გააკეთა (ჩავარდნა).`
      : "";

    const prompt = `შენ ხარ მიუმხრობელი, ობიექტური ფილოსოფიური დებატის AI მსაჯი. გაანალიზე ქვემოთ მოცემული 1vs1 სადებატო სესია სრული სიზუსტით.

⚠️ ᲛᲘᲣᲛᲮᲠᲝᲑᲚᲝᲑᲘᲡ ᲬᲔᲡᲘ: შენ არ იცი მონაწილეების ვინაობა, არ გაქვს პრეფერენცია. შეაფასე მხოლოდ არგუმენტების ხარისხი, ლოგიკა და სიმყარე. თუ ორივე მხარე თანაბრად ძლიერი ან სუსტია — გამოაცხადე ფრე.

მონაწილეები:
- ${authorName}
- ${opponentName}
${forfeitNote}

${transcript}

შეაფასე სამი კრიტერიუმით (0-10):
1. ignored_points — ვის არგუმენტები დარჩა უპასუხოდ (მაღალი = ცუდი)
2. logic_score — ლოგიკის სიმყარე, თანმიმდევრულობა, მტკიცებულებები (მაღალი = კარგი)
3. cross_score — დაკითხვის ეტაპის სტრატეგიული გამოყენება (მაღალი = კარგი)

გადაწყვეტილება:
- მოგება: ერთი მხარე მნიშვნელოვნად ჯობია მეორეს
- ფრე: სხვაობა მინიმალურია ან ორივე თანაბრად კარგია/სუსტია

⚠️ ᲔᲜᲝᲑᲠᲘᲕᲘ ᲬᲔᲡᲘ: ყველა ველი — სრულყოფილ, სალიტერატურო ქართულად.

უპასუხე მხოლოდ JSON:
{"result":"win"|"draw","winner":"${authorName} ან ${opponentName} ან null","winner_uid":"UID ან null","reason":"2-3 წინადადება","analysis":"3-4 წინადადება","scores":{"${authorName}":{"ignored_points":0,"logic_score":0,"cross_score":0},"${opponentName}":{"ignored_points":0,"logic_score":0,"cross_score":0}}}`;

    const text = await callGemini(prompt);
    if (!text) throw new Error("Gemini no response");

    const m = text.match(/\{[\s\S]*\}/);
    const verdict = JSON.parse(m ? m[0] : text);

    const isDraw = verdict.result === "draw" || !verdict.winner_uid || verdict.winner_uid === "null";
    const winnerUid      = isDraw ? null
      : verdict.winner_uid === debate.opponentUid ? debate.opponentUid : debate.authorUid;
    const winnerNickname = isDraw ? null
      : winnerUid === debate.authorUid ? authorName : opponentName;

    const verdictData = {
      analysis:        verdict.analysis || "",
      result:          isDraw ? "draw" : "win",
      winnerUid:       winnerUid || null,
      winnerNickname:  winnerNickname || null,
      reason:          verdict.reason || "",
      scores:          verdict.scores || {},
      forfeitUid:      forfeitUid || null,
      createdAt:       Date.now()
    };

    await fbPatch(`/agora-debates/${threadId}`, { phase: "verdict", verdict: verdictData });
    await fbPatch(`/agora-threads/${threadId}`,  { debateStatus: "finished", debatePhase: "verdict" });

    const notifMsg = isDraw
      ? `⚖️ AI კრიტიკოსმა დებატი შეაფასა — ⚡ ფრე!`
      : `⚖️ AI კრიტიკოსმა დებატი შეაფასა — გამარჯვებული: ${winnerNickname}`;
    for (const uid of [debate.authorUid, debate.opponentUid]) {
      await writeNotification(uid, {
        type: "debate-verdict", threadId, winnerUid, winnerNickname,
        message: notifMsg
      });
    }
  } catch { /* silent */ }
}

async function checkDebateTimeouts(debate, threadId, now) {
  if (!debate || debate.phase === "verdict" || debate.phase === "cancelled") return false;

  // მოწვევა ვადაგასული → გაუქმება, ჯარიმა არ არის
  if (debate.phase === "pending" && now > debate.inviteDeadline) {
    await fbPatch(`/agora-debates/${threadId}`, { phase: "cancelled" });
    await fbPatch(`/agora-threads/${threadId}`,  { debateStatus: "cancelled" });
    return true;
  }

  // სვლის ვადა ამოიწურა → ჯარიმა + AI განაჩენი
  const activePhases = ["opening", "cross-asking", "cross-answering", "final"];
  if (activePhases.includes(debate.phase) && debate.turnDeadline && now > debate.turnDeadline) {
    const forfeitUid = debate.currentTurn;
    await banForMissedTurn(forfeitUid);
    await judgeDebate(debate, threadId, forfeitUid);
    return true;
  }

  return false;
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
  // action: 'get-user-profile' — საჯარო პროფილი (auth არ სჭირდება)
  // ============================================================
  if (action === "get-user-profile") {
    const { uid } = body;
    if (!uid) return res.status(400).json({ error: "uid სავალდებულოა" });
    try {
      const isOwner = uid === ADMIN_UID;
      const userData = await fbGet(`/users/${uid}`);

      let articlesCount = userData?.articlesCount || 0;
      // ადმინისთვის — notes-დან რეალური რაოდენობა
      if (isOwner) {
        try {
          const notes = await fbGet('/notes');
          articlesCount = notes ? Object.keys(notes).length : 0;
        } catch { /* silent */ }
      }

      return res.json({
        nickname:      isOwner ? "Nodo" : (userData?.nickname || "მომხმარებელი"),
        articlesCount,
        topicsCount:   userData?.topicsCount || 0,
        photoURL:      isOwner
          ? (userData?.photoURL || null)
          : (userData?.photoURL || null),
        isOwner
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


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
      return res.json({
        threads:    result.items,
        page:       result.page,
        totalPages: result.totalPages,
        total:      result.total
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // ============================================================
  // action: 'search-threads' — თემების ძებნა
  // ============================================================
  if (action === "search-threads") {
    const query = (body.query || "").trim().toLowerCase();
    if (!query || query.length < 2) return res.json({ threads: [] });
    try {
      const raw = await fbGet("/agora-threads");
      if (!raw) return res.json({ threads: [] });
      const threads = Object.entries(raw)
        .map(([id, d]) => ({ id, ...d }))
        .filter(t => t.status !== "deleted")
        .filter(t => {
          const title = (t.title || "").toLowerCase();
          const body2 = (t.body || "").toLowerCase();
          return title.includes(query) || body2.includes(query);
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 30);
      return res.json({ threads });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


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
  // action: 'get-debate' — დებატის მდგომარეობა (auth არ სჭირდება)
  // ============================================================
  if (action === "get-debate") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    try {
      const debate = await fbGet(`/agora-debates/${threadId}`);
      if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
      const changed = await checkDebateTimeouts(debate, threadId, now);
      const fresh   = changed ? await fbGet(`/agora-debates/${threadId}`) : debate;

      // ავატარების ჩატვირთვა სერვერ-სიდეზე (App Check bypass)
      const photoMap = {};
      try {
        const [aUser, oUser] = await Promise.all([
          fbGet(`/users/${fresh.authorUid}`),
          fbGet(`/users/${fresh.opponentUid}`)
        ]);
        if (aUser?.photoURL) photoMap[fresh.authorUid]   = aUser.photoURL;
        if (oUser?.photoURL) photoMap[fresh.opponentUid] = oUser.photoURL;
      } catch (_) {}

      return res.json({ debate: { threadId, ...fresh }, photoMap });
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
    if (containsEmoji(title) || containsEmoji(threadBody || '')) {
      return res.status(400).json({ error: "😶 სმაილები/emoji-ები აკრძალულია ფორუმში." });
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
        quote:   modResult.quote || "",
        message: `⚠️ გაფრთხილება ${count}/${MAX_WARNINGS}: ${modResult.message || "შეურაცხმყოფელი შინაარსი."}`
      });
    }

    if (!modResult.philosophical) {
      return res.status(400).json({
        error: `🏛️ ეს თემა ფილოსოფიასთან არ არის დაკავშირებული. ${modResult.message || ""}`,
        quote: modResult.quote || ""
      });
    }

    // Thread-ის შექმნა
    const userData = await fbGet(`/users/${user.uid}`);
    const threadData = {
      title:        title.trim(),
      body:         threadBody.trim(),
      authorUid:    user.uid,
      authorName:   body.authorName || userData?.nickname || "მომხმარებელი",
      authorAvatar: body.authorAvatar || userData?.photoURL || null,
      createdAt:    now,
      editedAt:     null,
      replyCount:   0,
      status:       "open",
      pinned:       false
    };

    const threadId = await fbPush("/agora-threads", threadData);
    if (!threadId) return res.status(500).json({ error: "თემის შექმნა ვერ მოხერხდა" });

    // ყველა user-ს აცნობე ახალ თემაზე (fire & forget)
    notifyAllUsers(user.uid, {
      type: "new-thread",
      threadId,
      threadTitle: title.trim(),
      fromName: threadData.authorName,
      fromAvatar: threadData.authorAvatar || null
    }).catch(() => {});

    // მომხმარებლის topicsCount + 1
    try {
      const newCount = (userData?.topicsCount || 0) + 1;
      await fbPatch(`/users/${user.uid}`, { topicsCount: newCount });
    } catch { /* silent */ }

    return res.json({ ok: true, threadId });
  }


  // ============================================================
  // action: 'create-reply' — კომენტარი
  // ============================================================
  if (action === "create-reply") {
    const { threadId, replyBody, quotes: quotesArr, quotedReplyId, quotedBody, quotedAuthor, quotedNum } = body;

    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    if (!replyBody || replyBody.trim().length < 2) {
      return res.status(400).json({ error: "კომენტარი ძალიან მოკლეა" });
    }
    if (replyBody.trim().length > MAX_REPLY_BODY) {
      return res.status(400).json({ error: `კომენტარი მაქს. ${MAX_REPLY_BODY} სიმბოლო` });
    }
    if (containsEmoji(replyBody)) {
      return res.status(400).json({ error: "😶 სმაილები/emoji-ები აკრძალულია ფორუმში." });
    }

    // Thread-ის სტატუსი
    const thread = await fbGet(`/agora-threads/${threadId}`);
    if (!thread || thread.status === "deleted") {
      return res.status(404).json({ error: "თემა ვერ მოიძებნა" });
    }
    if (thread.status === "locked") {
      return res.status(403).json({ error: "🔒 ეს თემა დახურულია" });
    }

    // AI მოდერაცია — abuse + on-topic
    const modResult = await moderateReply(replyBody.trim(), thread.title, thread.body);

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
        quote:   modResult.quote || "",
        message: `⚠️ გაფრთხილება ${count}/${MAX_WARNINGS}: ${modResult.message || "შეურაცხმყოფელი შინაარსი."}`
      });
    }

    if (modResult.ontopic === false) {
      return res.status(400).json({
        error: `🏛️ კომენტარი თემის მიღმაა. ${modResult.message || "შეეცადე, ილაპარაკო ამ თემის შესახებ."}`,
        quote: modResult.quote || ""
      });
    }

    // ავტარი + nickname — frontend-დან + Firebase fallback
    const userData = await fbGet(`/users/${user.uid}`);
    const authorAvatar = body.authorAvatar || userData?.photoURL || null;

    // Reply-ს შექმნა
    // quotes: ახალი array ფორმატი; ძველი single-quote fields — backward compat
    let quotesData = null;
    if (Array.isArray(quotesArr) && quotesArr.length > 0) {
      quotesData = quotesArr.slice(0, 10).map(q => ({
        replyId: q.replyId || null,
        body:    typeof q.body === 'string' ? q.body.substring(0, 200) : '',
        author:  typeof q.author === 'string' ? q.author : '',
        num:     q.num || null
      }));
    }

    const replyData = {
      body:         replyBody.trim(),
      authorUid:    user.uid,
      authorName:   body.authorName || userData?.nickname || "მომხმარებელი",
      authorAvatar: authorAvatar,
      createdAt:    now,
      editedAt:     null,
      status:       "visible",
      // ახალი: quotes array
      quotes:        quotesData || null,
      // ძველი single-quote fields (backward compat — მხოლოდ თუ quotesData null-ია)
      quotedReplyId: quotesData ? null : (quotedReplyId || null),
      quotedBody:    quotesData ? null : (quotedBody ? quotedBody.substring(0, 200) : null),
      quotedAuthor:  quotesData ? null : (quotedAuthor || null),
      quotedNum:     quotesData ? null : (quotedNum    || null)
    };

    const replyId = await fbPush(`/agora-replies/${threadId}`, replyData);
    if (!replyId) return res.status(500).json({ error: "კომენტარის გამოქვეყნება ვერ მოხერხდა" });

    // replyCount + 1
    const newCount = (thread.replyCount || 0) + 1;
    await fbPatch(`/agora-threads/${threadId}`, { replyCount: newCount });

    // 🔔 შეტყობინებები (fire & forget)
    const notifBase = { threadId, threadTitle: thread.title, fromName: replyData.authorName, fromAvatar: replyData.authorAvatar || null };

    // thread-ის ავტორს (თუ სხვა ადამიანია)
    if (thread.authorUid && thread.authorUid !== user.uid) {
      writeNotification(thread.authorUid, { ...notifBase, type: "reply" }).catch(() => {});
    }

    // ციტირებული კომენტარების ავტორების შეტყობინება
    const quotedIds = quotesData
      ? quotesData.map(q => q.replyId).filter(Boolean)
      : (quotedReplyId ? [quotedReplyId] : []);

    for (const qid of quotedIds) {
      try {
        const quotedReply = await fbGet(`/agora-replies/${threadId}/${qid}`);
        if (quotedReply && quotedReply.authorUid &&
            quotedReply.authorUid !== user.uid &&
            quotedReply.authorUid !== thread.authorUid) {
          writeNotification(quotedReply.authorUid, { ...notifBase, type: "quote" }).catch(() => {});
        }
      } catch { /* silent */ }
    }

    return res.json({
      ok: true,
      replyId
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


  // ============================================================
  // action: 'get-notifications' — შეტყობინებების სია
  // ============================================================
  if (action === "get-notifications") {
    try {
      const raw = await fbGet(`/notifications/${user.uid}`);
      if (!raw) return res.json({ notifications: [], unread: 0 });

      const notifications = Object.entries(raw)
        .map(([id, d]) => ({ id, ...d }))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 30);

      const unread = notifications.filter(n => !n.read).length;
      return res.json({ notifications, unread });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // action: 'mark-notifications-read' — ყველა წაკითხულად მოხატვა
  // ============================================================
  if (action === "mark-notifications-read") {
    try {
      const raw = await fbGet(`/notifications/${user.uid}`);
      if (!raw) return res.json({ ok: true });

      const unreadIds = Object.keys(raw).filter(id => !raw[id].read);
      await Promise.all(
        unreadIds.map(id => fbPatch(`/notifications/${user.uid}/${id}`, { read: true }))
      );
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // action: 'get-agora-banned' — დაბლოკილი მომხმარებლების სია (admin only)
  // ============================================================
  if (action === "get-agora-banned") {
    if (!isAdmin) return res.status(403).json({ error: "მხოლოდ ადმინი" });
    try {
      const warnings = await fbGet("/agora-warnings");
      if (!warnings) return res.json({ users: [] });

      const bannedUids = Object.entries(warnings)
        .filter(([, v]) => v.banned === true)
        .map(([uid, v]) => ({ uid, bannedAt: v.bannedAt || null, count: v.count || 3 }));

      // nickname-ების მიღება
      const users = await Promise.all(bannedUids.map(async ({ uid, bannedAt, count }) => {
        try {
          const userData = await fbGet(`/users/${uid}`);
          return {
            uid,
            nickname: userData?.nickname || "მომხმარებელი",
            photoURL:  userData?.photoURL || null,
            bannedAt,
            count
          };
        } catch { return { uid, nickname: uid, photoURL: null, bannedAt, count }; }
      }));

      return res.json({ users });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ============================================================
  // action: 'unban-agora' — აგორა-ბანის მოხსნა (admin only)
  // ============================================================
  if (action === "unban-agora") {
    if (!isAdmin) return res.status(403).json({ error: "მხოლოდ ადმინი" });
    const { targetUid } = body;
    if (!targetUid) return res.status(400).json({ error: "targetUid სავალდებულოა" });
    try {
      // 1. agora-warnings-ში banned = false, count = 0
      await fbPatch(`/agora-warnings/${targetUid}`, { banned: false, count: 0, unbannedAt: Date.now() });

      // 2. Firebase Auth — user გააქტიურება
      const adminToken = await getAdminToken();
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.FIREBASE_API_KEY || "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify({ localId: targetUid, disableUser: false })
        }
      );

      // 3. banned-emails-დან წაშლა
      try {
        const userData = await fbGet(`/users/${targetUid}`);
        if (userData?.email) {
          const safeEmail = userData.email.replace(/[.#$[\]@]/g, '_');
          await fbSet(`/banned-emails/${safeEmail}`, null);
        }
      } catch { /* silent */ }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ============================================================
  // action: 'find-user' — nickname-ით მომხმარებლის მოძიება
  // ============================================================
  if (action === "find-user") {
    const { nickname } = body;
    if (!nickname || nickname.trim().length < 2)
      return res.status(400).json({ error: "nickname სავალდებულოა" });
    try {
      const users = await fbGet("/users");
      if (!users) return res.json({ user: null });
      const q = nickname.trim().toLowerCase();
      const match = Object.entries(users).find(([, d]) =>
        (d.nickname || "").toLowerCase() === q
      );
      if (!match) return res.json({ user: null });
      const [uid, d] = match;
      if (uid === user.uid) return res.status(400).json({ error: "საკუთარ თავს ვერ გამოიწვევ" });
      return res.json({ user: { uid, nickname: d.nickname, photoURL: d.photoURL || null } });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }


  // ============================================================
  // action: 'create-debate' — 1vs1 დებატის გამოწვევა
  // ============================================================
  if (action === "create-debate") {
    const { title, threadBody, opponentUid } = body;

    if (!title || title.trim().length < 5)
      return res.status(400).json({ error: "სათაური მინ. 5 სიმბოლო" });
    if (title.trim().length > MAX_TITLE_LEN)
      return res.status(400).json({ error: `სათაური მაქს. ${MAX_TITLE_LEN} სიმბოლო` });
    if (!threadBody || threadBody.trim().length < 10)
      return res.status(400).json({ error: "შინაარსი მინ. 10 სიმბოლო" });
    if (!opponentUid)
      return res.status(400).json({ error: "ოპონენტის UID სავალდებულოა" });
    if (opponentUid === user.uid)
      return res.status(400).json({ error: "საკუთარ თავს ვერ გამოიწვევ" });
    if (containsEmoji(title) || containsEmoji(threadBody))
      return res.status(400).json({ error: "emoji-ები აკრძალულია" });

    // ოპონენტი არსებობს?
    const oppData = await fbGet(`/users/${opponentUid}`);
    if (!oppData) return res.status(404).json({ error: "ოპონენტი ვერ მოიძებნა" });

    // ოპონენტი დაბლოკილია?
    const oppWarn = await fbGet(`/agora-warnings/${opponentUid}`);
    if (oppWarn?.banned) return res.status(400).json({ error: "ოპონენტი ამჟამად დაბლოკილია" });

    // AI მოდერაცია
    const modResult = await moderateThread(title.trim(), threadBody.trim());
    if (modResult.abuse) {
      const warnData = await fbGet(`/agora-warnings/${user.uid}`);
      const count    = (warnData?.count || 0) + 1;
      if (count >= MAX_WARNINGS) {
        await banUserForAbuse(user.uid);
        return res.status(403).json({ warned: true, banned: true, count: MAX_WARNINGS, message: `🚫 3/3 გაფრთხილება. ${BAN_DAYS} დღით დაიბლოკე.` });
      }
      await fbSet(`/agora-warnings/${user.uid}`, { count, lastWarningAt: now, reason: "abuse" });
      return res.status(403).json({ warned: true, banned: false, count, max: MAX_WARNINGS, quote: modResult.quote || "", message: `⚠️ გაფრთხილება ${count}/${MAX_WARNINGS}: ${modResult.message || ""}` });
    }
    if (!modResult.philosophical) {
      return res.status(400).json({ error: `🏛️ თემა ფილოსოფიასთან არ არის დაკავშირებული. ${modResult.message || ""}`, quote: modResult.quote || "" });
    }

    const userData       = await fbGet(`/users/${user.uid}`);
    const authorNickname = body.authorName || userData?.nickname || "მომხმარებელი";
    const oppNickname    = oppData.nickname || "მომხმარებელი";

    // Thread შექმნა
    const threadData = {
      title:           title.trim(),
      body:            threadBody.trim(),
      authorUid:       user.uid,
      authorName:      authorNickname,
      authorAvatar:    body.authorAvatar || userData?.photoURL || null,
      type:            "debate",
      debateStatus:    "pending",
      debatePhase:     "pending",
      opponentUid,
      opponentNickname: oppNickname,
      createdAt:       now,
      editedAt:        null,
      replyCount:      0,
      status:          "open",
      pinned:          false
    };

    const threadId = await fbPush("/agora-threads", threadData);
    if (!threadId) return res.status(500).json({ error: "დებატის შექმნა ვერ მოხერხდა" });

    // Debate record
    await fbSet(`/agora-debates/${threadId}`, {
      threadId,
      authorUid:       user.uid,
      authorNickname,
      opponentUid,
      opponentNickname: oppNickname,
      phase:           "pending",
      invitedAt:       now,
      inviteDeadline:  now + INVITE_TIMEOUT_MS,
      currentTurn:     null,
      turnDeadline:    null,
      startedAt:       null,
      totalDeadline:   null,
      opening:         {},
      cross:           { questions: {}, answers: {}, askerUid: user.uid },
      final:           {}
    });

    // topicsCount + 1
    try {
      const newCount = (userData?.topicsCount || 0) + 1;
      await fbPatch(`/users/${user.uid}`, { topicsCount: newCount });
    } catch { /* silent */ }

    // ოპონენტს შეტყობინება
    await writeNotification(opponentUid, {
      type:        "debate-invite",
      threadId,
      fromUid:     user.uid,
      fromName:    authorNickname,
      fromAvatar:  body.authorAvatar || userData?.photoURL || null,
      threadTitle: title.trim(),
      message:     `⚔️ ${authorNickname} გიწვევს 1vs1 დებატში: "${title.trim()}"`,
      deadline:    now + INVITE_TIMEOUT_MS
    });

    return res.json({ ok: true, threadId });
  }


  // ============================================================
  // action: 'accept-debate' — ოპონენტი იღებს გამოწვევას
  // ============================================================
  if (action === "accept-debate") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "pending") return res.status(400).json({ error: "გამოწვევა აღარ არის მოლოდინის სტატუსში" });
    if (debate.opponentUid !== user.uid) return res.status(403).json({ error: "ეს გამოწვევა შენთვის არ არის" });
    if (now > debate.inviteDeadline) {
      await fbPatch(`/agora-debates/${threadId}`, { phase: "cancelled" });
      await fbPatch(`/agora-threads/${threadId}`,  { debateStatus: "cancelled" });
      return res.status(400).json({ error: "გამოწვევის ვადა ამოიწურა" });
    }

    const startedAt     = now;
    const totalDeadline = now + TOTAL_DEBATE_MS;
    const turnDeadline  = now + TURN_TIMEOUT_MS;

    await fbPatch(`/agora-debates/${threadId}`, {
      phase:         "opening",
      currentTurn:   debate.authorUid,   // ავტორი პირველი
      startedAt,
      totalDeadline,
      turnDeadline
    });
    await fbPatch(`/agora-threads/${threadId}`, {
      debateStatus: "active",
      debatePhase:  "opening"
    });

    // ავტორს შეტყობინება
    await writeNotification(debate.authorUid, {
      type:        "debate-accepted",
      threadId,
      fromUid:     user.uid,
      fromName:    debate.opponentNickname,
      message:     `⚔️ ${debate.opponentNickname}-მა მიიღო შენი გამოწვევა! დებატი დაიწყო.`,
      threadTitle: (await fbGet(`/agora-threads/${threadId}`))?.title || ""
    });

    return res.json({ ok: true, phase: "opening", currentTurn: debate.authorUid });
  }


  // ============================================================
  // action: 'decline-debate' — ოპონენტი უარყოფს გამოწვევას
  // ============================================================
  if (action === "decline-debate") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "pending") return res.status(400).json({ error: "გამოწვევა აღარ არის მოლოდინის სტატუსში" });
    if (debate.opponentUid !== user.uid) return res.status(403).json({ error: "ეს გამოწვევა შენთვის არ არის" });

    await fbPatch(`/agora-debates/${threadId}`, { phase: "cancelled", declinedAt: now });
    await fbPatch(`/agora-threads/${threadId}`,  { debateStatus: "cancelled" });

    await writeNotification(debate.authorUid, {
      type:     "debate-declined",
      threadId,
      fromName: debate.opponentNickname,
      message:  `⚔️ ${debate.opponentNickname}-მა უარი თქვა გამოწვევაზე.`
    });

    return res.json({ ok: true });
  }


  // ============================================================
  // action: 'cancel-debate' — ავტორი აუქმებს მოლოდინ გამოწვევას
  // ============================================================
  if (action === "cancel-debate") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "pending") return res.status(400).json({ error: "მხოლოდ მოლოდინის დებატი შეიძლება გაუქმდეს" });
    if (debate.authorUid !== user.uid && !isAdmin) return res.status(403).json({ error: "მხოლოდ ავტორი ან ადმინი" });

    await fbPatch(`/agora-debates/${threadId}`, { phase: "cancelled", cancelledAt: now });
    await fbPatch(`/agora-threads/${threadId}`,  { debateStatus: "cancelled" });

    return res.json({ ok: true });
  }


  // ============================================================
  // action: 'submit-turn' — სვლა საწყის ან საბოლოო ეტაპზე
  // ============================================================
  if (action === "submit-turn") {
    const { threadId, turnBody } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    if (!turnBody || turnBody.trim().length < 5)
      return res.status(400).json({ error: "სვლა მინ. 5 სიმბოლო" });
    if (turnBody.trim().length > 2000)
      return res.status(400).json({ error: "სვლა მაქს. 2000 სიმბოლო" });
    if (containsEmoji(turnBody))
      return res.status(400).json({ error: "emoji-ები აკრძალულია" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "opening" && debate.phase !== "final")
      return res.status(400).json({ error: "ამ ეტაპზე სვლა შეუძლებელია" });
    if (debate.currentTurn !== user.uid)
      return res.status(403).json({ error: "ახლა მეორე მხარის სვლაა" });

    // ვადა შემოწმება
    if (now > debate.turnDeadline) {
      await banForMissedTurn(user.uid);
      await judgeDebate(debate, threadId, user.uid);
      return res.status(403).json({ error: "⏰ სვლის ვადა ამოიწურა. AI კრიტიკოსი განსჯის დებატს." });
    }
    // 24-სთ ლიმიტი
    if (debate.totalDeadline && now > debate.totalDeadline) {
      await judgeDebate(debate, threadId, null);
      return res.status(400).json({ error: "⏰ 24-საათიანი ლიმიტი ამოიწურა. AI განიხილავს." });
    }

    const phaseKey = debate.phase; // "opening" or "final"
    const turns    = debate[phaseKey] || {};
    const turnIdx  = Object.keys(turns).length;
    const maxTurns = phaseKey === "opening" ? OPENING_TURNS_EACH * 2 : FINAL_TURNS_EACH * 2;

    if (turnIdx >= maxTurns)
      return res.status(400).json({ error: "ამ ეტაპის სვლები ამოიწურა" });

    const userData   = await fbGet(`/users/${user.uid}`);
    const nickname   = body.authorName || userData?.nickname || "მომხმარებელი";
    const newTurn    = { uid: user.uid, nickname, body: turnBody.trim(), createdAt: now };

    await fbPatch(`/agora-debates/${threadId}/${phaseKey}`, { [turnIdx]: newTurn });

    const nextIdx = turnIdx + 1;
    const otherUid = user.uid === debate.authorUid ? debate.opponentUid : debate.authorUid;

    if (nextIdx >= maxTurns) {
      // ეტაპი დასრულდა
      if (phaseKey === "opening") {
        // opening → cross-asking
        await fbPatch(`/agora-debates/${threadId}`, {
          phase:       "cross-asking",
          currentTurn: debate.authorUid,
          turnDeadline: now + TURN_TIMEOUT_MS,
          debatePhase: "cross",
          crossRound:  1
        });
        await fbPatch(`/agora-threads/${threadId}`, { debatePhase: "cross" });
        await writeNotification(debate.authorUid, {
          type: "debate-turn", threadId,
          message: "⚔️ საწყისი ეტაპი დასრულდა! შენი ჯერია — გამოაქვეყნე კითხვები დაკითხვის ეტაპისთვის."
        });
      } else {
        // final → verdict
        const freshDebate = await fbGet(`/agora-debates/${threadId}`);
        await judgeDebate({ ...freshDebate, [phaseKey]: { ...turns, [turnIdx]: newTurn } }, threadId, null);
      }
    } else {
      // შემდეგი სვლა
      await fbPatch(`/agora-debates/${threadId}`, {
        currentTurn:  otherUid,
        turnDeadline: now + TURN_TIMEOUT_MS
      });
      await writeNotification(otherUid, {
        type:    "debate-turn",
        threadId,
        fromName: nickname,
        message: `⚔️ ${nickname}-მა სვლა გააკეთა. შენი ჯერია!`
      });
    }

    return res.json({ ok: true, turnIdx, nextTurn: nextIdx < maxTurns ? otherUid : null });
  }


  // ============================================================
  // action: 'submit-cross-questions' — ავტორი სვამს კითხვებს
  // ============================================================
  if (action === "submit-cross-questions") {
    const { threadId, questions } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    if (!Array.isArray(questions) || questions.length < CROSS_MIN_Q)
      return res.status(400).json({ error: `მინ. ${CROSS_MIN_Q} კითხვა საჭიროა` });
    if (questions.length > CROSS_MAX_Q)
      return res.status(400).json({ error: `მაქს. ${CROSS_MAX_Q} კითხვა` });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "cross-asking") return res.status(400).json({ error: "ეს ეტაპი არ არის cross-asking" });
    if (debate.currentTurn !== user.uid) return res.status(403).json({ error: "ახლა შენი ჯერი არ არის" });
    if (now > debate.turnDeadline) {
      await banForMissedTurn(user.uid);
      await judgeDebate(debate, threadId, user.uid);
      return res.status(403).json({ error: "⏰ ვადა ამოიწურა" });
    }

    // კითხვები შევინახოთ (round 1 ან 2)
    const crossRound  = debate.crossRound || 1;
    const crossKey    = crossRound === 2 ? 'cross2' : 'cross';
    // ამ სვლაზე currentTurn = asker; answerer = მეორე მხარე
    const answererUid = user.uid === debate.authorUid ? debate.opponentUid : debate.authorUid;

    const qObj = {};
    questions.forEach((q, i) => {
      const text = String(q).trim();
      if (text.length > 0) qObj[i] = { body: text.substring(0, 500), createdAt: now };
    });

    await fbPatch(`/agora-debates/${threadId}/${crossKey}`, { questions: qObj, askerUid: user.uid });
    await fbPatch(`/agora-debates/${threadId}`, {
      phase:       "cross-answering",
      currentTurn: answererUid,
      turnDeadline: now + TURN_TIMEOUT_MS
    });
    await fbPatch(`/agora-threads/${threadId}`, { debatePhase: "cross" });

    await writeNotification(answererUid, {
      type:    "debate-turn",
      threadId,
      message: `⚔️ კითხვები გამოქვეყნდა! უპასუხე ${questions.length} კითხვაზე.`
    });

    return res.json({ ok: true, questionCount: Object.keys(qObj).length });
  }


  // ============================================================
  // action: 'submit-cross-answer' — ოპონენტი პასუხობს
  // ============================================================
  if (action === "submit-cross-answer") {
    const { threadId, questionIdx, answer } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });
    if (!["yes","no","idk"].includes(answer))
      return res.status(400).json({ error: "პასუხი: yes / no / idk" });
    if (questionIdx === undefined || questionIdx === null)
      return res.status(400).json({ error: "questionIdx სავალდებულოა" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "cross-answering") return res.status(400).json({ error: "ეს ეტაპი არ არის cross-answering" });
    // answerer = currentTurn (set when questions were submitted)
    if (debate.currentTurn !== user.uid) return res.status(403).json({ error: "ახლა შენი ჯერი არ არის" });
    if (now > debate.turnDeadline) {
      await banForMissedTurn(user.uid);
      await judgeDebate(debate, threadId, user.uid);
      return res.status(403).json({ error: "⏰ ვადა ამოიწურა" });
    }

    const crossRound = debate.crossRound || 1;
    const crossKey   = crossRound === 2 ? 'cross2' : 'cross';
    const questions  = debate[crossKey]?.questions || {};
    const totalQ     = Object.keys(questions).length;
    const answers    = debate[crossKey]?.answers   || {};

    if (answers[questionIdx] !== undefined)
      return res.status(400).json({ error: "ეს კითხვა უკვე პასუხგაცემულია" });
    if (questions[questionIdx] === undefined)
      return res.status(400).json({ error: "კითხვა ვერ მოიძებნა" });

    await fbPatch(`/agora-debates/${threadId}/${crossKey}/answers`, {
      [questionIdx]: { answer, createdAt: now }
    });

    const newAnswerCount = Object.keys(answers).length + 1;

    if (newAnswerCount >= totalQ) {
      if (crossRound === 1) {
        // Round 1 დასრულდა → Round 2: ოპონენტი სვამს კითხვებს, ავტორი პასუხობს
        const round2Asker = debate.opponentUid;
        await fbPatch(`/agora-debates/${threadId}`, {
          phase:       "cross-asking",
          currentTurn: round2Asker,
          turnDeadline: now + TURN_TIMEOUT_MS,
          crossRound:  2
        });
        await writeNotification(round2Asker, {
          type:    "debate-turn",
          threadId,
          message: "⚔️ პირველი დაკითხვა დასრულდა! ახლა შენი ჯერია — გამოაქვეყნე კითხვები."
        });
        await writeNotification(debate.authorUid, {
          type:    "debate-turn",
          threadId,
          message: `⚔️ ${debate.opponentNickname||'ოპონენტი'} ახლა კითხვებს სვამს. ელოდე.`
        });
        return res.json({ ok: true, allAnswered: true, nextPhase: "cross-asking-2" });
      } else {
        // Round 2 დასრულდა → final
        await fbPatch(`/agora-debates/${threadId}`, {
          phase:        "final",
          currentTurn:  debate.authorUid,
          turnDeadline: now + TURN_TIMEOUT_MS
        });
        await fbPatch(`/agora-threads/${threadId}`, { debatePhase: "final" });
        await writeNotification(debate.authorUid, {
          type:    "debate-turn",
          threadId,
          message: "⚔️ დაკითხვა დასრულდა! საბოლოო პაექრობა იწყება — შენი ჯერია."
        });
        await writeNotification(debate.opponentUid, {
          type:    "debate-turn",
          threadId,
          message: "⚔️ დაკითხვა დასრულდა! საბოლოო პაექრობა იწყება."
        });
        return res.json({ ok: true, allAnswered: true, nextPhase: "final" });
      }
    } else {
      // კიდევ კითხვები რჩება
      await fbPatch(`/agora-debates/${threadId}`, { turnDeadline: now + TURN_TIMEOUT_MS });
      return res.json({ ok: true, answered: newAnswerCount, total: totalQ });
    }
  }


  // ============================================================
  // action: 'request-end-debate' — ადრეული დასრულების მოთხოვნა
  // ============================================================
  if (action === "request-end-debate") {
    const { threadId } = body;
    if (!threadId) return res.status(400).json({ error: "threadId სავალდებულოა" });

    const debate = await fbGet(`/agora-debates/${threadId}`);
    if (!debate) return res.status(404).json({ error: "დებატი ვერ მოიძებნა" });
    if (debate.phase !== "final") return res.status(400).json({ error: "მხოლოდ საბოლოო ეტაპზეა შესაძლებელი" });
    if (user.uid !== debate.authorUid && user.uid !== debate.opponentUid)
      return res.status(403).json({ error: "მხოლოდ მონაწილეებს შეუძლიათ" });

    const endVotes = debate.endVotes || {};
    endVotes[user.uid] = true;
    await fbPatch(`/agora-debates/${threadId}`, { endVotes });

    const bothAgreed = endVotes[debate.authorUid] && endVotes[debate.opponentUid];
    if (bothAgreed) {
      const freshDebate = await fbGet(`/agora-debates/${threadId}`);
      await judgeDebate(freshDebate, threadId, null);
      return res.json({ ok: true, judging: true });
    }

    // შეატყობინე მეორე მხარეს
    const otherUid = user.uid === debate.authorUid ? debate.opponentUid : debate.authorUid;
    await writeNotification(otherUid, {
      type:    "debate-turn",
      threadId,
      message: `⚑ ${nickname}-მა დებატის ადრე დასრულება მოითხოვა. შენც დათანხმდები?`
    });

    return res.json({ ok: true, judging: false });
  }


  return res.status(400).json({ error: "უცნობი action" });
}
