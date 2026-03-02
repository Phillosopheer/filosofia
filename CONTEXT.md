# 📌 Project Full Context — Philosophy Site (ფილოსოფია)

> ⚠️ **NOTE FOR NEXT ASSISTANT:** The user speaks Georgian (ქართული). ALWAYS respond in Georgian!
> The user is Nodar Kebadze. He is working on a Georgian philosophy website.
> Be patient and explain things simply — he is not a professional developer but learns fast.
> ⚠️ **სესიის ბოლოს ყოველთვის ჰკითხე: "ნოდარ, გინდა კონტექსტი განვაახლოთ?"**

---

## 🔔 ASSISTANT-ის ᲨᲔᲮᲡᲔᲜᲔᲑᲔᲑᲘ

- ✅ ყოველი სესიის ბოლოს — "ნოდარ, გინდა კონტექსტი განვაახლოთ?"
- ✅ როცა ახალი ფიჩერი დაემატება
- ✅ როცა Firebase-ში მასშტაბური ცვლილება ხდება
- ✅ როცა Vercel env var ემატება

---

## 🎨 ᲓᲘᲖᲐᲘᲜᲘᲡ ᲛᲙᲐᲪᲠᲘ ᲬᲔᲡᲔᲑᲘ (ყოველთვის დაიცავი!)

1. **ფერები** — `#0e0c0a` (ფონი), `#161310` (surface), `#c9a84c` (gold), `#e8dfc8` (text), `#b8ad95` (text-dim). **ლურჯი, მწვანე, ნებისმიერი "ცივი" ფერი — კატეგორიულად აკრძალულია!**
2. **ღილაკები** — არასოდეს browser-default! ყოველი ღილაკი სტილიზებული (gold border, dark background, hover effects).
3. **Dropdown/popup** — ფონი `#161310` ან `#1e1a15`, border `rgba(201,168,76,0.2)`, box-shadow dark.
4. **ანიმაცია** — fadeIn, smooth transitions. Abrupt jumps — არა.
5. **მობაილი** — ყოველი ახალი UI ელემენტი მობაილზეც გამართული (fixed positioning, vh/vw).
6. **ესთეტიკა** — ნოდარი ძალიან ყურადღებით ადევნებს თვალს. ყველა ელემენტი **უნდა შეხამდებოდეს** ფილოსოფიური საიტის ატმოსფეროს.

---

## 📁 AGORA ფაილების სახელები (მკაცრი!)

| გამოსატანი ფაილი | GitHub-ზე ადგილი |
|---|---|
| `agora.js` | → `api/agora.js` |
| `agora.js` | → `js/agora.js` |
| `agora.css` | → `css/agora.css` |
| `script.js` | → `js/script.js` |
| `index.html` | → root `/` |

**არასოდეს** `api_agora.js`, `agora_api.js`, `agora_js.js` — მხოლოდ ზემოთ მოცემული სახელები!
**ყურადღება:** outputs-ში ორი `agora.js` ერთმანეთს ვერ გადაეყრება — `js/` და `api/` ქვეფოლდერებში ინახება.

---

## ✅ CURRENT STATE (March 1, 2026 — Session 47)

