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

        const reviewPrompt = `შენ ხარ ფილოსოფიური ვებსაიტის მკაცრი რედაქტორი. შენი საიტი ეხება მხოლოდ სერიოზულ ფილოსოფიას.

მომხმარებელმა გამოგზავნა შემდეგი სტატია:

სათაური: ${title}
შინაარსი: ${plainContent}

შეამოწმე სტატია და უპასუხე მხოლოდ JSON ფორმატში, სხვა არაფერი:

{"valid": true, "message": "სტატია დადასტურებულია და ადმინისტრატორს გაეგზავნება განხილვისთვის."}
ან
{"valid": false, "message": "კონკრეტული მიზეზი ქართულად"}

შემოწმების კრიტერიუმები (ყველა სავალდებულოა):

1. **ფილოსოფიური შინაარსი** — სტატია ᲛᲮᲝᲚᲝᲓ მაშინ არის ვალიდური, თუ:
   - პირდაპირ ეხება ფილოსოფიურ თეორიებს, მიმდინარეობებს, კონცეფციებს, ან ფილოსოფოსებს
   - იყენებს ფილოსოფიურ მეთოდოლოგიას (ანალიზი, არგუმენტაცია, კონტრარგუმენტი)
   - ეხება ეპისტემოლოგიას, ეთიკას, მეტაფიზიკას, ლოგიკას, ეგზისტენციალიზმს, ონტოლოგიას, ესთეტიკას ან მსგავს დარგებს

2. **ᲛᲙᲐᲪᲠᲐᲓ უარყავი თუ**:
   - სტატია ეხება ყოველდღიურ საგნებს (საკვები, სპორტი, ტექნოლოგია, პოლიტიკა) ყოველგვარი ღრმა ფილოსოფიური ანალიზის გარეშე
   - სათაური ან შინაარსი ფილოსოფიური ჩანს, მაგრამ ტექსტი ზედაპირულია ან ტრივიალური
   - სტატია მხოლოდ "ფილოსოფიურ" სიტყვებს იყენებს შინაარსის გარეშე (მაგ: "პიცა არსებობს, ამიტომ ყოფიერება..." — ეს არ არის ფილოსოფია)
   - სპამი, უაზრო ტექსტი, განმეორებადი სიმბოლოები
   - უხამსი ან შეურაცხმყოფელი შინაარსი
   - 80 სიმბოლოზე ნაკლები — ძალიან მოკლეა

3. **კარგი მაგალითები** (valid):
   - "კანტის კატეგორიული იმპერატივი და თანამედროვე ეთიკა"
   - "სარტრის ეგზისტენციალიზმი: არსებობა წინ უსწრებს არსს"
   - "პლატონის იდეათა სამყარო და თანამედროვე ეპისტემოლოგია"

4. **ცუდი მაგალითები** (invalid):
   - "პიცა და ყოფიერება" — ყოველდღიური საგანი, არა სერიოზული ფილოსოფია
   - "ფეხბურთი ცხოვრების გაგებაა" — ზედაპირული, ფილოსოფიური ანალიზი არ არის
   - ნებისმიერი სტატია სადაც ფილოსოფია მხოლოდ საბაბია სხვა თემაზე სასაუბროდ

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
