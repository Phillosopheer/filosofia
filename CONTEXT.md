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
2. **ღილაკები** — არასოდეს browser-default! `-webkit-appearance:none` სავალდებულო მობაილზე. ყოველი ღილაკი სტილიზებული.
3. **Dropdown/popup** — ფონი `#161310` ან `#1e1a15`, border `rgba(201,168,76,0.2)`.
4. **ანიმაცია** — fadeIn, smooth transitions. Abrupt jumps — არა.
5. **მობაილი** — ყოველი ახალი UI ელემენტი მობაილზეც გამართული.
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

---

## ✅ CURRENT STATE (March 7, 2026 — Session 55 სრული)

- ✅ Frontend on Vercel — **Ready**
- ✅ GitHub: **PRIVATE** 🔒 (Phillosopheer/filosofia)
- ✅ Mozilla Observatory: **A+ 140/100** 🏆
- ✅ Qualys SSL Labs: **A+** 🏆
- ✅ PageSpeed Mobile/Desktop: **98/98** 🚀
- ✅ PageSpeed SEO/Accessibility: **100/100**
- ✅ Firebase App Check — **ENFORCED** 🔒
- ✅ Fonts — Self-hosted
- ✅ TOTP 2FA — Google Authenticator
- ✅ Glossary — **50,334 სიტყვა** 🏆
- ✅ Anti-Spam სისტემა 🛡️
- ✅ Browser Fingerprint (fpHash)
- ✅ რეგისტრაციის სისტემა + Profile Popup
- ✅ Admin Avatar + 👑 Owner badge
- ✅ Nickname Inline Edit + 60-დღიანი ლიმიტი
- ✅ VPN/Proxy/Tor + Incognito ბლოკი
- ✅ Brevo API — 300 email/დღე
- ✅ IP ბანის სისტემა
- ✅ პაროლის აღდგენა
- ✅ **აგორა (ფილოსოფიური ფორუმი)** — სრული
- ✅ **🔔 Notifications სისტემა**
- ✅ **✂️ Selection Quote + Multiple Quotes**
- ✅ **🔍 თემების ძებნა**
- ✅ **🖥️ Admin პანელი** — ცალკე გვერდი (`admin.html`)
- ✅ **⚔️ 1vs1 დებატების სისტემა — სრული** (Session 51–53)

---

## ✅ Session 55-ში გაკეთებული — სრული სია

### `api/agora.js`:
1. **Auto first turn** — `accept-debate`-ზე `threadBody` ავტომატურად `opening[0]`-ად ჩაიწერება; `currentTurn` პირდაპირ ოპონენტზე გადადის
2. **AI ცენზურა დებატებში** — `moderateDebateTurn()` ახალი ფუნქცია; `submit-turn`-ზე abuse check; 3 გაფრთხილება → 60 დღე ბანი
3. **თემის წაშლა → notification** — დებატის წაშლისას ოპონენტს მოუვა: "X-მა დებატის თემა წაშალა"; debate → `cancelled`
4. **1-საათიანი ლიმიტი** — უკვე იყო (`EDIT_WINDOW_MS`); ადმინის გარდა ვერავინ შლის 1 საათის შემდეგ ✅
5. **maxTurnBody** — `2000` → `40,000` სიმბოლო

### `js/agora.js`:
6. **სტრუქტურირებული ფორმა — სრული** — tab/თავისუფალი რეჟიმი მოხსნილი; მხოლოდ სტრუქტურა: I.თეზისი II.არგუმენტები III.კონტრარგუმენტები IV.ანალოგია V.წყარო VI.დასკვნა
7. **"გეთანხმები" / "პასუხი არ მაქვს" ღილაკები** — მოხსნილია
8. **არგუმენტების ლიმიტი** — ულიმიტო (7-ის ლიმიტი მოხსნილი)
9. **Counter** — `0 / 200` → `0 სიმბოლო (მინ. 200)` / `1,234 სიმბოლო` (ოქრო 200+)
10. **Timer label** — `სვლა:` → `საპასუხო დრო:`

### `css/agora.css`:
11. **სტრუქტურირებული ფორმის CSS** — `.db-mode-tabs`, `.db-struct-label`, `.db-arg-row`, `.db-arg-num`, `.db-struct-divider`, `.db-struct-opt`, `.db-struct-add-btn`, `.db-struct-remove-btn`

---

## ✅ Session 54-ში გაკეთებული — სრული სია

### Bug Fixes (`api/agora.js`):
1. **Notification ტექსტი** — `"სვლა გააკეთა"` → `"გიპასუხა"` (submit-turn notification, სტრ.~1531)
2. **Race condition `request-end-debate`** — `endVotes` ახლა sub-path-ზე იწერება: `fbPatch(.../endVotes, {[uid]: true})` + fresh read, ძველი მთლიანი object override აღარ ხდება

