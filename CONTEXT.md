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

1. **ფერები** — საიტის ფალიტრა: `#0e0c0a` (ფონი), `#161310` (surface), `#c9a84c` (gold), `#e8dfc8` (text), `#b8ad95` (text-dim). **ლურჯი, მწვანე, ნებისმიერი "ცივი" ფერი — კატეგორიულად აკრძალულია!**
2. **ღილაკები** — არასოდეს უბრალო browser-default ღილაკები! ყოველი ღილაკი უნდა იყოს სტილიზებული, საიტის დიზაინს შესაბამისი (gold border, dark background, hover effects).
3. **Dropdown/popup** — ფონი `#161310` ან `#1e1a15`, border `rgba(201,168,76,0.2)`, box-shadow dark.
4. **ანიმაცია** — fadeIn, smooth transitions — ყოველთვის. Abrupt jumps — არა.
5. **მობაილი** — ყოველი ახალი UI ელემენტი მობაილზეც გამართული უნდა იყოს (fixed positioning, vh/vw).
6. **ესთეტიკა** — ნოდარი ძალიან ყურადღებით ადევნებს თვალს დიზაინს. ყველა ახალი ელემენტი **უნდა შეხამდებოდეს** არსებულ ფილოსოფიური საიტის ატმოსფეროს.

---

## 📁 AGORA ფაილების სახელები (მკაცრი!)

GitHub-ზე ატვირთვისას **ყოველთვის ეს სახელები** გამოიყენე — ნოდარი ცალ-ცალკე ატვირთავს:

| გამოსატანი ფაილი | GitHub-ზე ადგილი |
|---|---|
| `agora.js` | → `api/agora.js` |
| `agora.js` | → `js/agora.js` |
| `agora.css` | → `css/agora.css` |
| `script.js` | → `js/script.js` |
| `index.html` | → root `/` |

**არასოდეს** გამოიყენო `api_agora.js`, `agora_api.js`, `agora_js.js` ან სხვა ვარიანტი — მხოლოდ ზემოთ მოცემული სახელები!

---

## ✅ CURRENT STATE (March 1, 2026 — Session 45)

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
- ✅ სახელის ვალიდაცია — მხოლოდ ასოები + _ (Nodo_Qebadze სტილი)
- ✅ /usernames/ — დაკავებული სახელების DB
- ✅ articlesCount — სტატიის დადასტურებისას ავტომატური +1
- ✅ ავატარის წაშლა — წითელი ✕ ღილაკი popup-ში
- ✅ Header flash ბაგი — Session 40
- ✅ წაშლილი Firebase აქაუნთი — ავტო logout (token validation)
- ✅ მომხმარებლის ბლოკვის სისტემა — Session 37
- ✅ VPN/Proxy/Tor — რეგისტრაციაზე ბლოკი
- ✅ Incognito — რეგისტრაციაზე ბლოკი
- ✅ მომხმარებლების მართვის პანელი (ბანი/განბლოკვა/წაშლა)
- ✅ ბანის ვადა (დღეებით)
- ✅ alert()/confirm() ამოღებულია — Toast + ConfirmDialog
- ✅ Brevo API — 300 email/დღე
- ✅ IP ბანის სისტემა + lastIp
- ✅ fpHash სავალდებულო რეგისტრაციაზე
- ✅ Login fix: USER_DISABLED, 5 მცდელობა, updateHeaderButtons
- ✅ ბანის დრო login-ზე ("დარჩენილია: 28 დღე")
- ✅ banned-emails Firebase node
- ✅ **პაროლის აღდგენა (Forgot Password)** — Session 41
- ✅ **აგორა (ფილოსოფიური ფორუმი)** — Session 42
- ✅ **აგორა — token refresh, authorName fallback** — Session 44
- ✅ **აგორა — edit modal** (inline → popup modal) — Session 44
- ✅ **აგორა — thread სია გასწორდა** (`get-threads`: `items` → `threads`) — Session 45
- ✅ **აგორა — counter** (0 → 0 / 50000) — Session 45
- ✅ **🔔 Notifications სისტემა** — Session 45
- ✅ **👤 User Card Popup** (avatar/სახელზე კლიკი) — Session 45
- ✅ **topicsCount** — thread შექმნისას ავტომატური +1 — Session 45

---

## ✅ Session 45-ში გაკეთებული

### Bug fixes:
- `api/agora.js`: `get-threads` → `result.items` → `result.threads` (thread სია ცარიელი იყო)
- `js/agora.js`: textarea counter — `0` → `0 / 50000`

### 🔔 Notifications სისტემა:
- `api/agora.js`:
  - `writeNotification(uid, data)` — Firebase `/notifications/{uid}/` push
  - `notifyAllUsers(excludeUid, data)` — ყველა user-ს აცნობებს
  - `create-thread` → ყველა user-ს ეცნობება ახალ თემაზე
  - `create-reply` → thread ავტორს ეცნობება reply-ზე; ციტირებულ ავტორს — quote-ზე
  - ახალი actions: `get-notifications`, `mark-notifications-read`
  - ახალი action: `get-user-profile` (auth-ის გარეშე — საჯარო)
- `js/agora.js`:
  - `agoraNotifLoad()`, `agoraNotifUpdateBadge()`, `agoraNotifToggle()`, `agoraNotifRender()`, `agoraNotifMarkAll()`
  - 🔔 ზარი header-ში, წითელი badge წაუკითხავი რაოდენობით
  - dropdown — კლიკი notification-ზე პირდაპირ ხსნის thread-ს
  - auto-reload ყოველ 60 წამში
- `js/script.js`: `updateHeaderButtons()` — `notifWrap` show/hide + `agoraNotifLoad()` on auth
- `index.html`: notifWrap + notifBtn + notifDropdown HTML; `?v=45`
- `css/agora.css`: notification სტილები (gold palette, mobile fixed positioning)

