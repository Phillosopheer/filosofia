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

        // Multi-key array - Load from Vercel environment variables
        const apiKeys = [
            process.env.GEMINI_KEY_1,
            process.env.GEMINI_KEY_2,
            process.env.GEMINI_KEY_3,
            process.env.GEMINI_KEY_4,
            process.env.GEMINI_KEY_5,
            process.env.GEMINI_KEY_6,
            process.env.GEMINI_KEY_7,
            process.env.GEMINI_KEY_8,
            process.env.GEMINI_KEY_9,
            process.env.GEMINI_KEY_10,
        ].filter(Boolean); // Remove undefined keys

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: "No API keys configured" });
        }

        // Try each key until one succeeds
        let lastError = null;
        
        for (const key of apiKeys) {
            try {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    }
                );

                // If rate limited (429) or quota exceeded (403), try next key
                if (geminiRes.status === 429 || geminiRes.status === 403) {
                    lastError = { status: geminiRes.status, message: "Rate limit or quota exceeded" };
                    continue;
                }

                const data = await geminiRes.json();
                
                // If successful response
                if (geminiRes.ok) {
                    return res.status(200).json(data);
                }
                
                // Other errors - try next key
                lastError = { status: geminiRes.status, data };
                continue;
                
            } catch (err) {
                lastError = { error: err.message };
                continue;
            }
        }

        // All keys failed
        return res.status(503).json({ 
            error: "All API keys exhausted", 
            details: lastError 
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