### Bug Fixes (`js/agora.js`):
3. **`closeAgora()` auto-refresh leak** — debate polling (12წმ interval) ახლა `closeAgora()`-შიც ჩერდება
4. **Spectators (მაყურებლები)** — opening/final phase-ზე მესამე პირებს სრული შინაარსი ეჩვენებათ; "⏳ ჯერია..." მხოლოდ მონაწილეებს (isParticipant check)
5. **Verdict transcript** — verdict screen-ზე ახლა სრული დებატი ჩანს: ① opening სვლები, ② cross I/II კითხვა+პასუხი, ③ final სვლები

---

## ✅ Session 53-ში გაკეთებული — სრული სია

### Bug Fixes:
1. **Progress bar layout** — inline flex → CSS კლასები (`db-players-bar` etc.)
2. **ავატარი debate-ში** — Firebase client-side → `get-debate` API სერვერ-სიდეზე ტვირთავს `photoMap`
3. **"გეთანხმები" emoji bug** — `'✓ გეთანხმები'` → `'გეთანხმები'` (✓ emoji regex-ში ხვდებოდა)
4. **"1/5" counter** — `db-player-count` კლასი, ოქრო ფერში ავატარის ქვეშ
5. **`nickname` ReferenceError** — `request-end-debate`-ში `endNick` ადგილობრივად იკითხება

### ახალი ფიჩერები:
6. **⚔️ დაკითხვა — ორი რაუნდი** — I (ავტორი სვამს) + II (ოპონენტი სვამს)
7. **⚑ ადრეული დასრულება** — ორივეს თანხმობით; ოპონენტი ხედავს banner-ს + "✓ ვეთანხმები" / "✕ უარი"
8. **decline-end-debate** — უარის შემთხვევაში endVotes reset + notification
9. **🔄 Auto-polling** — `_dbStartAutoRefresh()` ყოველ 12 წამში: phase/endVotes ცვლილებისას silent re-render
10. **⚖ ფრე (draw)** — AI judge-ი აცხადებს ფრეს, UI-ში ⚡ "ფ რ ე"
11. **AI prompt გაუმჯობესება** — სალიტერატურო ქართული, მიუმხრობლობის წესები, ≤2 პუნქტი → ფრე
12. **Verdict UI redesign** — `ლოგიკა` / `დაკითხვა` / `უპასუხო არგუმენტები (ნაკლები = უკეთ)` — ოქრო/წითელი bar-ები

---

## ⚔️ ᲓᲔᲑᲐᲢᲘᲡ სისტემა — კრიტიკული ინფო

### Firebase სტრუქტურა:
```
agora-debates/{threadId}: {
  threadId, authorUid, authorNickname,
  opponentUid, opponentNickname,
  phase: "pending"|"opening"|"cross-asking"|"cross-answering"|"final"|"verdict"|"cancelled",
  crossRound: 1 | 2,
  endVotes: { [uid]: true },           ← ადრეული დასრულების ხმები
  invitedAt, inviteDeadline,
  currentTurn, turnDeadline, startedAt, totalDeadline,
  opening: { 0:{uid,nickname,body,createdAt}, ... },
  cross:  { questions:{}, answers:{}, askerUid },   ← I რაუნდი
  cross2: { questions:{}, answers:{}, askerUid },   ← II რაუნდი
  final: { 0:{uid,nickname,body,createdAt}, ... },
  verdict: { result:"win"|"draw", analysis, winnerUid, winnerNickname, reason, scores, forfeitUid, createdAt }
}
```

### Debate ფლოუ:
```
pending → opening (5+5 სვლა)
        → cross-asking I  (ავტორი, crossRound=1)
        → cross-answering I (ოპონენტი პასუხობს)
        → cross-asking II (ოპონენტი, crossRound=2)
        → cross-answering II (ავტორი პასუხობს)
        → final (10+10 სვლა) ← ➕ ადრეული დასრულება შესაძლებელია
        → verdict (AI კრიტიკოსი: win | draw)
```

### Debate კონსტანტები:
- `INVITE_TIMEOUT_MS = 6h`, `TURN_TIMEOUT_MS = 6h`, `TOTAL_DEBATE_MS = 24h`
- `DEBATE_BAN_DAYS = 7`, `OPENING_TURNS_EACH = 5`, `FINAL_TURNS_EACH = 10`
- `CROSS_MIN_Q = 5`, `CROSS_MAX_Q = 20`

