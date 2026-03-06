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
2. **ღილაკები** — არასოდეს browser-default! `-webkit-appearance:none` სავალდებულო მობაილზე. ყოველი ღილაკი სტილიზებული (gold border, dark background, hover effects).
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

## ✅ CURRENT STATE (March 6, 2026 — Session 52)

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
- ✅ **🔧 Glossary Firebase Rules — `.write` დაემატა (admin-only)** — Session 48
- ✅ **🖥️ Admin პანელი — ცალკე გვერდი (`admin.html`)** — Session 49
- ✅ **📱 Admin პანელი — მობილური hamburger nav** — Session 49
- ✅ **👥 Admin პანელი — მომხმარებლები სწორად იტვირთება** — Session 49
- ✅ **🚫 Header — usersBtn ამოღებულია** (ადმინ პანელში გადატანილი) — Session 49
- ✅ **⬆️ GitHub Uploader — სრული redesign + ყველა ფაილი** — Session 49
- ✅ **🖼️ სტატიების ფოტო — სრულად ჩანს ყველა მოწყობილობაზე** — Session 49
- ✅ **⚔️ 1vs1 დებატების სისტემა — Interactive Prototype დამტკიცდა** — Session 50
- ✅ **⚔️ api/agora.js — debate ლოგიკა სრულად** — Session 51
- ✅ **⚔️ js/agora.js — debate UI ინტეგრაცია** — Session 51
- ✅ **⚔️ index.html — ახალი thread modal (type selector + opponent)** — Session 51
- ✅ **⚔️ Debate UI — სრული redesign (CSS classes, ღილაკები, turn cards)** — Session 52
- ✅ **⚔️ Turn cards — ავატარი + სახელი + ტექსტი სწორად გაყოფილი** — Session 52
- ✅ **⚔️ Progress bar — dots (⬤/○) player cards vs-ით** — Session 52
- ✅ **⚔️ სვლა — მინ. 200 სიმბოლო + counter + quick buttons** — Session 52

---

## ✅ Session 52-ში გაკეთებული (სრული)

### ⚔ Debate UI — Redesign (`js/agora.js` + `css/agora.css`)

**`css/agora.css`** (+386 ხაზი — ახალი debate CSS section):
- `.db-btn`, `.db-btn-gold`, `.db-btn-danger` — `-webkit-appearance:none`, browser-default ღილაკები მობაილზე მოქმედია
- `.db-textarea`, `.db-q-input` — dark background, `-webkit-appearance:none`, focus ring
- `.db-turn-card`, `.db-turn-meta`, `.db-turn-nick`, `.db-turn-body` — turn card ავატარებით
- `.db-verdict-winner`, `.db-verdict-scores` — verdict ეკრანი
- `.db-waiting`, `.db-submit-wrap`, `.db-phase-hdr` — ყველა inline style → class

**`js/agora.js`:**
- Opponent search: `#4ade80` (მწვანე) → `#c9a84c` (gold) ✅
- Turn cards: `_dbTurnsHtml(turnsObj, authorUid, authorNick, oppNick, myUid, myPhoto)` — ახლა 6 პარამეტრი! ავატარი + სახელი + ტექსტი გაყოფილი
- Progress bar `_dbProgressBar` — player dots card (⬤/○) + vs + progress line
- Submit form — **quick buttons**: `#dbAgreeBtn` (✓ გეთანხმები) + `#dbNoAnswerBtn` (— პასუხი არ მაქვს) → confirm → პირდაპირ იგზავნება
- `_dbSubmitTurn(tid, btn, quickType)` — **3 პარამეტრი**, quickType: 'agree'|'no_answer'|undefined
- Character counter `#dbTurnCounter` — 0/200, ოქრო ხდება 200-ზე
- მინ. **200 სიმბოლო** (ადრე: 5)

---

## ✅ Session 51-ში გაკეთებული (სრული)

### ⚔ 1vs1 დებატების სისტემა — კოდირება

