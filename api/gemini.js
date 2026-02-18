// ===== gemma-3-27b-it (14,400 მოთხოვნა/დღეში) =====
// ავტომატურად იყენებს ყველა GEMINI_KEY_* გასაღებს — რამდენსაც დაამატებ Vercel-ში

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // ავტომატურად კითხულობს ყველა GEMINI_KEY_1, KEY_2, KEY_3... რამდენიც გაქვს
        const apiKeys = Object.keys(process.env)
            .filter(k => k.startsWith("GEMINI_KEY_"))
            .sort()
            .map(k => process.env[k])
            .filter(Boolean);

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: "No API keys configured" });
        }

        let lastError = null;
        
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
                    return res.status(200).json(data);
                }
                
                lastError = { status: geminiRes.status, data };
                continue;
                
            } catch (err) {
                lastError = { error: err.message };
                continue;
            }
        }

        return res.status(503).json({ 
            error: "All API keys exhausted", 
            details: lastError 
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
