# 📌 Project Full Context — Philosophy Site (ფილოსოფია)

> ⚠️ **NOTE FOR NEXT ASSISTANT:** The user speaks Georgian (ქართული). ALWAYS respond in Georgian!
> The user is Nodar Kebadze. He is working on a Georgian philosophy website.
> Be patient and explain things simply — he is not a professional developer but learns fast.

---

## 🔔 ASSISTANT-ის ᲨᲔᲮᲡᲔᲜᲔᲑᲔᲑᲘ (ᲛᲜᲘᲨᲕᲜᲔᲚᲝᲕᲐᲜᲘ!)

- ✅ ყოველი სესიის ბოლოს — "ნოდარ, გინდა კონტექსტი განვაახლოთ?"
- ✅ როცა ახალი ფიჩერი დაემატება
- ✅ როცა URL ან კონფიგი იცვლება
- ✅ როცა PageSpeed/Security ქულები იცვლება
- ✅ როცა Firebase-ში მასშტაბური ცვლილება ხდება
- ✅ როცა ახალი env variable ემატება Vercel-ში

---

## ✅ CURRENT STATE (February 27, 2026 — Session 31)

- ✅ Frontend on Vercel — **Ready**
- ✅ **GitHub Repository** — **PRIVATE** 🔒 (Phillosopheer/filosofia)
- ✅ Mozilla Observatory: **A+ 140/100, 10/10** 🏆
- ✅ ImmuniWeb: **A**
- ✅ Qualys SSL Labs: **A+ (ორივე სერვერი)** 🏆
- ✅ SecurityHeaders.com: **A+** ✅
- ✅ PageSpeed Mobile: **98** 🚀
- ✅ PageSpeed Desktop: **98** 🚀
- ✅ PageSpeed SEO: **100/100**
- ✅ PageSpeed Accessibility: **100/100**
- ✅ CLS Mobile: **0.003** 🏆
- ✅ CLS Desktop: **0.028**
- ✅ Google Search Console: verified + sitemap submitted
- ✅ Firebase App Check — **ENFORCED** (Realtime Database) 🔒
- ✅ **Fonts** — Self-hosted
- ✅ **TOTP 2FA** — Google Authenticator
- ✅ **Glossary** — **50,334 სიტყვა** Firebase-ში! 🏆
- ✅ **GitHub Uploader** — ჩაშენებული UI-ში
- ✅ **Public Submission** — visitors-ებს სტატიის გაგზავნა შეუძლიათ
- ✅ **Mobile Console** — Admin-only (extras.js)
- ✅ **Particles** — ოქროს ნაწილაკები (extras.js)
- ✅ **ფემინისტური ფილოსოფია** — კატეგორია დაემატა (Session 26)
- ✅ **AI Review** — სტატიის გაგზავნამდე AI ამოწმებს (Session 27) 🤖
- ✅ **Pending ღილაკები** — გამოსწორდა (Session 29) 🟢
- ✅ **Anti-Spam სისტემა** — სრული დაცვა (Session 30) 🛡️
- ✅ **Firebase Admin SDK** — Service Account, App Check-ს გვერდს უვლის (Session 30) 🔑
- ✅ **Anti-Spam ბაგები გასწორდა** — (Session 31) 🐛

---

## ✅ Session 31-ში გაკეთებული (Bug Fixes):

### პრობლემა 1: `შენიშვნა: undefined`
- **მიზეზი:** Gemini-მ `valid: false` დააბრუნა `message`-ის გარეშე
- **გამოსწორება `api/review.js`:** `result.message || "სტატია ვერ გაიარა AI-ის შემოწმება..."`
- **გამოსწორება `js/script.js`:** ყველა `reviewData.message` → fallback-ებით

### პრობლემა 2: Rate Limit არ მუშაობდა (500 error)
- **მიზეზი:** `FIREBASE_SERVICE_ACCOUNT` Vercel-ში **კოდი იყო შეყვანილი JSON-ის მაგივრად**
- **გამოსწორება:** სწორი Service Account JSON ჩაიწერა
- **შედეგი:** Rate Limit ✅, 24h ბანი ✅ — სრულად მუშაობს

### ფაილები შეცვლილი (Session 31):
- `api/review.js` — `result.message` fallback
- `js/script.js` — `reviewData.message` + `reviewData.error` handling

---

## ✅ Session 30-ში გაკეთებული (Anti-Spam + Admin SDK):

### სტატიის გაგზავნა (`api/review.js`):
- 🪤 **Honeypot** — ფარული ველი (`#website_hp`), ბოტი ავსებს → **24h ბანი**
- 🌐 **VPN/Proxy/Tor გამოვლენა** — ip-api.com → მყისიერი ბლოკი
- 📊 **Rate Limit** — 3 სტატია/საათში, მე-4-ზე **24h ბანი** (AI-ს გარეშეც)
- 🤬 **გინება/შეურაცხყოფა** → **60 დღის ბანი**
- Firebase node: `bot-ratelimit-sub` (სტატიებისთვის ცალკე)
- **ბლოკი IP-ზეა** (`ipHash`) — Firebase `bot-blocks` node-ში