**`api/agora.js`** (1025 → 1600 ხაზი):
- **კონსტანტები:** `INVITE_TIMEOUT_MS` (6სთ), `TURN_TIMEOUT_MS` (6სთ), `TOTAL_DEBATE_MS` (24სთ), `DEBATE_BAN_DAYS` (7), `OPENING_TURNS_EACH` (5), `FINAL_TURNS_EACH` (10)
- **Helper functions:** `getDebateNickname`, `banForMissedTurn`, `judgeDebate` (Gemini 3 კრიტერიუმი), `checkDebateTimeouts` (lazy expiry)
- **Actions (9 ახალი):** `find-user`, `get-debate`, `create-debate`, `accept-debate`, `decline-debate`, `cancel-debate`, `submit-turn`, `submit-cross-questions`, `submit-cross-answer`

**`js/agora.js`** (1594 → 2153 ხაზი):
- State: `_newThreadType`, `_debateOpponentUid`, `_debateOpponentNick`, `_debateTimerIds`
- `agoraThreadCard` — debate badge-ები
- `agoraOpenThread` — debate thread → debate UI
- `agoraOpenNewThreadModal` — type selector (საჯარო/1vs1), opponent search (400ms debounce)
- Notifications — debate ტიპები
- Debate UI ფუნქციები სრულად

**`index.html`:**
- newThreadModal — type selector (`#typeBtnPublic`, `#typeBtnDebate`)
- `#debateOpponentWrap` — opponent search field

---

## ⚠️ ᲓᲔᲑᲐᲢᲘᲡ სისტემა — კრიტიკული ინფო (Session 51+)

### Firebase სტრუქტურა:
```
agora-debates/{threadId}: {
  threadId, authorUid, authorNickname,
  opponentUid, opponentNickname,
  phase: "pending"|"opening"|"cross-asking"|"cross-answering"|"final"|"verdict"|"cancelled",
  invitedAt, inviteDeadline,
  currentTurn, turnDeadline, startedAt, totalDeadline,
  opening: { 0:{uid,nickname,body,createdAt}, ... },
  cross: { questions:{}, answers:{}, askerUid },
  final: { 0:{uid,nickname,body,createdAt}, ... },
  verdict: { analysis, winnerUid, winnerNickname, reason, scores, forfeitUid, createdAt }
}
```

### Debate კონსტანტები (`api/agora.js`):
- `INVITE_TIMEOUT_MS = 6h` — გამოწვევა ვადაგასული → გაუქმება, ჯარიმა არ არის
- `TURN_TIMEOUT_MS = 6h` — სვლის ვადა → 7-დღიანი ბანი
- `TOTAL_DEBATE_MS = 24h` — სრული დებატის ვადა
- `DEBATE_BAN_DAYS = 7`
- `OPENING_TURNS_EACH = 5` (სულ 10)
- `FINAL_TURNS_EACH = 10` (სულ 20)
- `CROSS_MIN_Q = 5`, `CROSS_MAX_Q = 20`

### Debate UI IDs (`js/agora.js`):
- `#typeBtnPublic`, `#typeBtnDebate` — modal type selector
- `#debateOpponentWrap`, `#debateOpponentInput`, `#debateOpponentStatus`, `#debateOpponentFound`
- `#dbAcceptBtn`, `#dbDeclineBtn`, `#dbCancelBtn` — invite/pending screens
- `#dbTurnInput`, `#dbSubmitTurnBtn`, `#dbTurnError`, `#dbTurnCounter` — turn submit
- `#dbAgreeBtn`, `#dbNoAnswerBtn` — quick turn buttons (Session 52)
- `#dbCrossQList`, `#dbAddQBtn`, `#dbSubmitQBtn`, `#dbCrossError` — cross questions
- `.db-ans-btn[data-idx][data-ans]` — cross answers
- `#dbInviteTimer`, `#dbTurnTimer`, `#dbTotalTimer` — countdown timers

### Debate Submit ლოგიკა (Session 52):
- `_dbSubmitTurn(tid, btn, quickType)` — **3 პარამეტრი!**
  - `quickType='agree'` → body = '✓ გეთანხმები', 200 სიმბ. არ სჭირდება
  - `quickType='no_answer'` → body = '— პასუხი არ მაქვს', 200 სიმბ. არ სჭირდება
  - `quickType=undefined` → textarea, **მინ. 200 სიმბოლო**