- ✅ Frontend on Vercel — **Ready**
- ✅ GitHub: **PRIVATE** 🔒 (Phillosopheer/filosofia)
- ✅ Mozilla Observatory: **A+ 140/100** 🏆
- ✅ Qualys SSL Labs: **A+** 🏆
- ✅ SecurityHeaders.com: **A+**
- ✅ PageSpeed Mobile/Desktop: **98/98** 🚀
- ✅ PageSpeed SEO/Accessibility: **100/100**
- ✅ CLS Mobile: **0.003** 🏆
- ✅ Firebase App Check — **ENFORCED** 🔒
- ✅ Fonts — Self-hosted
- ✅ TOTP 2FA — Google Authenticator
- ✅ Glossary — **50,334 სიტყვა** 🏆
- ✅ Anti-Spam სისტემა 🛡️
- ✅ Browser Fingerprint (fpHash) — Canvas+WebGL+Audio+Fonts+Plugins, 48 char
- ✅ კატეგორიის AI შემოწმება
- ✅ რეგისტრაციის სისტემა 👤
- ✅ Profile Popup (avatar კლიკი → popup) 💬
- ✅ Admin Avatar + 👑 Owner badge
- ✅ Nickname Inline Edit + 60-დღიანი ლიმიტი
- ✅ სახელის ვალიდაცია — მხოლოდ ასოები + _
- ✅ /usernames/ — დაკავებული სახელების DB
- ✅ articlesCount — სტატიის დადასტურებისას ავტომატური +1
- ✅ ავატარის წაშლა — წითელი ✕ ღილაკი popup-ში
- ✅ Header flash ბაგი — Session 40
- ✅ წაშლილი Firebase აქაუნთი — ავტო logout
- ✅ მომხმარებლის ბლოკვის სისტემა
- ✅ VPN/Proxy/Tor + Incognito — რეგისტრაციაზე ბლოკი
- ✅ მომხმარებლების მართვის პანელი (ბანი/განბლოკვა/წაშლა)
- ✅ alert()/confirm() → Toast + ConfirmDialog
- ✅ Brevo API — 300 email/დღე
- ✅ IP ბანის სისტემა + lastIp
- ✅ Login fix: USER_DISABLED, 5 მცდელობა
- ✅ banned-emails Firebase node
- ✅ **პაროლის აღდგენა** — Session 41
- ✅ **აგორა (ფილოსოფიური ფორუმი)** — Session 42
- ✅ **აგორა — token refresh, edit modal** — Session 44
- ✅ **🔔 Notifications სისტემა** — Session 45
- ✅ **👤 User Card Popup** — Session 45
- ✅ **topicsCount** — Session 45
- ✅ **✂️ Selection Quote + Multiple Quotes** — Session 46
- ✅ **AI მოდერაცია — გამკაცრება + patronizing ამოცნობა** — Session 46
- ✅ **AI quote ციტირება error-ში** — Session 46
- ✅ **Warning Toast redesign** (მუქი, X ღილაკი) — Session 46
- ✅ **🚫 Admin დაბლოკილების პანელი** (სია + განბლოკვა) — Session 46
- ✅ **Gemini გასაღებები** — 12 ცალი, 168,000 req/დღე
- ✅ **🔍 თემების ძებნა** — Session 47
- ✅ **AI Prompt ქართული — გაუმჯობესება** — Session 47

---

## ✅ Session 47-ში გაკეთებული (სრული)

### 🔍 თემების ძებნა (Search):
- `index.html`: `#agoraSearchWrap` — საძიებო ველი `agoraListView`-ში, `agoraDescription`-ის ქვემოთ
- `index.html`: `#agoraSearchInput`, `#agoraSearchClear`, `#agoraSearchResults`
- `api/agora.js`: `search-threads` action — `/agora-threads/` სკანი, title+body ძებნა, max 30 შედეგი
- `js/agora.js`: `agoraInitSearch()` — openAgora()-ში გამოძახება
- `js/agora.js`: `agoraDoSearch(query)` — 350ms debounce, results div
- `js/agora.js`: `agoraSearchClearState()` — ძებნის გასუფთავება
- `css/agora.css`: `.agora-search-wrap`, `.agora-search-input`, `.agora-search-clear`, `.agora-search-count`
- ძებნის შედეგზე კლიკი → ასუფთავებს search-ს და ხსნის thread-ს

### 🤖 AI Prompt ქართული — გაუმჯობესება:
- thread prompt + reply prompt — ორივეში დაემატა:
  `⚠️ ᲔᲜᲝᲑᲠᲘᲕᲘ ᲬᲔᲡᲘ: message ველი წერე სრულყოფილ, სალიტერატურო ქართულად. გამოიყენე გრამატიკულად სწორი, ბუნებრივი ქართული წინადადებები. ნუ გამოიყენებ გაუმართავ სიტყვათა კომბინაციებს.`
- `message` — "მოკლე" → "2-3 წინადადებით კონკრეტულად"
- შედეგი: AI-ს ქართული შესამჩნევად გაუმჯობესდა, patronizing კომენტარი წარმატებით ამოიცნო

---

## ✅ Session 46-ში გაკეთებული (სრული)

### ✂️ Selection Quote + Multiple Quotes:
- `_agoraQuote` (single) → `_agoraQuotes = []` (array)
- `agoraAddQuote(q)`, `agoraRemoveQuote(index)`, `agoraUpdateQuoteStack()`
- "↩ ციტირება" ღილაკი: პირველ რიგში **selection** (მონიშნული ტექსტი), fallback — მთელი body
- **ერთი ლოგიკა** desktop + mobile — bubble გაუქმდა
- `api/agora.js`: `quotes` array შენახვა; backward compat (`quotedBody` ძველი)
- Reply card: `r.quotes` (ახალი) ან `r.quotedBody` (ძველი)

### 🤖 AI მოდერაციის გამკაცრება:
- Thread prompt: კულინარია/სპორტი/ყოველდღიური → `philosophical:false`; კონკრეტული მაგალითები
- Reply prompt: **patronizing/დახვეწილი დამცირება** ამოიცნობა
- `quote` ველი — AI აბრუნებს კონკრეტულ პრობლემურ ფრაზას
- Error message-ში: `❝ "კონკრეტული ფრაზა"`