### AI ასისტენტი (`api/gemini.js`):
- 🌐 **VPN/Proxy/Tor** → მყისიერი ბლოკი
- ❌ **ნებისმიერი დარღვევა** → **პირდაპირ 24h ბანი**

### Firebase Admin SDK (ორივე ფაილში):
- `getAdminToken()` — Service Account-ით JWT → Access Token (1 საათი ქეშდება)
- `fbGet(path)` / `fbSet(path, data)` — Admin REST, App Check-ს გვერდს უვლის
- **Env var:** `FIREBASE_SERVICE_ACCOUNT` — Vercel-ში **სწორი JSON!** **არასოდეს GitHub-ზე!** 🔴

### Vercel Env Variables:
- `FIREBASE_SERVICE_ACCOUNT` — **სწორი Service Account JSON** 🔑
- `TOTP_SECRET` — TOTP 2FA
- `GEMINI_KEY_1` ... `GEMINI_KEY_10` — Gemini API keys

### Firebase Rules:
```json
{
  "rules": {
    ".read": false, ".write": false,
    "notes": { ".read": true, ".write": "auth != null" },
    "glossary": { ".read": true },
    "pending-notes": { ".read": "auth != null", ".write": true },
    "bot-blocks": { ".read": true, ".write": true },
    "bot-ratelimit": { ".read": true, ".write": true },
    "bot-ratelimit-sub": { ".read": true, ".write": true }
  }
}
```

---

## ⚠️ ᲨᲔᲛᲓᲔᲒ ASSISTANT — ANTI-SPAM-ის შესახებ:
- `FIREBASE_SERVICE_ACCOUNT` — Vercel env var — **სრული JSON უნდა იყოს, არა კოდი!** 🔴
- `getAdminToken()` — JWT-ით Access Token, 1 საათს ქეშავს — **ნუ შეცვლი!**
- `#website_hp` — Honeypot ველი — **ნუ წაშლი!**
- `bot-ratelimit-sub` — სტატიების Rate Limit node
- `bot-blocks` — ბანების node (IP hash-ით)
- VPN გამოვლენა — `ip-api.com` (server-side HTTP, უფასო)
- **`onclick="" HTML-ში`** — CSP ბლოკავს! addEventListener გამოიყენე
- **`getValidIdToken()`** — Firebase write-ის წინ ყოველთვის გამოიყენე
- **სესიის ბოლოს შეახსენე კონტექსტის განახლება!** 🔔

---

## ✅ Session 29-ში გაკეთებული:
- Firebase Rules — `notes` ნოდს `.write` დაემატა
- CSP: ყველა `onclick=` → `addEventListener`
- `refreshToken` localStorage-ში, `getValidIdToken()` დაემატა

---

## ⚠️ GLOSSARY:
- **დასრულებულია** — 50,334 სიტყვა ✅
- ახალი სიტყვები: **Firebase Console → /glossary → Import JSON**
- **curl არ მუშაობს** — App Check ბლოკავს!

---

## ⚠️ PageSpeed ისტორია

| Session | Desktop | Mobile | Desktop CLS | Mobile CLS |
|---|---|---|---|---|
| Session 9 | 81 | 80 | 0.244 | 0.148 |
| **Session 24** | **98** 🏆 | **98** 🏆 | **0.028** | **0.003** 🏆 |

---

## ⚠️ ᲨᲔᲛᲓᲔᲒ ASSISTANT:
- Google Fonts **ნუ შეეხები** — self-hosted-ია
- **Skeleton cards არ გამოიყენო** — CLS-ს ამაღლებს
- App Check **ENFORCED on Realtime Database** 🔒
- მთავარი URL: `philosoph.vercel.app`
- **curl Firebase-ზე არ მუშაობს** — App Check ბლოკავს!
- **CSP `'unsafe-inline'` არ არის** — inline onclick-ები ბლოკდება!
- **სესიის ბოლოს შეახსენე კონტექსტის განახლება!** 🔔

---

## 🌐 URLs
- **Frontend:** https://philosoph.vercel.app ✅
- **Frontend (ძველი):** https://filosofia-xi.vercel.app
- **API:** https://philosoph.vercel.app/api/gemini
- **GitHub:** https://github.com/Phillosopheer/filosofia 🔒

---

## ⚠️ TODO (Session 32+):
1. **Meta URLs განახლება** — canonical, og:url ჯერ კიდევ GitHub Pages-ზეა
2. **robots.txt** sitemap URL ძველია
3. **CSP meta** — `connect-src`-ში `filosofia-xi.vercel.app` ჯერ კიდევ არის
4. **Telegram Bot** — საიტის მონიტორინგი 👁️

---

## 📁 File Structure
```
/
├── api/
│   ├── gemini.js            ← AI ასისტენტი + Admin SDK + Anti-Spam (Session 30)
│   ├── review.js            ← სტატიის შემოწმება + Admin SDK + Anti-Spam + bugfix (Session 31)
│   └── verify-totp.js       ← TOTP 2FA
├── css/
│   ├── style.css            ← .hp-field კლასი (Session 30)
│   └── fonts/               ← Self-hosted
├── js/
│   ├── script.js            ← honeypot + ბანის handling + bugfix (Session 31)
│   ├── extras.js
│   └── firebase-app-compat.js
├── index.html               ← #website_hp honeypot (Session 30)
├── philosopher-bg.jpg       ← DO NOT DELETE
├── philosopher-bg.webp
├── sitemap.xml
├── robots.txt
├── CNAME
└── vercel.json              ← CRITICAL
```

