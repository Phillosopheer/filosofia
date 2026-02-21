# 📌 Project Full Context — Philosophy Site (ფილოსოფია)

> ⚠️ **NOTE FOR NEXT ASSISTANT:** The user speaks Georgian (ქართული). ALWAYS respond in Georgian!
> The user is Nodar Kebadze. He is working on a Georgian philosophy website.
> Be patient and explain things simply — he is not a professional developer but learns fast.

---

## ✅ CURRENT STATE (February 21, 2026 — Session 9)

- ✅ Frontend on Vercel — **Ready**
- ✅ **GitHub Repository** — **PRIVATE** 🔒
- ✅ Mozilla Observatory: **A+ 140/100, 10/10** 🏆
- ✅ ImmuniWeb: **A**
- ✅ PageSpeed Desktop: **81**, Mobile: **80**
- ✅ Google Search Console: verified + sitemap submitted
- ✅ Firebase App Check — **Enforced!** ✅
- ✅ **apple-touch-icon.png** — root-ში (ზევსის ლოგო 180x180px)
- ✅ App Check SRI hash — სწორია: `sha384-iF93NE9DFYjJ/GJcb4h18LKfvMn3Ppl4GSSFZ8RFvwc7OtGGQSHQXbHEdO8Rknhj`
- ✅ **DEBUG ბლოკი** — წაშლილია script.js-დან
- ✅ **ადმინ მონიტორი** — მუშაობს (401 error გამოსწორდა Session 9-ში)
- ✅ **Vercel + GitHub** — დაკავშირებულია (Phillosopheer account connected)
- 🔄 Gemini API — სტატუსი უცნობია (ჯერ ვერ შემოწმდა)

---

## ✅ Session 9-ში გაკეთებული:

1. ✅ **ადმინ მონიტორი 401 error** — გამოსწორდა
2. ✅ **CLS გაუმჯობესდა** — Desktop: 0.258 → 0.244, Mobile: 0.174 → 0.148
3. ✅ **Card სურათები** — `card-img-wrapper` div-ებით, `loading="lazy"`, `decoding="async"`
4. ✅ **Carousel** — `card.style.cssText` → CSS class-ები (`carousel-card`, `carousel-card-hover` და სხვ.) — CSP errors შემცირდა
5. ✅ **Hero min-height** — `.hero.no-bg { min-height: 0 }` — კატეგორიის გვერდზე ზედმეტი ადგილი გაქრა
6. ✅ **Grid min-height** — კატეგორიის გვერდზე Firebase load-მდე 600px ადგილი დარეზერვებულია
7. ✅ **index.html** — admin img-ს `width="80" height="80"` დაემატა
8. ✅ **Carousel dots** — `style.background/width` → class toggling (`carousel-dot`, `carousel-dot-active`)

---

## ⚠️ PageSpeed-ის ისტორია

| Session | Desktop | Mobile | Desktop CLS | Mobile CLS |
|---|---|---|---|---|
| Session 5 | 87 | 81 | — | — |
| Session 6 | 75 | 78 | — | — |
| Session 7 | 80 | 81 | — | — |
| Session 8 | 80 | 81 | 0.258 | 0.174 |
| Session 9 | **81** | **80** | **0.244** | **0.148** |

**⚠️ ᲨᲔᲛᲓᲔᲒ ASSISTANT:**
- PageSpeed-ის გასაუმჯობესებლად ნუ შეეხები Google Fonts-ის ჩატვირთვის ლოგიკას! CSP ბლოკავს onload ატრიბუტებს.
- **Skeleton cards არ გამოიყენო CLS-ისთვის** — პირიქით ამაღლებს CLS-ს (Session 9-ში გამოვცადეთ)!
- დარჩენილი CLS 0.244 მოდის Firebase async load-დან და reCAPTCHA-დან — Cloudflare-ით გადაჭრა შეიძლება.

---

## 🌐 URLs

- **Frontend:** https://filosofia-xi.vercel.app ✅
- **API:** https://filosofia-xi.vercel.app/api/gemini
- **GitHub:** https://github.com/Phillosopheer/filosofia 🔒 (Private)

---

## 📁 File Structure
```
/
├── api/gemini.js
├── css/style.css
├── js/
│   └── script.js
│   (firebase-app-compat.js წაშლილია — CDN-ზე გადავიდა Session 8-ში)
├── index.html                  ← lowercase i always!
├── apple-touch-icon.png        ← ზევსის ლოგო 180x180px
├── philosopher-bg.jpg          ← OG image — DO NOT DELETE
├── philosopher-bg.webp
├── sitemap.xml
├── robots.txt
├── CNAME
└── vercel.json                 ← CRITICAL — always in root
```

---

## ⚙️ Tech Stack
- Frontend → Vercel
- Backend → Vercel /api/gemini (serverless)
- Database → Firebase Realtime DB
- AI → **gemma-3-27b-it** (GEMINI_KEY_1, GEMINI_KEY_2 env vars) — **DO NOT CHANGE MODEL!**
- Gemini request: `{ contents: [{ parts: [{ text: prompt }] }] }`
- Gemini response: `data?.candidates?.[0]?.content?.parts?.[0]?.text`