- `_dbTurnsHtml(turnsObj, authorUid, authorNick, oppNick, myUid, myPhoto)` — **6 პარამეტრი!**

---

## ✅ Session 50-ში გაკეთებული (სრული)

### ⚔ 1vs1 დებატების სისტემა — Interactive Prototype
- **Prototype ფაილი:** `debate-prototype-v2.html` — 8 ეკრანი, სრულად ინტერაქტიური
- **დამტკიცებული სახელები:** Opening→საწყისი, Cross→დაკითხვა, Final→საბოლოო პაექრობა, AI Referee→AI კრიტიკოსი
- **დამტკიცებული ლოგიკა:** გამოწვევა 6სთ→გაუქმება (ჯარიმა არ არის), სვლა 6სთ→7-დღიანი ბანი

---

## ✅ Session 49-ში გაკეთებული (სრული)

### 🖥️ Admin პანელი (`admin.html` + `js/admin.js` + `css/admin.css`):
- ცალკე გვერდი — `admin.html` root-ში
- **მობილური nav:** hamburger ღილაკი (☰) → slide-in sidebar + overlay + X ანიმაცია
- **მომხმარებლები:** `loadUsers()` → `ban-user.js` API (`action: "list"`) გამოიყენება Firebase Rules-ის გვერდის ავლით (Service Account)
- **CSP fix:** ყველა `onclick=""` inline → `addEventListener` + event delegation
- **XSS:** `escHtml()` ფუნქცია — ყველა user input escape-ირდება

### 🚫 Header — usersBtn ამოღება
### ⬆️ GitHub Uploader — redesign (ოქროს კუთხეები, shimmer progress bar)
### 🖼️ სტატიების ფოტო fix (`max-height:none!important; object-fit:unset!important;`)

---

## Firebase Rules (სრული):
```json
{
  "rules": {
    "notes": { ".read": true, ".write": false },
    "users": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "admins": { ".read": true, ".write": false },
    "usernames": { ".read": true, ".write": false },
    "glossary": {
      ".read": true,
      ".write": "auth != null && auth.uid == 'bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2'"
    },
    "banned-fingerprints": { ".read": true, ".write": false },
    "banned-users": { ".read": false, ".write": false },
    "banned-ips": { ".read": true, ".write": false },
    "banned-emails": { ".read": true, ".write": false },
    "agora-threads":  { ".read": true, ".write": false },
    "agora-replies":  { ".read": true, ".write": false },
    "agora-warnings": { ".read": false, ".write": false },
    "agora-debates":  { ".read": true, ".write": false },
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

### Admin:
- UID: `bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2`
- `/admins/bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2: true`

---

## ⚠️ ᲨᲔᲛᲓᲔᲒ ASSISTANT — ᲙᲠᲘᲢᲘᲙᲣᲚᲘ ᲬᲔᲡᲔᲑᲘ:

### ფაილები:
- **Glossary** — ნოდარი ტერმინებს **საიტის შიგნიდან ამატებს** (admin პანელი). Firebase Rules-ში `glossary`-ს **აუცილებლად უნდა ჰქონდეს** `.write`: `"auth != null && auth.uid == 'bOZ9pQ95e6RwQ6ZD6p5MUzzEvld2'"` — **არასოდეს წაშალო!**
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

### Admin პანელი (`admin.html`):
- **ცალკე გვერდია** — `admin.html` root-ში, `js/admin.js`, `css/admin.css`
- **მობილური nav:** `#admHamburger` → `#admNav.open` + `#admNavOverlay.show` + `body.nav-open`
- **მომხმარებლები:** `loadUsers()` → `/api/ban-user` (`action:"list"`) — **არასოდეს პირდაპირ Firebase `/users`-ზე!** (Rules კრძალავს)
- **CSP:** ყველა ღილაკი event delegation-ით, `escHtml()` — XSS protection
- `banUserByUid()` — **script.js-ში დარჩა** (pending panel-ს სჭირდება)

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
- **`_agoraQuotes = []`** — array! (არა `_agoraQuote` single)
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

