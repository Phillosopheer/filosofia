// ===== AI სტატიის შემოწმება + Anti-Spam სისტემა =====
// Session 30: VPN, Honeypot, Rate Limit, ბანი (24h / 60 დღე)
// Firebase Admin SDK (Service Account) — App Check-ს გვერდს უვლის

const FIREBASE_DB      = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const BLOCK_HOURS      = 24;
const BLOCK_DAYS_ABUSE = 60;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX    = 3;

const ALLOWED_ORIGINS = [
    "https://filosofia-xi.vercel.app",
    "https://philosoph.vercel.app"
];

// ===== Service Account → Access Token =====
let cachedToken = null;
let tokenExpiry  = 0;

async function getAdminToken() {
    if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    const now     = Math.floor(Date.now() / 1000);
    const payload = {
        iss: sa.client_email,
        sub: sa.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email"
    };

    // JWT header
    const header = { alg: "RS256", typ: "JWT" };
    const enc    = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    const signingInput = `${enc(header)}.${enc(payload)}`;

    // Private key import
    const pemBody  = sa.private_key.replace(/-----[^-]+-----/g,"").replace(/\s/g,"");
    const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8", keyBytes,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false, ["sign"]
    );

    const sig = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5", cryptoKey,
        new TextEncoder().encode(signingInput)
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");

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

// ===== Firebase REST (Admin) =====
async function fbGet(path) {
    const token = await getAdminToken();
    const res   = await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`);
    if (!res.ok) return null;
    return await res.json();
}

async function fbSet(path, data) {
    const token = await getAdminToken();
    await fetch(`${FIREBASE_DB}${path}.json?access_token=${token}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
    });
}

// ===== IP Hash =====
async function hashIP(ip) {
    const data = new TextEncoder().encode(ip + "filosof_salt_2025");
    const buf  = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("").substring(0,32);
}

