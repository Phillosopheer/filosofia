// ===== AI სტატიის შემოწმება + Anti-Spam სისტემა =====
// Session 30: VPN გამოვლენა, Honeypot, Rate Limit, ბანი (24h / 60 დღე)

const FIREBASE_DB    = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const BLOCK_HOURS    = 24;
const BLOCK_DAYS_ABUSE = 60;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 საათი
const RATE_LIMIT_MAX    = 3;               // 3 სტატია/საათში

const ALLOWED_ORIGINS = [
    "https://filosofia-xi.vercel.app",
    "https://philosoph.vercel.app"
];

async function hashIP(ip) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(ip + "filosof_salt_2025");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

async function getBanData(ipHash) {
    try {
        const res = await fetch(`${FIREBASE_DB}/bot-blocks/${ipHash}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

async function saveBanData(ipHash, data) {
    try {
        await fetch(`${FIREBASE_DB}/bot-blocks/${ipHash}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (e) { console.error("Firebase ban save error:", e.message); }
}

async function getRateLimitData(ipHash) {
    try {
        const res = await fetch(`${FIREBASE_DB}/bot-ratelimit-sub/${ipHash}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

async function saveRateLimitData(ipHash, data) {
    try {
        await fetch(`${FIREBASE_DB}/bot-ratelimit-sub/${ipHash}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (e) { console.error("Rate limit save error:", e.message); }
}

async function isVPN(ip) {
    if (!ip || ip === "unknown" || ip === "::1" || ip.startsWith("127.")) return false;
    try {
        const res  = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`);
        const data = await res.json();
        return data.status === "success" && (data.proxy === true || data.hosting === true);
    } catch { return false; }
}

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

        // ===== არსებული ბანი =====
        const banData = await getBanData(ipHash);
        if (banData?.blockedUntil && now < banData.blockedUntil) {
            const ms       = banData.blockedUntil - now;
            const daysLeft  = Math.ceil(ms / 86400000);
            const hoursLeft = Math.ceil(ms / 3600000);
            const timeStr   = daysLeft > 1 ? `${daysLeft} დღით` : `${hoursLeft} საათით`;
            return res.status(403).json({ blocked: true, hoursLeft, message: `შენ დაბლოკილი ხარ ${timeStr}.` });
        }

        // ===== BODY =====
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { title, content, honeypot } = body;

        if (!title || !content) return res.status(400).json({ error: "სათაური და შინაარსი სავალდებულოა" });

        // ===== HONEYPOT =====
        if (honeypot) {
            await saveBanData(ipHash, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "honeypot" });
            return res.status(403).json({ blocked: true, hoursLeft: BLOCK_HOURS, message: `ბოტი გამოვლინდა. დაბლოკილი ხარ ${BLOCK_HOURS} საათით.` });
        }

        // ===== VPN / PROXY / TOR =====
        const vpnDetected = await isVPN(ip);
        if (vpnDetected) {
            return res.status(403).json({ blocked: true, hoursLeft: null, message: "VPN/Proxy/Tor-ის გამოყენება სტატიის გაგზავნისას დაუშვებელია." });
        }

        // ===== RATE LIMIT =====
        const rlData      = await getRateLimitData(ipHash);
        const windowStart = now - RATE_LIMIT_WINDOW;
        const recentTs    = (rlData?.timestamps || []).filter(t => t > windowStart);
        const rateLimitExceeded = recentTs.length >= RATE_LIMIT_MAX;
        await saveRateLimitData(ipHash, { timestamps: [...recentTs, now] });

        // ===== AI შემოწმება =====
        const plainContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        const reviewPrompt = `შენ ხარ ფილოსოფიური ვებსაიტის მკაცრი რედაქტორი და მოდერატორი.

მომხმარებელმა გამოგზავნა:
სათაური: ${title}
შინაარსი: ${plainContent}

უპასუხე მხოლოდ JSON ფორმატში, სხვა არაფერი:

{
  "valid": true ან false,
  "abuse": true ან false,
  "message": "მიზეზი ქართულად"
}

"abuse" = true — თუ სტატია შეიცავს გინებას, ლანძღვას, უხამსობას, შეურაცხყოფას, ძალადობრივ ენას.

"valid" = false (მაგრამ abuse = false) — თუ სტატია ფილოსოფიასთან კავშირი არ აქვს, სპამია, უაზრო ტექსტია, ან 80 სიმბოლოზე ნაკლებია.

"valid" = true, "abuse" = false — ფილოსოფიური სტატია, ნორმალური შინაარსი.

მხოლოდ JSON, სხვა ტექსტი არ დაწეროთ.`;

        const apiKeys = Object.keys(process.env)
            .filter(k => k.startsWith("GEMINI_KEY_"))
            .sort()
            .map(k => process.env[k])
            .filter(Boolean);

        if (apiKeys.length === 0) return res.status(500).json({ error: "No API keys configured" });

        let lastError  = null;
        let geminiText = null;

        for (const key of apiKeys) {
            try {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${key}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: reviewPrompt }] }],
                            generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
                        }),
                    }
                );
                if (geminiRes.status === 429 || geminiRes.status === 403) { lastError = { status: geminiRes.status }; continue; }
                const data = await geminiRes.json();
                if (geminiRes.ok) { geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""; break; }
                lastError = { status: geminiRes.status, data };
            } catch (err) { lastError = { error: err.message }; }
        }

        if (geminiText === null) {
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს განხილვისთვის.", skipped: true });
        }

        let result;
        try {
            const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : geminiText);
        } catch {
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს განხილვისთვის.", skipped: true });
        }

        // ===== ABUSE → 60 დღე =====
        if (result.abuse === true) {
            const blockUntil = now + BLOCK_DAYS_ABUSE * 24 * 3600000;
            await saveBanData(ipHash, { blockedUntil: blockUntil, reason: "abuse" });
            return res.status(403).json({ blocked: true, daysLeft: BLOCK_DAYS_ABUSE, message: `შეურაცხმყოფელი შინაარსი. IP დაბლოკილია ${BLOCK_DAYS_ABUSE} დღით.` });
        }

        // ===== ᲡᲞᲐᲛᲘ + RATE LIMIT → 24 საათი =====
        if (!result.valid && rateLimitExceeded) {
            await saveBanData(ipHash, { blockedUntil: now + BLOCK_HOURS * 3600000, reason: "spam" });
            return res.status(403).json({ blocked: true, hoursLeft: BLOCK_HOURS, message: `სპამი გამოვლინდა. დაბლოკილი ხარ ${BLOCK_HOURS} საათით.` });
        }

        // ===== INVALID (rate limit-ის გარეშე — მხოლოდ უარყოფა, ბანი არ არის) =====
        if (!result.valid) {
            return res.status(200).json({ valid: false, message: result.message });
        }

        return res.status(200).json({ valid: true, message: result.message || "სტატია დადასტურებულია." });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