---

## ⚙️ Tech Stack
- Frontend → Vercel
- Backend → Vercel /api/gemini + /api/verify-totp + /api/review
- Database → Firebase Realtime DB
- AI → **gemma-3-27b-it** (GEMINI_KEY_1...GEMINI_KEY_10) — **არასოდეს შეცვალო!**
- Auth → Firebase Auth + TOTP (TOTP_SECRET env var)
- VPN Detection → ip-api.com (server-side, უფასო)
- Firebase Admin → Service Account JWT (FIREBASE_SERVICE_ACCOUNT env var)

---

## 🔑 Critical Rules
1. Firebase `apiKey` — კლიენტური, **ნებადართულია** კოდში
2. Model: `gemma-3-27b-it` — **არასოდეს** შეცვალო!
3. `vercel.json` — root-ში, **არასოდეს** წაშალო
4. `index.html` — **lowercase i**!
5. Firebase App Compat — **CDN 12.9.0**
6. CORS — `gemini.js`-ში მხოლოდ
7. **Google Fonts** — **არ გამოიყენო!** Self-hosted-ია
8. **Skeleton cards** — **არ გამოიყენო!**
9. App Check — **ENFORCED on Realtime Database** 🔒
10. **curl Firebase-ზე** — App Check ბლოკავს!
11. **onclick="" HTML-ში** — **არ გამოიყენო!** addEventListener გამოიყენე
12. **getValidIdToken()** — Firebase write-ის წინ ყოველთვის გამოიყენე
13. **#website_hp** — Honeypot ველი, **არ წაშალო!**
14. **bot-ratelimit-sub** — Firebase node, სტატიების Rate Limit-ისთვის
15. **FIREBASE_SERVICE_ACCOUNT** — Vercel env var, **სრული JSON**, **არასოდეს GitHub-ზე!** 🔴
16. **getAdminToken()** — Admin SDK, App Check-ს გვერდს უვლის, **ნუ შეცვლი!**
17. **bot-blocks** — IP ბანები (ipHash), Firebase-ში ინახება

---

## 🛡️ Scripts (index.html head):
```html
<script src="https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js"
  integrity="sha384-3XWNJu2qFQ6l+dVvCdcgpGP7mp9cxB8uT+w78+fV0wyyiD0lYQ2yMt2cFZOlCcFp"
  crossorigin="anonymous" defer></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js"
  integrity="sha384-iF93NE9DFYjJ/GJcb4h18LKfvMn3Ppl4GSSFZ8RFvwc7OtGGQSHQXbHEdO8Rknhj"
  crossorigin="anonymous" defer></script>
<script src="js/extras.js" defer></script>
<script src="js/script.js" defer></script>
```

---

## 🔐 Firebase Config:
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

## 🧪 Test Results

| Tool | Result |
|---|---|
| Mozilla Observatory | **A+ (140/100), 10/10** 🏆 |
| Qualys SSL Labs | **A+ ორივე სერვერზე** 🏆 |
| SecurityHeaders.com | **A+** ✅ |
| ImmuniWeb | **A** ✅ |
| PageSpeed Mobile | **98** 🚀 |
| PageSpeed Desktop | **98** 🚀 |
| PageSpeed SEO | **100/100** ✅ |
| PageSpeed Accessibility | **100/100** ✅ |
| CLS Mobile | **0.003** 🏆 |
| CLS Desktop | **0.028** ✅ |
| Google Search Console | **Verified** ✅ |
| Firebase App Check | **Enforced** 🔒 |
| Glossary | **50,334 სიტყვა** 🏆 |
| Pending ღილაკები | **✅ გამოსწორდა (Session 29)** |
| Anti-Spam სისტემა | **✅ სრული დაცვა (Session 30)** 🛡️ |
| Firebase Admin SDK | **✅ სწორი JSON (Session 31)** 🔑 |
| Rate Limit 3/საათი | **✅ დატესტილია (Session 31)** |
| 24h ბანი | **✅ დატესტილია (Session 31)** |
| Abuse/გინება → 60 დღე | **✅ დატესტილია (Session 31)** |
| Tor Browser ბლოკი | **✅ დატესტილია (Session 31)** 🧅 |
| DuckDuckGo VPN | **⚠️ ვერ ბლოკავს — IP-საც ვერ მალავს** |

---

## 📋 Instructions for Next Assistant
- ZIP → `/mnt/user-data/uploads/` → unzip → read files
- Modified files → `/mnt/user-data/outputs/`
- Syntax check: `node --check api/review.js` / `node --check api/gemini.js`
- `present_files` tool for sharing
- **სესიის ბოლოს ყოველთვის შეახსენე კონტექსტის განახლება!** 🔔