### 👤 User Card Popup:
- `api/agora.js`: `get-user-profile` action — nickname, articlesCount, topicsCount, isOwner
- `js/agora.js`:
  - `agoraShowUserCard(uid, anchorEl)` — popup avatar/სახელზე კლიკზე
  - `agoraBindUserCardTriggers(container)` — `.agora-user-card-trigger` კლასი
  - Owner-ისთვის: "👑 Owner — მთავარი ადმინისტრატორი"
  - User-ისთვის: nickname, სტატიები, თემები
  - `_userCardCache` — repeat fetch-ების თავიდან აცილება
- `css/agora.css`: `.agora-user-card-popup`, `.auc-*` კლასები

### topicsCount:
- `js/agora.js`: thread შექმნის შემდეგ `currentUser.topicsCount++` + `statTopics` DOM განახლება

---

## ✅ Session 44-ში გაკეთებული

- `agoraGetValidToken()` — async, token expiry შემოწმება + refresh
- inline edit ამოღებულია → `agoraOpenEditModal()` popup modal
- `create-reply` / `create-thread`: `authorName` 3-დონის fallback
- `?v=44` cache bust

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
      "$uid": {
        ".read": false,
        ".write": false
      }
    }
  }
}
```

---

## Vercel Env Variables:
- `FIREBASE_SERVICE_ACCOUNT` — სრული JSON (არასოდეს GitHub-ზე!) 🔴
- `TOTP_SECRET` — TOTP 2FA
- `GEMINI_KEY_1` ... `GEMINI_KEY_10`
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
- `reset-password.js`-ში `getAdminToken()` — `identitytoolkit` scope სავალდებულოა!
- `#website_hp` — Honeypot, **ნუ წაშლი!**
- `maxOutputTokens: 350` — **არ შეამციროს!**
- `onclick=""` HTML-ში — CSP ბლოკავს! **addEventListener გამოიყენე**
- Google Fonts — **self-hosted, ნუ შეეხები!**
- **Skeleton cards** — **არ გამოიყენო!** (CLS)
- App Check ENFORCED — Firebase-ზე server-side კითხვა Service Account-ით!

### Agora-სპეციფიური:
- `agora.js`-ში `currentUser`/`userToken`/`idToken` — `let` ცვლადებია `script.js`-ში, window-ზე არ ჩანს! გამოიყენე: `typeof currentUser !== 'undefined'`
- ადმინის avatar: `localStorage.getItem('adminPhoto')`, nickname: `localStorage.getItem('adminDisplayName')`
- user-ის avatar: `currentUser.photoURL` (არა `avatar`!)
- `agoraGetValidToken()` — **async!** submit-ებში `await` გამოიყენე
- `banned-fingerprints` — write მხოლოდ Service Account-ით
- `banned-ips` — IP key-ში წერტილი → `_` (192_168_1_1)
- `banned-emails` — email key-ში `[.#$[]@]` → `_`
- `ban-user.js` — `ADMIN_UID` hardcoded: `bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2`
- `showToast(msg, type)` — success/error/info
- `showConfirmToast(msg, fn)` — confirm()-ის ნაცვლად
- `revealHeader()` — header-ის გამოჩენის ერთადერთი წერტილი!
- `forgot-link-btn` / `forgot-back-btn` — CSS კლასები style.css-ში
- `closeAgora()` — `document.body.style.overflow = ''` სავალდებულო!
- `#agoraDescription` — სტატიკური div, JS ვეღარ გადაწერს
- `agoraBtn` — ყველას უჩანს
- `agora-warnings/{uid}/count` — 1,2,3 → ბანი
- `profilePopup` — `avatarWrap` div-შია
- `adminDisplayName` — admin nickname key (არა `adminNickname`!)
- `nicknameLastChanged` — 60d limit
- `_userCardCache` — user card-ების cache, agora.js-ში global

### დიზაინი:
- **ფერები** — gold `#c9a84c`, bg `#0e0c0a`, surface `#161310`. **ლურჯი/ცივი ფერები — კატეგორიულად აკრძალულია!**
- **ნებისმიერი ახალი UI** — უნდა შეხამდებოდეს საიტის dark/gold ატმოსფეროს
- **ღილაკები** — ყოველთვის სტილიზებული, არასოდეს browser-default
- **მობაილი** — ყოველი popup/dropdown `position: fixed` მობაილზე, `left/right: 8px`

---

## 🌐 URLs
- Frontend: https://philosoph.vercel.app
- GitHub: https://github.com/Phillosopheer/filosofia

---

## ⚠️ TODO (Session 46+):
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
│   ├── agora.js              ← Session 45-ში განახლდა
│   └── verify-totp.js
├── css/
│   ├── style.css
│   ├── agora.css             ← Session 45-ში განახლდა
│   └── fonts/
├── js/
│   ├── script.js             ← Session 45-ში განახლდა
│   ├── agora.js              ← Session 45-ში განახლდა
│   ├── extras.js
│   └── firebase-app-compat.js
├── index.html                ← Session 45-ში განახლდა (?v=45)
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
- Modified files → `/mnt/user-data/outputs/`
- Syntax check: `node --check js/agora.js && node --check api/agora.js`
- `present_files` tool for sharing
- **ფაილების სახელები** — იხილე "AGORA ფაილების სახელები" სექცია ზევით!
- **დიზაინი** — იხილე "ᲓᲘᲖᲐᲘᲜᲘᲡ ᲛᲙᲐᲪᲠᲘ ᲬᲔᲡᲔᲑᲘ" სექცია ზევით!
- **სესიის ბოლოს ყოველთვის შეახსენე კონტექსტის განახლება!** 🔔