### კრიტიკული ლოგიკა:
- `isAsker/isAns = uid === debate.currentTurn` (არა hardcoded authorUid!)
- `crossKey = debate.crossRound === 2 ? 'cross2' : 'cross'`
- `submit-cross-questions`: `answererUid = opposite of user.uid`
- `submit-cross-answer`: round1 done → cross-asking II; round2 done → final
- `request-end-debate`: ორივე ხმა → `judgeDebate()`; ერთი ხმა → notification მეორეს
- `decline-end-debate`: `endVotes: {}` reset + notification
- `get-debate` response → `photoMap` ჩართულია (სერვერ-სიდე)

### Auto-refresh (`js/agora.js`):
- `_dbStartAutoRefresh(tid, phase)` — ყოველ 12 წამში polling
- phase ან endVotes ცვლილება → silent re-render
- verdict/cancelled → polling ჩერდება
- `_debateAutoRefreshId`, `_debateWatchPhase`, `_debateWatchTid` — global state

### Debate Submit ლოგიკა:
- `_dbSubmitTurn(tid, btn, quickType)` — 3 პარამეტრი
  - `'agree'` → `'გეთანხმები'` (emoji-free!)
  - `'no_answer'` → `'პასუხი არ მაქვს'` (emoji-free!)
  - `undefined` → textarea, მინ. 200 სიმბოლო
- `_dbTurnsHtml(turnsObj, authorUid, authorNick, oppNick, photoMap)` — 5 პარამეტრი
- `_dbRequestEnd(tid, btn)` → `action: 'request-end-debate'`
- `_dbDeclineEnd(tid, btn)` → `action: 'decline-end-debate'`

### Verdict UI:
- **`result: "win"`** → 🏆 გამარჯვებული
- **`result: "draw"`** → ⚡ ფ რ ე
- **Scores:** `ლოგიკა` (ოქრო bar), `დაკითხვა` (ოქრო bar), `უპასუხო არგუმენტები` (წითელი bar, ნაკლები = უკეთ)
- `ignored_points` ≤3 → ოქრო, ≤6 → ყვითელი, >6 → წითელი

### Debate UI IDs:
- `#typeBtnPublic`, `#typeBtnDebate`
- `#debateOpponentWrap`, `#debateOpponentInput`, `#debateOpponentStatus`, `#debateOpponentFound`
- `#dbAcceptBtn`, `#dbDeclineBtn`, `#dbCancelBtn`
- `#dbTurnInput`, `#dbSubmitTurnBtn`, `#dbTurnError`, `#dbTurnCounter`
- `#dbAgreeBtn`, `#dbNoAnswerBtn`
- `#dbCrossQList`, `#dbAddQBtn`, `#dbSubmitQBtn`, `#dbCrossError`
- `.db-ans-btn[data-idx][data-ans]`
- `#dbInviteTimer`, `#dbTurnTimer`, `#dbTotalTimer`
- `#dbEndDebateBtn`, `#dbEndDeclineBtn`

### CSS კლასები (debate):
- `db-players-bar`, `db-player-card`, `db-player-card-opp`, `db-player-info`
- `db-player-nick`, `db-player-count`, `db-player-dots`, `db-vs-label`
- `db-progress-line`, `db-progress-fill`
- `db-end-wrap`, `db-end-banner`, `db-end-banner-text`, `db-btn-end`
- `db-score-item`, `db-score-nick`, `db-score-row`, `db-score-label`, `db-score-val`

---

## Firebase Rules:
```json
{
  "rules": {
    "notes": { ".read": true, ".write": false },
    "users": { "$uid": { ".read": true, ".write": "auth != null && auth.uid == $uid" } },
    "admins": { ".read": true, ".write": false },
    "usernames": { ".read": true, ".write": false },
    "glossary": { ".read": true, ".write": "auth != null && auth.uid == 'bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2'" },
    "banned-fingerprints": { ".read": true, ".write": false },
    "banned-users": { ".read": false, ".write": false },
    "banned-ips": { ".read": true, ".write": false },
    "banned-emails": { ".read": true, ".write": false },
    "agora-threads":  { ".read": true, ".write": false },
    "agora-replies":  { ".read": true, ".write": false },
    "agora-warnings": { ".read": false, ".write": false },
    "agora-debates":  { ".read": true, ".write": false },
    "notifications": { "$uid": { ".read": false, ".write": false } }
  }
}
```

---

## Vercel Env Variables:
- `FIREBASE_SERVICE_ACCOUNT` — სრული JSON (**არასოდეს GitHub-ზე!** 🔴)
- `TOTP_SECRET`, `GEMINI_KEY_1`...`GEMINI_KEY_12`, `BREVO_KEY`

### Admin: UID `bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2`

---