---

## 🔑 Critical Rules
1. Firebase `apiKey` — კლიენტური გასაღებია, **ნებადართულია** კოდში.
2. Model: `gemma-3-27b-it` — **არასოდეს** შეცვალო!
3. `vercel.json` — root-ში, არასოდეს წაშალო
4. `index.html` — **lowercase i** GitHub-ზე!
5. Firebase App Compat — **CDN 12.9.0** (gstatic.com) — Session 8-ში შეიცვალა!
6. CORS headers — `gemini.js`-ში, `/api/(.*)` `vercel.json`-ში არ დაამატო
7. App Check SDK — CDN (gstatic), SRI hash სწორია!
8. **DEBUG ბლოკი წაშლილია** — script.js-ში აღარ არის!
9. **Google Fonts onload/media trick არ მუშაობს** — CSP ბლოკავს!
10. **Skeleton cards არ გამოიყენო** — CLS-ს ამაღლებს!

---

## 🛡️ index.html — Scripts (head-ში) — Session 8 განახლების შემდეგ:
```html
<script src="https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js" integrity="sha384-3XWNJu2qFQ6l+dVvCdcgpGP7mp9cxB8uT+w78+fV0wyyiD0lYQ2yMt2cFZOlCcFp" crossorigin="anonymous" defer></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js" integrity="sha384-iF93NE9DFYjJ/GJcb4h18LKfvMn3Ppl4GSSFZ8RFvwc7OtGGQSHQXbHEdO8Rknhj" crossorigin="anonymous" defer></script>
```

---

## 🔒 Firebase App Check

- **reCAPTCHA Site Key:** `6LdepXIsAAAAAGPzEX8XfPPh1mMSeT8ZUod1Z5CC`
- **Status:** ✅ **ENFORCED**
- **შენიშვნა:** საიტზე მომხმარებლების რეგისტრაცია არ არის — მხოლოდ ნოდარი შედის ადმინად.

---

## 🚫 ALLOWED_ORIGINS (gemini.js — Session 8-ში განახლდა):

```javascript
const ALLOWED_ORIGINS = [
    "https://filosofia-xi.vercel.app"    // ← მხოლოდ ეს! GitHub Pages წაიშალა.
];
```

---

## 🔐 Firebase Config (script.js — სწორი!)

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao",
  authDomain: "gen-lang-client-0339684222.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0339684222",
  storageBucket: "gen-lang-client-0339684222.firebasestorage.app",
  messagingSenderId: "636166502416",
  appId: "1:636166502416:web:78841eec3ba4c658a07295"
};
```

---

## Firebase Rules:
```json
{
  "rules": {
    ".read": false, ".write": false,
    "notes": { ".read": true },
    "glossary": { ".read": true },
    "pending-notes": { ".read": "auth != null", ".write": true },
    "bot-blocks": { ".read": true, ".write": true },
    "bot-ratelimit": { ".read": true, ".write": true }
  }
}
```

---

## 🧪 Test Results

| Tool | Result |
|---|---|
| Mozilla Observatory | **A+ (140/100), 10/10** 🏆 |
| Qualys SSL Labs | **A+ ორივე სერვერზე** 🏆 |
| SecurityHeaders.com | **A+** ✅ |
| ImmuniWeb | **A** ✅ |
| PageSpeed Mobile | **80** |
| PageSpeed Desktop | **81** |
| PageSpeed SEO | **100/100** ✅ |
| PageSpeed Accessibility | **100/100** ✅ |
| Google Search Console | **Verified** ✅ |
| Firebase App Check | **Enforced** ✅ |

---

## 📋 Instructions for Next Assistant

- ZIP → `/mnt/user-data/uploads/` → unzip → read files
- Modified files → `/mnt/user-data/outputs/`
- Syntax check: `node --check js/script.js` / `node --check api/gemini.js`
- Use `present_files` tool for sharing

---

## 🎯 TODO (Session 10 — START HERE!):

1. **Gemini API შემოწმება** — ადმინ მონიტორი → "Gemini-ს შემოწმება" — სტატუსი გაურკვეველია
2. **Cloudflare WAF + Custom Domain** — CLS-ის შემდგომი გაუმჯობესებისთვის:
   - Firebase requests Cloudflare-ზე გაივლის — უფრო სწრაფი
   - Custom domain საჭიროა პირველ რიგში
   - CLS 0.244 → შემდგომი შემცირება შესაძლებელია
3. **PageSpeed გაუმჯობესება** — Desktop 81→87+:
   - Render blocking: 440ms (Firebase, reCAPTCHA)
   - სურათების ოპტიმიზაცია — 111 KiB savings
   - ⚠️ Google Fonts-ს **ნუ შეეხები**!
   - ⚠️ Skeleton cards **არ გამოიყენო**!
