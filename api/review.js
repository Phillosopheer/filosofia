// ===== AI სტატიის შემოწმება (gemma-3-27b-it) =====
// გამოიყენება Public Submission-ამდე — სანამ ნოდარი დაადასტურებს

const ALLOWED_ORIGINS = [
    "https://filosofia-xi.vercel.app",
    "https://philosoph.vercel.app"
];

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const origin = req.headers["origin"] || "";
    const referer = req.headers["referer"] || "";
    const isAllowedOrigin = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));

    if (req.method === "OPTIONS") {
        if (isAllowedOrigin) res.setHeader("Access-Control-Allow-Origin", origin || ALLOWED_ORIGINS[0]);
        return res.status(200).end();
    }

    if (!isAllowedOrigin) return res.status(403).json({ error: "Forbidden" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { title, content } = body;

        if (!title || !content) {
            return res.status(400).json({ error: "სათაური და შინაარსი სავალდებულოა" });
        }

        // HTML ტეგების გაწმენდა plain text-ისთვის
        const plainContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        const reviewPrompt = `შენ ხარ ფილოსოფიური ვებსაიტის სტატიების მიმომხილველი.

მომხმარებელმა გამოგზავნა შემდეგი სტატია:

სათაური: ${title}
შინაარსი: ${plainContent}

შეამოწმე სტატია და უპასუხე მხოლოდ JSON ფორმატში, სხვა არაფერი:

თუ სტატია ვალიდურია (ფილოსოფიურია, უხამსობა არ შეიცავს, გასაგებია):
{"valid": true, "message": "სტატია დადასტურებულია და ადმინისტრატორს გაეგზავნება განხილვისთვის."}

თუ სტატია არ არის ვალიდური, დაწერე კონკრეტულად რა უნდა გასწორდეს:
{"valid": false, "message": "კონკრეტული პრობლემა და რჩევა"}

შემოწმების კრიტერიუმები:
1. უხამსი ან შეურაცხმყოფელი სიტყვები — არ არის დაშვებული
2. სპამი ან უაზრო ტექსტი — არ არის დაშვებული  
3. ფილოსოფიასთან კავშირი — სტატია უნდა ეხებოდეს ფილოსოფიას, ფილოსოფოსებს, ფილოსოფიურ იდეებს ან დაკავშირებულ თემებს
4. მინიმალური სიგრძე — 50 სიმბოლოზე ნაკლები ძალიან მოკლეა

მხოლოდ JSON, სხვა ტექსტი არ დაწეროთ.`;

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
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: reviewPrompt }] }],
                            generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
                        }),
                    }
                );

                if (geminiRes.status === 429 || geminiRes.status === 403) {
                    lastError = { status: geminiRes.status };
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
            // თუ Gemini-ი მიუწვდომელია — გავუშვათ სტატია (fail open)
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს განხილვისთვის.", skipped: true });
        }

        // JSON-ის ამოღება პასუხიდან
        let result;
        try {
            const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : geminiText);
        } catch {
            // პარსინგი ვერ მოხდა — გავუშვათ სტატია
            return res.status(200).json({ valid: true, message: "სტატია გაეგზავნება ადმინისტრატორს განხილვისთვის.", skipped: true });
        }

        return res.status(200).json(result);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