## ⚠️ ᲙᲠᲘᲢᲘᲙᲣᲚᲘ ᲬᲔᲡᲔᲑᲘ შემდეგი assistant-ისთვის:

- **Glossary** `.write` — **არასოდეს წაშალო!**
- `BREVO_KEY` / `FIREBASE_SERVICE_ACCOUNT` — **არასოდეს GitHub-ზე!** 🔴
- `getAdminToken()` — **ნუ შეცვლი!**
- `#website_hp` — Honeypot, **ნუ წაშლი!**
- `onclick=""` — CSP ბლოკავს! **addEventListener გამოიყენე**
- Google Fonts — **self-hosted, ნუ შეეხები!**
- **Skeleton cards** — **არ გამოიყენო!** (CLS)
- AI მოდელი — **gemma-3-27b-it** — **არასოდეს შეცვალო!**
- **ლურჯი/მწვანე ფერები — კატეგორიულად აკრძალულია!**
- `containsEmoji()` — quick button-ების ტექსტი emoji-free უნდა იყოს!
- `isAsker/isAns` — ყოველთვის `uid === debate.currentTurn` (არა hardcoded!)
- `get-debate` response-ში `photoMap` ჩართულია — Firebase client-side read **არ გამოიყენო** debate-ში
- `_dbStartAutoRefresh` — verdict/cancelled phase-ზე ავტომატურად ჩერდება
- `verdict.result` — `"win"` ან `"draw"` (nullable `winnerUid` draw-ისთვის)

### Agora-სპეციფიური:
- `agoraGetValidToken()` — **async!** submit-ებში `await`
- `showToast(msg, type)` — success/error/info
- `showConfirmToast(msg, fn)` — confirm()-ის ნაცვლად
- `closeAgora()` — `document.body.style.overflow = ''` სავალდებულო!
- `_agoraQuotes = []` — array
- `agoraShowWarningToast(message, isBanned, quote)` — 3 პარამეტრი!
- `adminDisplayName` — admin nickname key
- `_agoraCurrentThread` — global, ყოველთვის განახლებული

### GitHub Uploader tabs:
- JS: `script.js`, `agora.js`, `extras.js`, `admin.js`
- CSS: `style.css`, `agora.css`, `admin.css`
- HTML: `index.html`, `admin.html`
- API: `agora.js`, `gemini.js`, `ban-user.js`, `review.js`, `send-code.js`, `reset-password.js`, `verify-totp.js`
- ROOT: `vercel.json`, `sitemap.xml`, `robots.txt`

---

## 🌐 URLs
- Frontend: https://philosoph.vercel.app
- GitHub: https://github.com/Phillosopheer/filosofia

---

## ⚠️ TODO (Session 56+):
1. **⚔ ტესტირება** — სრული დებატის ციკლი (ორი cross რაუნდი + ადრეული დასრულება + verdict transcript)
2. Forum — Admin pin/unpin thread
3. Forum — სტატისტიკა profile popup-ში
4. Firebase Storage — avatar (ამჟამად base64 DB-ში)
5. Meta URLs — canonical, og:url
6. robots.txt — sitemap URL ძველია
7. CSP — connect-src-ში filosofia-xi.vercel.app ჯერ კიდევ არის
8. Telegram Bot — მონიტორინგი
9. Domain → საკუთარი domain

---

## 📁 File Structure
```
/
├── api/
│   ├── agora.js        ← Session 55 განახლდა (moderateDebateTurn, delete notification, auto first turn)
│   ├── gemini.js, review.js, send-code.js, ban-user.js,
│   │   reset-password.js, verify-totp.js
├── css/
│   ├── agora.css       ← Session 53 განახლდა (score UI, end-banner, player-count)
│   ├── style.css, admin.css, fonts/
├── js/
│   ├── agora.js        ← Session 55 განახლდა (structured form only, timer labels, საპასუხო დრო)
│   ├── script.js, admin.js, extras.js, firebase-app-compat.js
├── index.html, admin.html
├── philosopher-bg.jpg/.webp
├── sitemap.xml, robots.txt, CNAME, vercel.json
```

---

## ⚙️ Tech Stack
- Frontend → Vercel | Database → Firebase Realtime DB
- AI → **gemma-3-27b-it** (არასოდეს შეცვალო!)
- Auth → Firebase Email/Password + TOTP
- Email → Brevo | VPN Detection → ip-api.com

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
- ZIP → `/mnt/user-data/uploads/` → unzip → read CONTEXT.md
- Modified files → `/mnt/user-data/outputs/` (js/ api/ css/ ქვეფოლდერებში)
- Syntax check: `node --check js/agora.js && node --check api/agora.js`
- **სესიის ბოლოს ყოველთვის შეახსენე კონტექსტის განახლება!** 🔔