### ⚠️ Warning Toast redesign:
- მუქი ფონი `#1a1410`, gold border
- **✕ ღილაკი** — სანამ მომხმარებელი არ დახურავს (auto-hide გაუქმდა)
- `.agora-warn-msg` + `.agora-warn-quote`

### 🚫 Admin დაბლოკილების პანელი:
- "🚫 დაბლოკილები" ღილაკი — ჩანს მხოლოდ ადმინს, `agoraShowList`-ში
- `agoraOpenBannedPanel()` — panel: avatar, nickname, დრო, "განბლოკვა"
- `api/agora.js` → `get-agora-banned`: `/agora-warnings/` სკანი + nickname lookup
- `api/agora.js` → `unban-agora`: warnings reset + Firebase Auth enable + banned-emails წაშლა

---

## Firebase Rules (სრული — Session 45):
```json
{
  "rules": {
    ".read": false, ".write": false,
    "notes": { ".read": true, ".write": "auth != null" },
    "glossary": { ".read": true },
    "pending-notes": { ".read": "auth != null", ".write": true },
    "bot-blocks": { ".read": true, ".write": true },
    "bot-ratelimit": { ".read": true, ".write": true },
    "bot-ratelimit-sub": { ".read": true, ".write": true },
    "bot-cat-warn": { ".read": true, ".write": true },
    "users": {
      ".indexOn": ["fpHash"],
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "admins": { ".read": "auth != null", ".write": false },
    "usernames": { ".read": true, ".write": "auth != null" },
    "banned-fingerprints": { ".read": true, ".write": false },
    "banned-users": { ".read": false, ".write": false },
    "banned-ips": { ".read": true, ".write": false },
    "banned-emails": { ".read": true, ".write": false },
    "agora-threads":  { ".read": true, ".write": false },
    "agora-replies":  { ".read": true, ".write": false },
    "agora-warnings": { ".read": false, ".write": false },
    "notifications": {
      "$uid": { ".read": false, ".write": false }
    }
  }
}
```

---

## Vercel Env Variables:
- `FIREBASE_SERVICE_ACCOUNT` — სრული JSON (**არასოდეს GitHub-ზე!** 🔴)
- `TOTP_SECRET` — TOTP 2FA
- `GEMINI_KEY_1` ... `GEMINI_KEY_12` — 12 გასაღები, rotation ავტომატური (429/403 → შემდეგი)
- `BREVO_KEY` — Brevo API key
- ~~RESEND_KEY~~ — აღარ გამოიყენება

### Admin:
- UID: `bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2`
- `/admins/bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2: true`

---

## ⚠️ ᲨᲔᲛᲓᲔᲒ ASSISTANT — ᲙᲠᲘᲢᲘᲙᲣᲚᲘ ᲬᲔᲡᲔᲑᲘ:

### ფაილები:
- `BREVO_KEY` / `FIREBASE_SERVICE_ACCOUNT` — **არასოდეს GitHub-ზე!** 🔴
- `getAdminToken()` — **ნუ შეცვლი!** (send-code.js, ban-user.js, reset-password.js, agora.js)
- `reset-password.js`-ში — `identitytoolkit` scope სავალდებულოა!
- `#website_hp` — Honeypot, **ნუ წაშლი!**
- `maxOutputTokens: 350` — **არ შეამციროს!**
- `onclick=""` — CSP ბლოკავს! **addEventListener გამოიყენე**
- Google Fonts — **self-hosted, ნუ შეეხები!**
- **Skeleton cards** — **არ გამოიყენო!** (CLS)
- App Check ENFORCED — Firebase server-side Service Account-ით!
- AI მოდელი — **gemma-3-27b-it** — **არასოდეს შეცვალო!**