### Debate-სპეციფიური (Session 51+):
- `_newThreadType` — 'public' ან 'debate' (global state)
- `_debateOpponentUid`, `_debateOpponentNick` — modal-ში ინახება
- `_debateTimerIds` — countdown timer IDs (clearInterval-ისთვის)
- `agoraRenderDebateView(thread, debate, container)` — მთავარი debate UI router
- `_dbClearTimers()` — thread switch-ზე გამოიძახება
- Debate phases: `pending → opening → cross-asking → cross-answering → final → verdict`
- `find-user` action — auth სჭირდება, nickname → {uid, nickname, photoURL}
- `agora-debates/{threadId}` — Firebase-ში ინახება (`.read:true, .write:false`)
- **`_dbSubmitTurn(tid, btn, quickType)`** — 3 პარამეტრი! quickType: 'agree'|'no_answer'|undefined
- **`_dbTurnsHtml(..., myUid, myPhoto)`** — 6 პარამეტრი!
- მინ. სვლის სიგრძე: **200 სიმბოლო** (quick buttons-ს არ სჭირდება)

### GitHub Uploader:
- `#uploaderModal` — `index.html`-ში, `js/script.js`-ში ლოგიკა
- Tabs: JS / CSS / HTML / API / ROOT / ＋
- JS tab: `script.js`, `agora.js`, `extras.js`, `admin.js`
- CSS tab: `style.css`, `agora.css`, `admin.css`
- HTML tab: `index.html`, `admin.html`
- API tab: `agora.js`, `gemini.js`, `ban-user.js`, `review.js`, `send-code.js`, `reset-password.js`, `verify-totp.js`
- ROOT tab: `vercel.json`, `sitemap.xml`, `robots.txt`
- **👁 eye ღილაკი:** `#upTokenEye` — token ჩვენება/დამალვა (`js/script.js`-ში)
- Styled checkbox: `#upSaveCb`, `#upSaveTick`, `#upRememberLabel`

### დიზაინი:
- gold `#c9a84c`, bg `#0e0c0a`, surface `#161310`
- **ლურჯი/ცივი ფერები — კატეგორიულად აკრძალულია!**
- ღილაკები — ყოველთვის სტილიზებული, `-webkit-appearance:none` სავალდებულო მობაილზე
- მობაილი — `position: fixed`, `left/right: 8px`

---

## 🌐 URLs
- Frontend: https://philosoph.vercel.app
- GitHub: https://github.com/Phillosopheer/filosofia

---

## ⚠️ TODO (Session 53+):
1. **⚔ ტესტირება** — დებატის სრული ციკლი ლაივზე
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
│   ├── gemini.js
│   ├── review.js
│   ├── send-code.js
│   ├── ban-user.js
│   ├── reset-password.js
│   ├── agora.js              ← Session 51-ში განახლდა (+debate ლოგიკა)
│   └── verify-totp.js
├── css/
│   ├── style.css
│   ├── agora.css             ← Session 52-ში განახლდა (+debate CSS classes)
│   ├── admin.css
│   └── fonts/
├── js/
│   ├── script.js
│   ├── agora.js              ← Session 52-ში განახლდა (+debate UI redesign)
│   ├── admin.js
│   ├── extras.js
│   └── firebase-app-compat.js
├── index.html                ← Session 51-ში განახლდა (modal type selector)
├── admin.html
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
- Syntax check: `node --input-type=module < api/agora.js && node --check js/agora.js`
- `present_files` tool for sharing
- **ფაილების სახელები** — იხილე "AGORA ფაილების სახელები" სექცია!
- **დიზაინი** — იხილე "ᲓᲘᲖᲐᲘᲜᲘᲡ ᲛᲙᲐᲪᲠᲘ ᲬᲔᲡᲔᲑᲘ" სექცია!
- **სესიის ბოლოს ყოველთვის შეახსენე კონტექსტის განახლება!** 🔔
