// ===== gemma-3-27b-it (14,400 მოთხოვნა/დღეში) =====
// ავტომატურად იყენებს ყველა GEMINI_KEY_* გასაღებს — რამდენსაც დაამატებ Vercel-ში

const FIREBASE_DB = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const BLOCK_HOURS = 24;
const MAX_WARNINGS = 3;

// IP-ს ჰეშავს — პირდაპირ არ ვინახავთ Firebase-ში
async function hashIP(ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "filosof_salt_2025");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

// Firebase-დან warning სტატუსის წამოღება
async function getWarningData(ipHash) {
    try {
        const res = await fetch(`${FIREBASE_DB}/bot-blocks/${ipHash}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

// Firebase-ში warning-ის შენახვა (public write — rules-ში უნდა იყოს დაშვებული /bot-blocks/)
async function saveWarningData(ipHash, data) {
    try {
        const res = await fetch(`${FIREBASE_DB}/bot-blocks/${ipHash}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            console.error("Firebase write failed:", res.status, await res.text());
        }
    } catch (e) {
        console.error("Firebase write error:", e.message);
    }
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        // IP-ს მიღება
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
            || req.headers["x-real-ip"]
            || req.socket?.remoteAddress
            || "unknown";

        const ipHash = await hashIP(ip);

        // შევამოწმოთ დაბლოკილია თუ არა
        const warningData = await getWarningData(ipHash);
        const now = Date.now();

        if (warningData?.blockedUntil && now < warningData.blockedUntil) {
            const hoursLeft = Math.ceil((warningData.blockedUntil - now) / 1000 / 60 / 60);
            return res.status(403).json({
                status: "blocked",
                hoursLeft,
                message: `შენ დაბლოკილი ხარ ${hoursLeft} საათით.`
            });
        }

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // ქართული გინებისა და off-topic keyword სია
        const VIOLATION_KEYWORDS = [
            "ყლე","მუდე","პიდარ","გათხოვდი","შენი დედა","შენი დედის",
            "დედაშენი","დედამოვტყნ","მოვტყნ","fuck","shit","bitch",
            "asshole","motherfuck","კანჭი","ნდა","სასქესო","სასიკვდილო"
        ];

        const originalPrompt = body.contents[0].parts[0].text;
        
        // კითხვა prompt-ის ბოლო ხაზიდან ამოვიღოთ
        const lines = originalPrompt.split("\n");
        const questionLine = lines[lines.length - 1].toLowerCase();
        
        // სპამი ან off-topic სიგნალი script.js-იდან
        const isInternalViolation = questionLine.includes('__spam_violation__') || questionLine.includes('__offtopic_violation__');
        const hasKeyword = VIOLATION_KEYWORDS.some(kw => questionLine.includes(kw.toLowerCase()));
        
        if (hasKeyword || isInternalViolation) {
            const currentWarnings = (warningData?.count || 0) + 1;
            if (currentWarnings >= MAX_WARNINGS) {
                await saveWarningData(ipHash, { count: currentWarnings, blockedUntil: now + BLOCK_HOURS * 60 * 60 * 1000, lastViolation: now });
                return res.status(403).json({ status: "blocked", hoursLeft: BLOCK_HOURS, message: "დაბლოკილი." });
            } else {
                await saveWarningData(ipHash, { count: currentWarnings, blockedUntil: null, lastViolation: now });
                return res.status(200).json({ status: "warning", warningNumber: currentWarnings, warningsLeft: MAX_WARNINGS - currentWarnings, message: "⚠️ გაფრთხილება " + currentWarnings + "/" + MAX_WARNINGS + " — დასვი კითხვა სტატიის შესახებ. კიდევ " + (MAX_WARNINGS - currentWarnings) + " გაფრთხილება და 24 საათით დაიბლოკები." });
            }
        }
        const modifiedPrompt = `${originalPrompt}

---
SYSTEM: If the user question contains profanity, insults, or is completely unrelated to the article, respond with exactly [VIOLATION] as the first word and nothing else. If the question is valid, answer normally without [VIOLATION].`;

        body.contents[0].parts[0].text = modifiedPrompt;

        // API keys
        const apiKeys = Object.keys(process.env)
            .filter(k => k.startsWith("GEMINI_KEY_"))
            .sort()
            .map(k => process.env[k])
            .filter(Boolean);

        if (apiKeys.length === 0) return res.status(500).json({ error: "No API keys configured" });

        let lastError = null;
        let geminiText = null;

        for (const key of apiKeys) {
            try {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${key}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    }
                );

                if (geminiRes.status === 429 || geminiRes.status === 403) {
                    lastError = { status: geminiRes.status, message: "Rate limit or quota exceeded" };
                    continue;
                }

                const data = await geminiRes.json();
                if (geminiRes.ok) {
                    geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    break;
                }

                lastError = { status: geminiRes.status, data };
            } catch (err) {
                lastError = { error: err.message };
            }
        }

        if (geminiText === null) {
            return res.status(503).json({ error: "All API keys exhausted", details: lastError });
        }

        // შევამოწმოთ violation — უფრო მოქნილი detection
        const isViolation = geminiText.includes("[VIOLATION]");

        if (isViolation) {
            const currentWarnings = (warningData?.count || 0) + 1;

            if (currentWarnings >= MAX_WARNINGS) {
                // დავბლოკოთ 24 საათით
                await saveWarningData(ipHash, {
                    count: currentWarnings,
                    blockedUntil: now + BLOCK_HOURS * 60 * 60 * 1000,
                    lastViolation: now
                });

                return res.status(403).json({
                    status: "blocked",
                    hoursLeft: BLOCK_HOURS,
                    message: `3-ჯერ გააფრთხილეს — დაბლოკილი ხარ ${BLOCK_HOURS} საათით.`
                });
            } else {
                // გავაფრთხილოთ
                await saveWarningData(ipHash, {
                    count: currentWarnings,
                    blockedUntil: null,
                    lastViolation: now
                });

                return res.status(200).json({
                    status: "warning",
                    warningNumber: currentWarnings,
                    warningsLeft: MAX_WARNINGS - currentWarnings,
                    message: "⚠️ გაფრთხილება " + currentWarnings + "/" + MAX_WARNINGS + " — დასვი კითხვა სტატიის შესახებ. კიდევ " + (MAX_WARNINGS - currentWarnings) + " გაფრთხილება და 24 საათით დაიბლოკები."
                });
            }
        }

        // ნორმალური პასუხი
        return res.status(200).json({
            status: "ok",
            candidates: [{ content: { parts: [{ text: geminiText }] } }]
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