### Agora-სპეციფიური:
- `currentUser`/`userToken`/`idToken` — `let` ცვლადები `script.js`-ში! გამოიყენე: `typeof currentUser !== 'undefined'`
- ადმინი: avatar — `localStorage.getItem('adminPhoto')`, nickname — `localStorage.getItem('adminDisplayName')`
- user avatar: `currentUser.photoURL` (არა `avatar`!)
- `agoraGetValidToken()` — **async!** submit-ებში `await`
- `banned-ips` — `.` → `_`; `banned-emails` — `[.#$[]@]` → `_`
- `ban-user.js` — `ADMIN_UID` hardcoded: `bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2`
- `showToast(msg, type)` — success/error/info
- `showConfirmToast(msg, fn)` — confirm()-ის ნაცვლად
- `closeAgora()` — `document.body.style.overflow = ''` სავალდებულო!
- **`_agoraQuotes = []`** — array! (არა `_agoraQuote` single — Session 46-ში შეიცვალა)
- Quote ღილაკი: selection პირველი, fallback — მთელი body. **Bubble გაუქმებულია!**
- `quotes` array Firebase-ში: `[{ replyId, body, author, num }]` — max 10
- Reply card: `r.quotes` (ახალი) ან `r.quotedBody` (ძველი, backward compat)
- **`agoraShowWarningToast(message, isBanned, quote)`** — 3 პარამეტრი!
- `agoraOpenBannedPanel()` — admin-only, `agoraShowList`-ში ემატება ღილაკი
- `get-agora-banned` / `unban-agora` — admin-only actions `api/agora.js`-ში
- `agora-warnings/{uid}`: `{ count, banned, bannedAt, unbannedAt }`
- `profilePopup` — `avatarWrap` div-შია
- `adminDisplayName` — admin nickname key (არა `adminNickname`!)
- `nicknameLastChanged` — 60d limit
- `_userCardCache` — user card cache, agora.js global
- **Search:** `agoraInitSearch()` — openAgora()-ში გამოძახება; `search-threads` action api-ში

### დიზაინი:
- gold `#c9a84c`, bg `#0e0c0a`, surface `#161310`
- **ლურჯი/ცივი ფერები — კატეგორიულად აკრძალულია!**
- ღილაკები — ყოველთვის სტილიზებული, არასოდეს browser-default
- მობაილი — `position: fixed`, `left/right: 8px`

---

## 🌐 URLs
- Frontend: https://philosoph.vercel.app
- GitHub: https://github.com/Phillosopheer/filosofia

---

## ⚠️ TODO (Session 48+):
1. Forum — Admin pin/unpin thread
2. Forum — სტატისტიკა profile popup-ში
3. Firebase Storage — avatar (ამჟამად base64 DB-ში)
4. Meta URLs — canonical, og:url
5. robots.txt — sitemap URL ძველია
6. CSP — connect-src-ში filosofia-xi.vercel.app ჯერ კიდევ არის
7. Telegram Bot — მონიტორინგი
8. Domain → საკუთარი domain

---

## 📁 File Structure
```
/
├── api/
│   ├── gemini.js
│   ├── review.js
│   ├── send-code.js
│   ├── ban-user.js
│   ├── reset-password.js
│   ├── agora.js              ← Session 47-ში განახლდა
│   └── verify-totp.js
├── css/
│   ├── style.css
│   ├── agora.css             ← Session 47-ში განახლდა
│   └── fonts/
├── js/
│   ├── script.js
│   ├── agora.js              ← Session 47-ში განახლდა
│   ├── extras.js
│   └── firebase-app-compat.js
├── index.html                ← Session 47-ში განახლდა
├── philosopher-bg.jpg
├── philosopher-bg.webp
├── sitemap.xml
├── robots.txt
├── CNAME
└── vercel.json
```

---

## ⚙️ Tech Stack
- Frontend → Vercel
- Database → Firebase Realtime DB
- AI → **gemma-3-27b-it** — **არასოდეს შეცვალო!**
- Auth Admin → Firebase Email/Password + TOTP
- Auth Users → Firebase Email/Password
- Email → Brevo (nodoqebadze21@gmail.com) — 300/დღე
- VPN Detection → ip-api.com
- Firebase Admin → Service Account JWT
- Incognito Detection → client-side detectIncognito + server confirm

---

## 🔐 Firebase Config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao",
  authDomain: "gen-lang-client-0339684222.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0339684222",
  storageBucket: "gen-lang-client-033968422.firebasestorage.app",
  messagingSenderId: "636166502416",
  appId: "1:636166502416:web:78841eec3ba4c658a07295"
};
```

---

## 📋 Instructions for Next Assistant
- ZIP → `/mnt/user-data/uploads/` → unzip → read files
- Modified files → `/mnt/user-data/outputs/` (js/ api/ css/ ქვეფოლდერებში)
- Syntax check: `node --check js/agora.js && node --check api/agora.js`
- `present_files` tool for sharing
- **ფაილების სახელები** — იხილე "AGORA ფაილების სახელები" სექცია!
- **დიზაინი** — იხილე "ᲓᲘᲖᲐᲘᲜᲘᲡ ᲛᲙᲐᲪᲠᲘ ᲬᲔᲡᲔᲑᲘ" სექცია!
- **სესიის ბოლოს ყოველთვის შეახსენე კონტექსტის განახლება!** 🔔