// ===== VPN / Proxy / Tor =====
async function isVPN(ip) {
    if (!ip || ip === "unknown" || ip === "::1" || ip.startsWith("127.")) return false;
    try {
        const res  = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`);
        const data = await res.json();
        return data.status === "success" && (data.proxy === true || data.hosting === true);
    } catch { return false; }
}

// ===== HANDLER =====
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const origin  = req.headers["origin"]  || "";
    const referer = req.headers["referer"] || "";
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));

    if (req.method === "OPTIONS") {
        if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin || ALLOWED_ORIGINS[0]);
        return res.status(200).end();
    }
    if (!isAllowed)            return res.status(403).json({ error: "Forbidden" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
            || req.headers["x-real-ip"]
            || req.socket?.remoteAddress
            || "unknown";
        const ipHash = await hashIP(ip);
        const now    = Date.now();

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { title, content, honeypot, fpHash } = body;

        // ===== fpHash ვალიდაცია =====
        const validFp = typeof fpHash === "string" && /^[0-9a-f]{32}$/.test(fpHash);

        // ===== არსებული ბანი — IP =====
        const banData = await fbGet(`/bot-blocks/${ipHash}`);
        if (banData?.blockedUntil && now < banData.blockedUntil) {
            const ms       = banData.blockedUntil - now;
            const daysLeft  = Math.ceil(ms / 86400000);
            const hoursLeft = Math.ceil(ms / 3600000);
            const timeStr   = daysLeft > 1 ? `${daysLeft} დღით` : `${hoursLeft} საათით`;
            return res.status(403).json({ blocked: true, hoursLeft, message: `შენ დაბლოკილი ხარ ${timeStr}.` });
        }

        // ===== არსებული ბანი — fpHash =====
        if (validFp) {
            const fpBan = await fbGet(`/bot-blocks/${fpHash}`);
            if (fpBan?.blockedUntil && now < fpBan.blockedUntil) {
                const ms       = fpBan.blockedUntil - now;
                const daysLeft  = Math.ceil(ms / 86400000);
                const hoursLeft = Math.ceil(ms / 3600000);
                const timeStr   = daysLeft > 1 ? `${daysLeft} დღით` : `${hoursLeft} საათით`;
                return res.status(403).json({ blocked: true, hoursLeft, message: `შენ დაბლოკილი ხარ ${timeStr}.` });
            }
        }
        if (!title || !content) return res.status(400).json({ error: "სათაური და შინაარსი სავალდებულოა" });

        // ===== HONEYPOT =====
        if (honeypot) {
            await fbSet(`/bot-blocks/${ipHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "honeypot" });
            if (validFp) await fbSet(`/bot-blocks/${fpHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "honeypot" });
            return res.status(403).json({ blocked: true, hoursLeft: BLOCK_HOURS, message: `ბოტი გამოვლინდა. დაბლოკილი ხარ ${BLOCK_HOURS} საათით.` });
        }

        // ===== VPN =====
        const vpnDetected = await isVPN(ip);
        if (vpnDetected) {
            return res.status(403).json({ blocked: true, message: "VPN/Proxy/Tor-ის გამოყენება სტატიის გაგზავნისას დაუშვებელია." });
        }

        // ===== RATE LIMIT — IP =====
        const rlData      = await fbGet(`/bot-ratelimit-sub/${ipHash}`);
        const windowStart = now - RATE_LIMIT_WINDOW;
        const recentTs    = (rlData?.timestamps || []).filter(t => t > windowStart);

        if (recentTs.length >= RATE_LIMIT_MAX) {
            await fbSet(`/bot-blocks/${ipHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "ratelimit" });
            if (validFp) await fbSet(`/bot-blocks/${fpHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "ratelimit" });
            return res.status(403).json({ blocked: true, hoursLeft: BLOCK_HOURS, message: `1 საათში მაქსიმუმ ${RATE_LIMIT_MAX} სტატიის გაგზავნა შეიძლება. დაბლოკილი ხარ ${BLOCK_HOURS} საათით.` });
        }

        // ===== RATE LIMIT — fpHash =====
        if (validFp) {
            const rlFp       = await fbGet(`/bot-ratelimit-sub/${fpHash}`);
            const recentFpTs = (rlFp?.timestamps || []).filter(t => t > windowStart);
            if (recentFpTs.length >= RATE_LIMIT_MAX) {
                await fbSet(`/bot-blocks/${ipHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "ratelimit_fp" });
                await fbSet(`/bot-blocks/${fpHash}`, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "ratelimit_fp" });
                return res.status(403).json({ blocked: true, hoursLeft: BLOCK_HOURS, message: `1 საათში მაქსიმუმ ${RATE_LIMIT_MAX} სტატიის გაგზავნა შეიძლება. დაბლოკილი ხარ ${BLOCK_HOURS} საათით.` });
            }
            await fbSet(`/bot-ratelimit-sub/${fpHash}`, { timestamps: [...recentFpTs, now] });
        }

        await fbSet(`/bot-ratelimit-sub/${ipHash}`, { timestamps: [...recentTs, now] });

        // ===== AI შემოწმება =====
        const plainContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const reviewPrompt = `შენ ხარ ფილოსოფიური ვებსაიტის მკაცრი რედაქტორი და მოდერატორი.

მომხმარებელმა გამოგზავნა:
სათაური: ${title}
შინაარსი: ${plainContent}

უპასუხე მხოლოდ JSON ფორმატში, სხვა არაფერი:
{"valid": true/false, "abuse": true/false, "message": "მიზეზი ქართულად"}

"abuse"=true — გინება, ლანძღვა, უხამსობა, შეურაცხყოფა, ძალადობრივი ენა.
"valid"=false (abuse=false) — ფილოსოფიასთან კავშირი არ აქვს, სპამია, 80 სიმბოლოზე ნაკლებია.
"valid"=true, "abuse"=false — ნორმალური ფილოსოფიური სტატია.
მხოლოდ JSON.`;

        const apiKeys = Object.keys(process.env).filter(k => k.startsWith("GEMINI_KEY_")).sort().map(k => process.env[k]).filter(Boolean);
        if (apiKeys.length === 0) return res.status(500).json({ error: "No API keys" });

        let geminiText = null;
        for (const key of apiKeys) {
            try {
                const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${key}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: reviewPrompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 200 } })
                });
                if (r.status === 429 || r.status === 403) continue;
                const d = await r.json();
                if (r.ok) { geminiText = d?.candidates?.[0]?.content?.parts?.[0]?.text || ""; break; }
            } catch { continue; }
        }

        if (geminiText === null) {
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს.", skipped: true });
        }

        let result;
        try {
            const m = geminiText.match(/\{[\s\S]*\}/);
            result  = JSON.parse(m ? m[0] : geminiText);
        } catch {
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს.", skipped: true });
        }

        // ===== ABUSE → 60 დღე =====
        if (result.abuse === true) {
            await fbSet(`/bot-blocks/${ipHash}`, { blockedUntil: now + BLOCK_DAYS_ABUSE * 86400000, reason: "abuse" });
            if (validFp) await fbSet(`/bot-blocks/${fpHash}`, { blockedUntil: now + BLOCK_DAYS_ABUSE * 86400000, reason: "abuse" });
            return res.status(403).json({ blocked: true, daysLeft: BLOCK_DAYS_ABUSE, message: `შეურაცხმყოფელი შინაარსი. IP დაბლოკილია ${BLOCK_DAYS_ABUSE} დღით.` });
        }

        if (!result.valid) {
            return res.status(200).json({ valid: false, message: result.message || "სტატია ვერ გაიარა AI-ის შემოწმება. სცადე სათაური ან შინაარსი დააზუსტო." });
        }

        return res.status(200).json({ valid: true, message: result.message || "სტატია დადასტურებულია." });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
