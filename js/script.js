
// ===== TOTP შემოწმება =====
async function doTotpVerify() {
  const token = (document.getElementById('totpInput').value || '').replace(/\s/g, '');
  const errEl = document.getElementById('totpError');
  const btn = document.getElementById('totpBtn');
  errEl.innerText = '';
  if (token.length !== 6) { errEl.innerText = '6 ციფრი შეიყვანე!'; return; }
  btn.disabled = true;
  btn.innerText = 'შემოწმება...';
  try {
    const res = await fetch('/api/verify-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (data.ok) {
      const d = window._pendingAuthData;
      idToken    = d.idToken;
      currentUid = d.localId;
      localStorage.setItem('idToken', d.idToken);
      localStorage.setItem('refreshToken', d.refreshToken || '');
      localStorage.setItem('currentUid', d.localId);
      localStorage.setItem('userEmail', d.email);
      localStorage.setItem('sessionTimestamp', Date.now().toString());
      const badge = document.getElementById('userBadge');
      badge.innerText = d.email.split('@')[0];
      badge.style.display = 'inline-block';
      document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>';
      document.getElementById('logoutBtn').classList.add('active');
      document.body.classList.add('admin-mode');
      closeModal('totpModal');
      updateFab();
      updateHeaderButtons();
      fetchPendingNotes();
      window._pendingAuthData = null;
    } else {
      errEl.innerText = '❌ კოდი არასწორია! სცადე თავიდან.';
    }
  } catch(e) {
    errEl.innerText = '📡 კავშირის შეცდომა, სცადე თავიდან.';
  } finally {
    btn.disabled = false;
    btn.innerText = 'დადასტურება';
  }
}
const firebaseConfig = {
apiKey: "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao",
authDomain: "gen-lang-client-0339684222.firebaseapp.com",
databaseURL: "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com",
projectId: "gen-lang-client-0339684222",
storageBucket: "gen-lang-client-0339684222.firebasestorage.app",
messagingSenderId: "636166502416",
appId: "1:636166502416:web:78841eec3ba4c658a07295"
};
if (!firebase.apps.length) {
firebase.initializeApp(firebaseConfig);
}
// Firebase App Check (reCAPTCHA v3) — monitoring mode
firebase.appCheck().activate('6LdepXIsAAAAAGPzEX8XfPPh1mMSeT8ZUod1Z5CC', true);
const FIREBASE_DB   = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
// Firebase REST API wrapper — adds App Check token to every Firebase DB request
async function fbFetch(url, options = {}) {
  try {
    const tokenPromise = firebase.appCheck().getToken();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000));
    const { token } = await Promise.race([tokenPromise, timeoutPromise]);
    options.headers = Object.assign({}, options.headers, { 'X-Firebase-AppCheck': token });
  } catch (e) { /* monitoring mode — continue without token */ }
  return fetch(url, options);
}
const FIREBASE_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts";
const API_KEY       = "AIzaSyCcTPhEU478qqwbI9KqJ4iOOFBHox-J7Ao";
let idToken    = null;
let currentUid = null;
let notes      = [];
let currentCat = null;
let currentNote = null;
let allGlossaryTerms = [];
let currentGlossaryTerm = null;
let botLastQuestion = '';
let botSameCount = 0;
const categories = [
{
id: 'epist',
name: 'ეპისტემოლოგია',
desc: 'ფილოსოფიის დარგი, რომელიც შეისწავლის ცოდნის ბუნებას, მის წარმოშობას, სტრუქტურასა და საზღვრებს.'
},
{
id: 'ethics',
name: 'ეთიკა',
desc: 'ფილოსოფიური დისციპლინა, რომელიც იკვლევს მორალს, ზნეობრივ ღირებულებებს, ქცევის ნორმებსა და ცნებებს სიკეთისა და ბოროტების შესახებ.'
},
{
id: 'logic',
name: 'ლოგიკა',
desc: 'მეცნიერება სწორი აზროვნების კანონების, მსჯელობის ფორმებისა და მტკიცებულების მეთოდების შესახებ.'
},
{
id: 'meta',
name: 'მეტაფიზიკა',
desc: 'ფილოსოფიის დარგი, რომელიც იკვლევს რეალობის ფუნდამენტურ ბუნებას, არსებობის პირველსაწყისებსა და სამყაროს მოწყობის ზოგად პრინციპებს.'
},
{
id: 'lang',
name: 'ენის ფილოსოფია',
desc: 'ფილოსოფიური მიმართულება, რომელიც შეისწავლის ენის ბუნებას, მნიშვნელობას, ენის გამოყენებასა და მის კავშირს რეალობასთან.'
},
{
id: 'anthro',
name: 'ანთროპოლოგიური ფილოსოფია',
desc: 'ფილოსოფიის დარგი, რომლის კვლევის მთავარი საგანია ადამიანი, მისი არსი, ადგილი სამყაროში და დანიშნულება.'
},
{
id: 'aesthetics',
name: 'ესთეტიკა',
desc: 'ფილოსოფიური მოძღვრება მშვენიერების, ხელოვნების ბუნებისა და ესთეტიკური აღქმის შესახებ.'
},
{
id: 'exist',
name: 'ეგზისტენციალიზმი',
desc: 'ფილოსოფიური მიმდინარეობა, რომელიც ცენტრალურ ადგილს ანიჭებს ადამიანის ინდივიდუალურ არსებობას, თავისუფლებას, არჩევანსა და პირად პასუხისმგებლობას.'
},
{
id: 'onto',
name: 'ონტოლოგია',
desc: 'მეტაფიზიკის ნაწილი, რომელიც შეისწავლის ყოფიერებას, არსებობასა და რეალობის ძირითად კატეგორიებს.'
},
{
id: 'axio',
name: 'ობიექტური აქსიოლოგია',
desc: 'ღირებულებათა თეორია, რომელიც ფასეულობებს (სიკეთე, სილამაზე, ჭეშმარიტება) განიხილავს როგორც ობიექტურ, ადამიანის სუბიექტური აზრისგან დამოუკიდებელ მოცემულობას.'
},
{
id: 'histphil',
name: 'ფილოსოფიის ისტორია',
desc: 'დისციპლინა, რომელიც შეისწავლის ფილოსოფიური იდეების, სკოლებისა და კონცეფციების განვითარებას დროის ქრონოლოგიურ ჭრილში.'
},
{
id: 'relphil',
name: 'რელიგიის ფილოსოფია',
desc: 'ფილოსოფიური კვლევა, რომელიც რაციონალური მეთოდებით განიხილავს რელიგიის არსს, ღმერთის არსებობის საკითხებსა და რელიგიურ გამოცდილებას.'
},
{
id: 'feminist',
name: 'ფემინისტური ფილოსოფია',
desc: 'ფილოსოფიური მიმართულება, რომელიც სწავლობს გენდერს, ძალაუფლებას და სოციალურ სამართლიანობას; კრიტიკულად განიხილავს პატრიარქალურ სტრუქტურებს და იცავს გენდერულ თანასწორობას ეთიკის, პოლიტიკის და ეპისტემოლოგიის ჭრილში.'
}
];
const philosopherQuotes = [
{ text: "რაც ჩვენ არ გვკლავს, ის გვაძლიერებს.", author: "ფრიდრიხ ნიცშე" },
{ text: "ურჩხულებთან მებრძოლს მართებს ფიქრი იმაზე, რომ თავად არ იქცეს ურჩხულად.", author: "ფრიდრიხ ნიცშე" },
{ text: "როდესაც იყურები უფსკრულში უნდა იცოდე, რომ უფსკრულიც შემოგყურებს შენ.", author: "ფრიდრიხ ნიცშე" },
{ text: "არ არსებობს ფაქტები, აქ მხოლოდ ინტერპრეტაციებია.", author: "ფრიდრიხ ნიცშე" },
{ text: "რაც უფრო მაღლა ავფრინდებით ხოლმე, მით უფრო პატარები ვჩანვართ მათთვის, ვისაც ფრენა არ შეუძლიათ.", author: "ფრიდრიხ ნიცშე" },
{ text: "უბოროტესი მტერი, რომელსაც გადაეყრები, თავად შენ ხარ.", author: "ფრიდრიხ ნიცშე" },
{ text: "სულში ქაოსის შექმნა გჭირდება, რომ დაბადო ახალი მოკაშკაშე ვარსკვლავი.", author: "ფრიდრიხ ნიცშე" },
{ text: "სიყვარულში ყოველთვის არსებობს სიგიჟე, მაგრამ ასევე არსებობს ამ სიგიჟის მიზეზებიც.", author: "ფრიდრიხ ნიცშე" },
{ text: "მე ვირწმუნებდი ისეთ ღმერთს, რომელსაც ცეკვა ძალუძს.", author: "ფრიდრიხ ნიცშე" },
{ text: "სჯობს რეგვენი იყო და შენი აზრები გქონდეს, ვიდრე ბრძენი სხვისი აზრებით.", author: "ფრიდრიხ ნიცშე" },
{ text: "მუსიკის გარეშე ცხოვრება ერთი დიდი შეცდომა იქნებოდა.", author: "ფრიდრიხ ნიცშე" },
{ text: "ღმერთი მოკვდა.", author: "ფრიდრიხ ნიცშე" },
{ text: "ცხოვრება ტანჯვაა. გადარჩენის გზა კი მდგომარეობა იმაში, რომ ვიპოვოთ აზრი ამ ტანჯვაში.", author: "ფრიდრიხ ნიცშე" },
{ text: "მე ამბიციური ვარ. მსურს, რომ ათი წინადადებით ვთქვა ის, რასაც სხვები მთელი წიგნით ამბობენ.", author: "ფრიდრიხ ნიცშე" },
{ text: "მძლავრი გონებები იდეებს განიხილავენ, საშუალოები მოვლენებს, სუსტი გონებები კი ადამიანებს.", author: "სოკრატე" },
{ text: "ცვლილების საიდუმლო ენერგიის ფოკუსირებაშია, არა ძველთან ბრძოლისთვის, არამედ ახლის შენებისათვის.", author: "სოკრატე" },
{ text: "იყო კეთილი ყველასთან, ვისაც ხვდები, რთულ ბრძოლაში ყოფნას გავს.", author: "სოკრატე" },
{ text: "მადლიერება ბუნებრივი სიმდიდრეა, ქონებრივი სიმდიდრე ხელოვნური სიღარიბე.", author: "სოკრატე" },
{ text: "არც ათენელი ვარ და არც ბერძენი, მე მსოფლიოს მოქალაქე ვარ.", author: "სოკრატე" },
{ text: "კარგ ცოლს თუ მოიყვან, ბედნიერი იქნები. ცუდ ცოლს თუ მოიყვან, ფილოსოფოსი.", author: "სოკრატე" },
{ text: "ვერავის ვერაფერს ვასწავლი, უბრალოდ მათ ჩავაფიქრებ.", author: "სოკრატე" },
{ text: "ვინც იმით არ არის კმაყოფილი, რაც აქვს, არც იმით იქნება კმაყოფილი რაც უნდა, რომ ჰქონდეს.", author: "სოკრატე" },
{ text: "მხოლოდ ერთი კარგი არსებობს, ცოდნა და მხოლოდ ერთი ცუდი, უმეცრება.", author: "სოკრატე" },
{ text: "ვისაც მსოფლიოს დაძვრა უნდა, ჯერ საკუთარი თავი დაძრას.", author: "სოკრატე" },
{ text: "გონება ყველაფერია. რასაც ფიქრობ, ის ხდები.", author: "სოკრატე" },
{ text: "ვიცი რომ ინტელიგენტი ვარ, რადგან ვიცი რომ არაფერი არ ვიცი.", author: "სოკრატე" },
{ text: "საკუთარი თავი რომ აღმოაჩინო, იფიქრე მისთვის.", author: "სოკრატე" },
{ text: "იცოდე შენი თავი.", author: "სოკრატე" },
{ text: "კითხვის გაგება უკვე პასუხის ნახევარია.", author: "სოკრატე" },
{ text: "ადამიანი ლერწამია, უმწეო ლერწამი, მაგრამ ეს ლერწამი აზროვნებს. მთელი ჩვენი ღირსება აზროვნებაა.", author: "ბლეზ პასკალი" },
{ text: "ადამიანი არის ყველაფერი არარაობასთან შედარებით და არარაობა უსასრულობასთან შედარებით.", author: "ბლეზ პასკალი" },
{ text: "ფილოსოფია ერთადერთი რამაა ისეთი, რითაც ველურებისა და ბარბაროსებისგან განვსხვავდებით.", author: "რენე დეკარტი" },
{ text: "ფილოსოფოსობის სიძნელე იმაშია, რომ ადამიანი დარჩე და ადამიანის მირმურს სწვდე.", author: "შალვა ნუცუბიძე" },
{ text: "ახალგაზრდობაში ნურვინ დააყოვნებს ფილოსოფოსობას, მოხუცობის ჟამს ნურვინ მოიღლება ფილოსოფოსობაში.", author: "ეპიკურე" },
{ text: "ადამიანად ყოფნა ნიშნავს იყო ადამიანი იმაზე მეტი ვიდრე ადამიანია.", author: "აბრამ ჰეშელი" },
{ text: "ფილოსოფიამ გვასწავლა ჩვენ ადამიანების სიყვარული.", author: "სენეკა" },
{ text: "ზერელედ მიწოდებული ფილოსოფია გვაშორებს რელიგიას, სიღრმისეული ფილოსოფია კი გვაბრუნებს მის წიაღში.", author: "ფრენსის ბეკონი" },
{ text: "სიბრძნე ამა სოფლისაი სიცოფე არს წინაშე ღვთისა.", author: "პავლე მოციქული" },
{ text: "ადამიანი არის ხიდი და არა მიზანი... ადამიანი არის რაღაც, რაც უნდა გადაილახოს.", author: "ფრიდრიხ ნიცშე" },
];
function displayRandomQuote() {
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const randomIndex = Math.floor(Math.random() * philosopherQuotes.length);
const quote = philosopherQuotes[randomIndex];
quoteText.innerHTML = `"${quote.text}"`;
if (quoteAuthor) quoteAuthor.innerText = `— ${quote.author}`;
}
function waveFadeText(element, text) {
const lines = text.split('|');
element.innerHTML = lines.join('<br>');
element.classList.add('wave-anim');
}
let pendingNotes = [];
function openPublicSubmission() {
document.getElementById('submissionTitle').value = '';
document.getElementById('submissionAuthor').value = '';
document.getElementById('submissionCat').value = 'epist';
document.getElementById('submissionArea').innerHTML = '';
showMsg(document.getElementById('submissionError'), '', false);
showMsg(document.getElementById('submissionSuccess'), '', false);
openModal('publicSubmissionModal');
}
function fmtS(cmd, value = null) {
document.getElementById('submissionArea').focus();
document.execCommand(cmd, false, value);
}
function formatHeadingS(tag) {
document.getElementById('submissionArea').focus();
document.execCommand('formatBlock', false, tag);
}
function insertBlockquoteS() {
const editor = document.getElementById('submissionArea');
editor.focus();
const selection = window.getSelection();
if (selection.rangeCount > 0) {
const range = selection.getRangeAt(0);
const selectedText = range.toString();
if (selectedText) {
document.execCommand('formatBlock', false, 'blockquote');
}
}
}
async function submitArticle() {
const title   = document.getElementById('submissionTitle').value.trim();
const author  = document.getElementById('submissionAuthor').value.trim();
const cat     = document.getElementById('submissionCat').value;
const content = document.getElementById('submissionArea').innerHTML.trim();
const errEl   = document.getElementById('submissionError');
const sucEl   = document.getElementById('submissionSuccess');
const btn     = document.getElementById('submitArticleBtn');
showMsg(errEl, '', false);
showMsg(sucEl, '', false);
if (!title)   { showMsg(errEl, 'სათაური სავალდებულოა', true); return; }
if (!content || content === '<br>') { showMsg(errEl, 'შინაარსი სავალდებულოა', true); return; }
btn.disabled  = true;

// ===== AI შემოწმება =====
btn.innerText = 'სტატია მოწმდება...';
try {
  const reviewRes = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  const reviewData = await reviewRes.json();
  if (!reviewData.valid) {
    showMsg(errEl, '⚠️ AI-ის შენიშვნა: ' + reviewData.message, true);
    btn.disabled  = false;
    btn.innerText = 'გაგზავნა';
    return;
  }
} catch {
  // თუ review API მიუწვდომელია — გავაგრძელოთ
}

// ===== Firebase-ში გაგზავნა =====
btn.innerText = 'იგზავნება...';
try {
const submission = {
title,
cat,
content,
pending: true,
submittedDate: Date.now()
};
if (author) submission.author = author;
const res = await fbFetch(`${FIREBASE_DB}/pending-notes.json`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(submission)
});
if (!res.ok) throw new Error('გაგზავნა ვერ მოხერხდა');
showMsg(sucEl, '✓ სტატია AI-მა გადაამოწმა და ადმინისტრატორს გაეგზავნა!', true);
document.getElementById('submissionTitle').value = '';
document.getElementById('submissionAuthor').value = '';
document.getElementById('submissionArea').innerHTML = '';
setTimeout(() => {
closeModal('publicSubmissionModal');
showMsg(sucEl, '', false);
}, 2500);
} catch (err) {
showMsg(errEl, 'შეცდომა: ' + err.message, true);
} finally {
btn.disabled  = false;
btn.innerText = 'გაგზავნა';
}
}
async function fetchPendingNotes() {
if (!idToken) {
console.log('fetchPendingNotes: No idToken, skipping');
return;
}
try {
console.log('Fetching pending notes...');
const res = await fbFetch(`${FIREBASE_DB}/pending-notes.json?auth=${idToken}`);
if (!res.ok) {
console.error('Fetch pending notes failed:', res.status);
return;
}
const data = await res.json();
console.log('Pending notes data:', data);
pendingNotes = data
? Object.entries(data).map(([k, v]) => ({ ...v, fbId: k }))
: [];
console.log('Pending notes array:', pendingNotes);
const badge = document.getElementById('pendingBadge');
if (pendingNotes.length > 0) {
badge.innerText = pendingNotes.length;
badge.style.display = 'block';
} else {
badge.style.display = 'none';
}
} catch (err) {
console.error('Pending notes fetch error:', err);
}
}
async function openPendingPanel() {
if (!idToken) return;
console.log('Opening pending panel, fetching latest data...');
const list = document.getElementById('pendingList');
list.innerHTML = '<div class="spinner"></div>';
await fetchPendingNotes();
list.innerHTML = '';
if (pendingNotes.length === 0) {
list.innerHTML = '<div class="empty-state"><div class="icon">✓</div><p>მოლოდინში სტატიები არ არის</p></div>';
} else {
pendingNotes
.sort((a, b) => (b.submittedDate || 0) - (a.submittedDate || 0))
.forEach(note => {
const card = document.createElement('div');
card.style.cssText = `
background: var(--surface2);
border: 1px solid var(--border);
border-radius: 12px;
padding: 20px;
margin-bottom: 15px;
`;
const dateStr = note.submittedDate
? new Date(note.submittedDate).toLocaleDateString('ka-GE', { year:'numeric', month:'long', day:'numeric' })
: '—';
const catLabel = getCategoryLabel(note.cat);
const excerpt = getExcerpt(note.content);
card.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
<div>
<p style="color:var(--accent); font-size:0.7rem; font-weight:600; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">${catLabel}</p>
<h4 style="font-family:'Cormorant Garamond', serif; font-size:1.4rem; font-weight:600; color:var(--text); margin-bottom:6px;">${escapeHtml(note.title)}</h4>
${note.author ? `<p style="color:var(--accent); font-size:0.8rem; font-weight:600; margin-bottom:8px;">✍️ ${escapeHtml(note.author)}</p>` : ''}
<p style="color:var(--text-dim); font-size:0.75rem;">${dateStr}</p>
</div>
</div>
<p style="color:var(--text-dim); font-size:0.9rem; line-height:1.6; margin-bottom:15px;">${excerpt}</p>
<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
<button class="pnote-preview" style="display:flex;align-items:center;gap:6px;padding:9px 15px;background:rgba(180,145,60,0.08);border:1px solid rgba(180,145,60,0.3);border-radius:8px;color:var(--accent);cursor:pointer;font-size:0.82rem;font-family:inherit;letter-spacing:0.5px;transition:all 0.2s;">👁 ნახვა</button>
<button class="pnote-edit" style="display:flex;align-items:center;gap:6px;padding:9px 15px;background:rgba(180,145,60,0.08);border:1px solid rgba(180,145,60,0.3);border-radius:8px;color:var(--accent);cursor:pointer;font-size:0.82rem;font-family:inherit;letter-spacing:0.5px;transition:all 0.2s;">✏️ რედაქტირება</button>
<button class="pnote-approve" style="display:flex;align-items:center;gap:6px;padding:9px 15px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.35);border-radius:8px;color:#4ade80;cursor:pointer;font-size:0.82rem;font-family:inherit;font-weight:600;letter-spacing:0.5px;transition:all 0.2s;">✅ დადასტურება</button>
<button class="pnote-reject" style="display:flex;align-items:center;gap:6px;padding:9px 15px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.35);border-radius:8px;color:#f87171;cursor:pointer;font-size:0.82rem;font-family:inherit;letter-spacing:0.5px;transition:all 0.2s;">❌ უარყოფა</button>
</div>
`;
card.querySelector('.pnote-preview').addEventListener('click', () => previewPendingNote(note.fbId));
card.querySelector('.pnote-edit').addEventListener('click', () => editPendingNote(note.fbId));
const approveBtn = card.querySelector('.pnote-approve');
approveBtn.addEventListener('click', () => confirmPendingAction('approve', note.fbId, approveBtn));
const rejectBtn = card.querySelector('.pnote-reject');
rejectBtn.addEventListener('click', () => confirmPendingAction('reject', note.fbId, rejectBtn));
list.appendChild(card);
});
}
openModal('pendingModal');
}
function previewPendingNote(noteId) {
const note = pendingNotes.find(n => n.fbId === noteId);
if (!note) return;
closeModal('pendingModal');
const previewNote = {
...note,
date: note.submittedDate || note.date || Date.now()
};
openReader(previewNote);
}
function editPendingNote(noteId) {
const note = pendingNotes.find(n => n.fbId === noteId);
if (!note) return;
currentNote = { ...note, pending: true };
openEditModal();
closeModal('pendingModal');
}
// JWT exp-ის გაშიფვრა — token-ი ვადაგასულია?
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    // 5 წუთის ბუფერი
    return (payload.exp * 1000) < (Date.now() + 5 * 60 * 1000);
  } catch { return true; }
}
// idToken განახლება refreshToken-ით
async function refreshIdToken() {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) throw new Error('სესია ამოიწურა. გთხოვთ ხელახლა შეხვიდეთ.');
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(rt)}`
  });
  const data = await res.json();
  if (!res.ok || !data.id_token) throw new Error('სესიის განახლება ვერ მოხერხდა. გთხოვთ ხელახლა შეხვიდეთ.');
  idToken = data.id_token;
  localStorage.setItem('idToken', data.id_token);
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
  console.log('✅ idToken განახლდა');
  return idToken;
}
// ვალიდური (არ-ვადაგასული) token-ის მიღება
async function getValidIdToken() {
  if (!idToken) {
    const saved = localStorage.getItem('idToken');
    if (saved) idToken = saved;
    else throw new Error('სესია ამოიწურა. გთხოვთ ხელახლა შეხვიდეთ.');
  }
  if (isTokenExpired(idToken)) {
    console.log('⚠️ idToken ვადაგასულია — განახლება...');
    return await refreshIdToken();
  }
  return idToken;
}
function confirmPendingAction(action, noteId, btn) {
if (action === 'approve') {
  approvePendingNote(noteId, btn);
} else {
  rejectPendingNote(noteId, btn);
}
}

async function approvePendingNote(noteId, btn) {
if (btn) { btn.disabled = true; btn.innerText = '⏳...'; }
try {
const token = await getValidIdToken();
const note = pendingNotes.find(n => n.fbId === noteId);
if (!note) throw new Error('სტატია არ მოიძებნა');
const approved = { ...note };
delete approved.pending;
delete approved.submittedDate;
delete approved.fbId;
approved.date = Date.now();
const addRes = await fbFetch(`${FIREBASE_DB}/notes.json?auth=${token}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(approved)
});
if (!addRes.ok) {
  const errData = await addRes.json().catch(() => ({}));
  throw new Error('დადასტურება ვერ მოხერხდა: ' + (errData?.error || addRes.status));
}
const delRes = await fbFetch(`${FIREBASE_DB}/pending-notes/${noteId}.json?auth=${token}`, {
method: 'DELETE'
});
if (!delRes.ok) throw new Error('წაშლა pending-დან ვერ მოხერხდა');
await fetchPendingNotes();
await fetchNotes();
openPendingPanel();
} catch (err) {
console.error('approvePendingNote error:', err);
alert('შეცდომა: ' + err.message);
if (btn) { btn.disabled = false; btn.innerText = '✅ დადასტურება'; }
}
}
async function rejectPendingNote(noteId, btn) {
if (btn) { btn.disabled = true; btn.innerText = '⏳...'; }
try {
const token = await getValidIdToken();
const res = await fbFetch(`${FIREBASE_DB}/pending-notes/${noteId}.json?auth=${token}`, {
method: 'DELETE'
});
if (!res.ok) throw new Error('წაშლა ვერ მოხერხდა: ' + res.status);
await fetchPendingNotes();
openPendingPanel();
} catch (err) {
console.error('rejectPendingNote error:', err);
alert('შეცდომა: ' + err.message);
if (btn) { btn.disabled = false; btn.innerText = '❌ უარყოფა'; }
}
}
function init() {
const addBtn = document.getElementById('glossaryAddBtn');
if (addBtn) addBtn.style.display = 'none';
const savedToken = localStorage.getItem('idToken');
const savedUid = localStorage.getItem('currentUid');
const savedEmail = localStorage.getItem('userEmail');
const sessionTimestamp = parseInt(localStorage.getItem('sessionTimestamp') || '0');
if (savedToken && savedUid && sessionTimestamp) {
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const sessionAge = Date.now() - sessionTimestamp;
if (sessionAge > sevenDays) {
console.log('🔒 Session expired (7+ days old) - auto logout');
clearSession();
idToken = null;
currentUid = null;
} else {
idToken = savedToken;
currentUid = savedUid;
validateToken(savedToken, savedEmail);
}
} else {
idToken = null;
currentUid = null;
}
const preSavedCatId = localStorage.getItem('lastCategoryId');
if (preSavedCatId) {
const preSavedCat = categories.find(c => c.id === preSavedCatId);
if (preSavedCat) {
currentCat = preSavedCat;
document.getElementById('heroBook').style.display = 'none';
document.querySelector('.welcome-text').style.display = 'none';
document.getElementById('quoteSection').style.display = 'none';
document.getElementById('homeSection').style.display = 'none';
document.querySelector('.hero').classList.add('no-bg');
}
}
displayRandomQuote();
updateHeaderButtons();
fetchNotes();
fetchGlossary();
if (idToken) {
fetchPendingNotes();
}
const titleElement = document.getElementById('pageTitle');
titleElement.innerText = 'ΦΙΛΟΣΟΦΙΑ';
titleElement.classList.add('wave-anim');
}
function goHome() {
currentCat = null;
const addBtn = document.getElementById('glossaryAddBtn');
if (addBtn) addBtn.style.display = 'none';
localStorage.removeItem('lastCategoryId');
document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
const pt = document.getElementById('pageTitle');
pt.classList.add('shimmer');
document.getElementById('pageSubtitle').innerText = 'სიბრძნის სიყვარული';
document.getElementById('heroBook').style.display = 'block';
document.querySelector('.welcome-text').style.display = 'block';
document.getElementById('quoteSection').style.display = 'block';
document.querySelector('.hero').classList.remove('no-bg');
displayRandomQuote();
document.getElementById('notesGrid').innerHTML = '';
document.getElementById('searchBar').style.display = 'none';
document.getElementById('homeSection').style.display = 'block';
updateFab();
renderHomeCats();
initCarousel();
pt.innerText = 'ΦΙΛΟΣΟΦΙΑ';
pt.classList.add('wave-anim');
}
function renderHomeCats() {
}
function createRipple(element, e, color) {
const rect = element.getBoundingClientRect();
let x, y;
if (e.touches && e.touches.length > 0) {
x = e.touches[0].clientX - rect.left;
y = e.touches[0].clientY - rect.top;
} else {
x = e.clientX - rect.left;
y = e.clientY - rect.top;
}
const ripple = document.createElement('span');
ripple.className = 'cat-item-ripple';
ripple.style.left = x + 'px';
ripple.style.top = y + 'px';
ripple.style.width = '10px';
ripple.style.height = '10px';
ripple.style.background = color;
element.appendChild(ripple);
setTimeout(() => {
ripple.remove();
}, 600);
}
function buildCatList() {
const list = document.getElementById('catList');
list.innerHTML = '';
const colors = [
'rgba(167, 139, 250, 0.6)',
'rgba(129, 140, 248, 0.6)',
'rgba(244, 114, 182, 0.6)',
'rgba(251, 146, 60, 0.6)',
'rgba(52, 211, 153, 0.6)',
'rgba(248, 113, 113, 0.6)',
'rgba(96, 165, 250, 0.6)'
];
categories.forEach((c, index) => {
const count = notes.filter(n => n.cat === c.id).length;
const d = document.createElement('div');
d.className = 'cat-item';
d.id = 'cat_' + c.id;
d.style.display = 'flex';
d.style.justifyContent = 'space-between';
d.style.alignItems = 'center';
d.innerHTML = `<span>${c.name}</span><span style="font-size:0.75rem; background:rgba(59,130,246,0.15); color:var(--accent); padding:2px 9px; border-radius:20px; font-weight:600;">${count}</span>`;
const categoryColor = colors[index % colors.length];
d.addEventListener('click', (e) => {
createRipple(d, e, categoryColor);
d.style.background = categoryColor.replace('0.6', '0.3');
setTimeout(() => {
if (!d.classList.contains('active')) {
d.style.background = '';
}
}, 300);
document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
d.classList.add('active');
currentCat = c;
localStorage.setItem('lastCategoryId', c.id);
toggleMenu();
renderNotes();
});
list.appendChild(d);
});
}
async function fetchNotes() {
const grid = document.getElementById('notesGrid');
grid.innerHTML = '<div class="spinner"></div>';
buildCatList();
try {
const res  = await fbFetch(`${FIREBASE_DB}/notes.json`);
if (!res.ok) throw new Error('ჩატვირთვა ვერ მოხერხდა');
const data = await res.json();
notes = data
? Object.entries(data).map(([k, v]) => ({ ...v, fbId: k }))
: [];
buildCatList();
const lastCatId = localStorage.getItem('lastCategoryId');
if (!currentCat && lastCatId) {
const savedCat = categories.find(c => c.id === lastCatId);
if (savedCat) {
currentCat = savedCat;
const catElement = document.getElementById('cat_' + lastCatId);
if (catElement) {
document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
catElement.classList.add('active');
}
renderNotes();
return;
}
}
if (!currentCat) goHome();
else renderNotes();
} catch (err) {
grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>${err.message}</p></div>`;
}
}
function renderNotes(filtered_override) {
const grid = document.getElementById('notesGrid');
grid.innerHTML = '';
const addBtn = document.getElementById('glossaryAddBtn');
if (addBtn) addBtn.style.display = 'none';
document.getElementById('homeSection').style.display = 'none';
document.querySelector('.welcome-text').style.display = 'none';
document.getElementById('quoteSection').style.display = 'none';
document.getElementById('heroBook').style.display = 'none';
document.getElementById('searchBar').style.display = 'block';
document.querySelector('.hero').classList.add('no-bg');
stopCarousel();
if (!currentCat) { goHome(); return; }
const tEl = document.getElementById('pageTitle'); tEl.innerText = currentCat.name; tEl.classList.remove('shimmer');
document.getElementById('pageSubtitle').innerText = currentCat.desc || '';
const filtered = filtered_override !== undefined ? filtered_override : notes.filter(n => n.cat === currentCat.id);
if (filtered.length === 0) {
grid.innerHTML = '<div class="empty-state"><div class="icon">🖋</div><p>ამ კატეგორიაში ჩანაწერები არ არის</p></div>';
updateFab();
return;
}
filtered
.sort((a, b) => (b.date || 0) - (a.date || 0))
.forEach(n => {
const card = document.createElement('div');
card.className = 'card';
card.onclick = () => openReader(n);
const dateStr = n.date ? new Date(n.date).toLocaleDateString('ka-GE') : '—';
if (window.matchMedia('(hover: hover)').matches) {
card.addEventListener('mousemove', (e) => {
const rect = card.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
const centerX = rect.width / 2;
const centerY = rect.height / 2;
const rotateX = (y - centerY) / 20;
const rotateY = (centerX - x) / 20;
card.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
});
card.addEventListener('mouseleave', () => {
card.style.transform = '';
card.style.removeProperty('--mouse-x');
card.style.removeProperty('--mouse-y');
});
} else {
card.addEventListener('touchstart', (e) => {
const rect = card.getBoundingClientRect();
const touch = e.touches[0];
const x = touch.clientX - rect.left;
const y = touch.clientY - rect.top;
const ripple = document.createElement('span');
ripple.className = 'card-ripple';
ripple.style.left = x + 'px';
ripple.style.top = y + 'px';
ripple.style.width = '20px';
ripple.style.height = '20px';
card.appendChild(ripple);
setTimeout(() => {
ripple.remove();
}, 600);
});
}
let cardHTML = '';
if (n.coverUrl) {
cardHTML += `<div class="card-img-wrapper"><img src="${n.coverUrl}" alt="${escapeHtml(n.title || '')}" loading="lazy" decoding="async" /></div>`;
}
cardHTML += `
<h3>${escapeHtml(n.title || 'უსახელო')}</h3>
<div class="card-meta">
<div style="display:flex; flex-direction:column; gap:4px;">
${n.author ? `<span style="color:var(--accent); font-size:0.75rem; font-weight:600; letter-spacing:0.5px;">✍️ ${escapeHtml(n.author)}</span>` : ''}
<span class="card-date">${dateStr}</span>
</div>
<span class="card-read">კითხვა →</span>
</div>
`;
card.innerHTML = cardHTML;
grid.appendChild(card);
});
updateFab();
}
function openReader(note) {
currentNote = note;
const cat = categories.find(c => c.id === note.cat);
document.getElementById('readCat').innerText   = cat ? cat.name : '';
document.getElementById('readTitle').innerText = note.title || 'უსახელო';
document.getElementById('readDate').innerText  = note.date
? new Date(note.date).toLocaleDateString('ka-GE', { year:'numeric', month:'long', day:'numeric' })
: '';
const authorEl = document.getElementById('readAuthor');
if (note.author) {
authorEl.innerText = `✍️ ${note.author}`;
authorEl.style.display = 'block';
} else {
authorEl.innerText = '';
authorEl.style.display = 'none';
}
const coverContainer = document.getElementById('readCover');
if (note.coverUrl) {
coverContainer.innerHTML = `<img src="${note.coverUrl}" alt="${escapeHtml(note.title || '')}" style="width:100%; max-height:min(500px,45vh); object-fit:contain; border-radius:16px; margin-bottom:30px;" loading="lazy" decoding="async" />`;
} else {
coverContainer.innerHTML = '';
}
const sanitized = (note.content || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
document.getElementById('readBody').innerHTML = sanitized;
const adminCtrl = document.getElementById('adminControls');
adminCtrl.style.display = idToken ? 'block' : 'none';
document.getElementById('reader').style.display = 'block';
document.body.style.overflow = 'hidden';
}
function closeReader() {
document.getElementById('reader').style.display = 'none';
document.body.style.overflow = 'auto';
currentNote = null;
document.getElementById('articleBotPanel').style.display = 'none';
document.getElementById('articleBotChevron').style.transform = 'rotate(0deg)';
document.getElementById('articleBotResult').style.display = 'none';
document.getElementById('articleBotResult').innerHTML = '';
document.getElementById('articleBotInput').value = '';
}
async function deleteCurrentNote() {
if (!currentNote || !idToken) return;
if (!confirm(`წაიშალოს "${currentNote.title}"?`)) return;
try {
const res = await fbFetch(`${FIREBASE_DB}/notes/${currentNote.fbId}.json?auth=${idToken}`, {
method: 'DELETE'
});
if (!res.ok) throw new Error('წაშლა ვერ მოხერხდა');
closeReader();
await fetchNotes();
} catch (err) {
alert(err.message);
}
}
function handleAuthBtn() {
openModal('loginModal');
const lockUntil = parseInt(localStorage.getItem('lockUntil') || '0');
if (lockUntil && Date.now() < lockUntil) {
const remaining = Math.ceil((lockUntil - Date.now()) / 1000 / 60 / 60);
const errEl = document.getElementById('loginError');
showMsg(errEl, `🔒 დაბლოკილია. სცადე ${remaining} საათში.`, true);
document.getElementById('loginBtn').disabled = true;
} else {
document.getElementById('loginBtn').disabled = false;
document.getElementById('loginEmail').focus();
}
}
async function doLogin() {
const email    = document.getElementById('loginEmail').value.trim();
const password = document.getElementById('loginPassword').value;
const errEl    = document.getElementById('loginError');
const btn      = document.getElementById('loginBtn');
showMsg(errEl, '', false);
const lockUntil  = parseInt(localStorage.getItem('lockUntil') || '0');
const failCount  = parseInt(localStorage.getItem('loginFails') || '0');
if (lockUntil && Date.now() < lockUntil) {
const remaining = Math.ceil((lockUntil - Date.now()) / 1000 / 60 / 60);
showMsg(errEl, `🔒 2-ჯერ ცდა ვერ გამოგივიდა — დაბლოკილია. სცადე ${remaining} საათში.`, true);
return;
}
if (!email || !password) {
showMsg(errEl, 'შეიყვანეთ ელ. ფოსტა და პაროლი', true);
return;
}
btn.disabled    = true;
btn.innerText   = 'იტვირთება...';
try {
const res  = await fetch(`${FIREBASE_AUTH}:signInWithPassword?key=${API_KEY}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password, returnSecureToken: true })
});
const data = await res.json();
if (!res.ok) {
const newFails = failCount + 1;
localStorage.setItem('loginFails', newFails);
if (newFails >= 2) {
const until = Date.now() + 24 * 60 * 60 * 1000;
localStorage.setItem('lockUntil', until);
localStorage.removeItem('loginFails');
showMsg(errEl, '🔒 2-ჯერ ცდა ვერ გამოგივიდა — დაბლოკილია 24 საათით!', true);
btn.disabled = true;
btn.innerText = 'შესვლა';
return;
}
const msg = firebaseErrMsg(data?.error?.message);
showMsg(errEl, `${msg} (დარჩენილია ${2 - newFails} მცდელობა)`, true);
return;
}
localStorage.removeItem('loginFails');
localStorage.removeItem('lockUntil');
// Firebase login OK — ახლა TOTP შემოწმება
window._pendingAuthData = data;
closeModal('loginModal');
openModal('totpModal');
document.getElementById('totpInput').value = '';
document.getElementById('totpError').innerText = '';
setTimeout(() => document.getElementById('totpInput').focus(), 300);
} catch (err) {
showMsg(errEl, '📡 ინტერნეტი? რა ინტერნეტი? კავშირი ვერ მოხერხდა, სცადე თავიდან.', true);
} finally {
btn.disabled  = false;
btn.innerText = 'შესვლა';
}
}
function doLogout() {
if (!confirm('დარწმუნებული ხართ რომ გსურთ გამოსვლა?')) return;
idToken    = null;
currentUid = null;
localStorage.removeItem('idToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('currentUid');
localStorage.removeItem('userEmail');
localStorage.removeItem('sessionTimestamp');
document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
document.getElementById('lockBtn').setAttribute('title', 'შესვლა');
document.getElementById('logoutBtn').classList.remove('active');
document.getElementById('userBadge').style.display = 'none';
document.body.classList.remove('admin-mode');
updateFab();
updateHeaderButtons();
fetchNotes();
}
function firebaseErrMsg(code) {
const raw = (code || '').toLowerCase();
if (raw.includes('referer') || raw.includes('blocked') || raw.includes('api key')) {
return '⚠️ საიტი ლოკალურად გახსნილია. გადადი რეალურ მისამართზე და სცადე თავიდან.';
}
if (raw.includes('too_many') || raw.includes('too many')) {
return '😅 ამდენჯერ ცდა? ცოტა დაისვენე, მერე სცადე.';
}
return 'პაროლი ან ელფოსტა არასწორია';
}
function clearSession() {
localStorage.removeItem('idToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('currentUid');
localStorage.removeItem('userEmail');
localStorage.removeItem('sessionTimestamp');
idToken = null;
currentUid = null;
document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
document.getElementById('logoutBtn').classList.remove('active');
document.getElementById('userBadge').style.display = 'none';
document.body.classList.remove('admin-mode');
updateFab();
updateHeaderButtons();
}
async function validateToken(token, savedEmail) {
try {
const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ idToken: token })
});
if (res.ok) {
if (savedEmail) {
const badge = document.getElementById('userBadge');
badge.innerText = savedEmail.split('@')[0];
badge.style.display = 'inline-block';
}
document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>';
document.getElementById('logoutBtn').classList.add('active');
document.body.classList.add('admin-mode');
updateFab();
updateHeaderButtons();
fetchPendingNotes();
} else {
console.log('🔒 Token validation failed - forcing logout');
idToken = null;
currentUid = null;
clearSession();
alert('⚠️ სესია არავალიდურია. გთხოვთ ხელახლა შეხვიდეთ.');
fetchNotes();
}
} catch (err) {
console.log('Token validation failed due to network error:', err);
}
}
function openEditor() {
if (!idToken) { openModal('loginModal'); return; }
document.getElementById('editorTitle').value = '';
document.getElementById('editorArea').innerHTML  = '';
if (currentCat) document.getElementById('editorCat').value = currentCat.id;
showMsg(document.getElementById('editorError'), '', false);
showMsg(document.getElementById('editorSuccess'), '', false);
openModal('editorModal');
}
function fmt(cmd, value = null) {
document.getElementById('editorArea').focus();
document.execCommand(cmd, false, value);
}
function formatHeading(tag) {
const editor = document.getElementById('editorArea');
editor.focus();
document.execCommand('formatBlock', false, tag);
}
function insertBlockquote() {
const editor = document.getElementById('editorArea');
editor.focus();
const selection = window.getSelection();
if (selection.rangeCount > 0) {
const range = selection.getRangeAt(0);
const selectedText = range.toString();
if (selectedText) {
document.execCommand('formatBlock', false, 'blockquote');
}
}
}
function insertHR() {
const editor = document.getElementById('editorArea');
editor.focus();
document.execCommand('insertHorizontalRule', false, null);
}
function insertLink() {
const url = prompt('ლინკი:');
if (url) {
document.getElementById('editorArea').focus();
document.execCommand('createLink', false, url);
}
}
function changeFontSize(size) {
if (size) {
document.getElementById('editorArea').focus();
document.execCommand('fontSize', false, size);
}
}
function changeTextColor(color) {
document.getElementById('editorArea').focus();
document.execCommand('foreColor', false, color);
}
function changeBackColor(color) {
document.getElementById('editorArea').focus();
document.execCommand('hiliteColor', false, color);
}
function removeCoverImage() {
if (!currentNote) return;
if (!confirm('ნამდვილად გსურთ სურათის წაშლა?')) return;
currentNote.coverUrl = null;
document.getElementById('editCoverPreview').innerHTML = '<p style="color:var(--text-dim); font-size:0.85rem; margin-top:8px;">✓ სურათი წაიშლება შენახვის შემდეგ</p>';
document.getElementById('editCoverUrl').value = '';
}
function previewCoverUrl(url, previewId) {
const preview = document.getElementById(previewId);
preview.innerHTML = '';
if (url && url.trim()) {
preview.innerHTML = `<img src="${url.trim()}" style="max-width:100%; max-height:200px; border-radius:12px; border:1px solid var(--border);" onerror="this.parentElement.innerHTML='<p style=color:var(--text-dim);font-size:0.85rem;>❌ სურათის ჩატვირთვა ვერ მოხერხდა</p>';" />`;
}
}
async function saveNote() {
const title   = document.getElementById('editorTitle').value.trim();
const cat     = document.getElementById('editorCat').value;
const content = document.getElementById('editorArea').innerHTML.trim();
const coverUrlInput = document.getElementById('coverUrl').value.trim();
const author  = document.getElementById('editorAuthor').value.trim();
const errEl   = document.getElementById('editorError');
const sucEl   = document.getElementById('editorSuccess');
const btn     = document.getElementById('saveBtn');
showMsg(errEl, '', false);
showMsg(sucEl, '', false);
if (!title)   { showMsg(errEl, 'სათაური სავალდებულოა', true); return; }
if (!content || content === '<br>') { showMsg(errEl, 'შინაარსი სავალდებულოა', true); return; }
btn.disabled  = true;
btn.innerText = 'ინახება...';
try {
let coverUrl = null;
if (coverUrlInput) {
coverUrl = coverUrlInput;
}
const note = { title, cat, content, date: Date.now() };
if (coverUrl) note.coverUrl = coverUrl;
if (author) note.author = author;
const res = await fbFetch(`${FIREBASE_DB}/notes.json?auth=${idToken}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(note)
});
if (!res.ok) {
const errorData = await res.json();
throw new Error(errorData.error || 'Firebase-ის შეცდომა');
}
showMsg(sucEl, '✓ ჩანაწერი შენახულია!', true);
await fetchNotes();
document.getElementById('editorTitle').value = '';
document.getElementById('editorArea').innerHTML = '';
document.getElementById('editorAuthor').value = '';
const coverUrlEl = document.getElementById('coverUrl');
if (coverUrlEl) coverUrlEl.value = '';
const coverPreviewEl = document.getElementById('coverPreview');
if (coverPreviewEl) coverPreviewEl.innerHTML = '';
setTimeout(() => {
showMsg(sucEl, '', false);
showMsg(errEl, '', false);
closeModal('editorModal');
const saved = categories.find(c => c.id === cat);
if (saved) {
const catElement = document.getElementById('cat_' + cat);
document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
if (catElement) {
catElement.classList.add('active');
}
currentCat = saved;
renderNotes();
}
}, 1000);
} catch (err) {
console.error('Save error:', err);
showMsg(errEl, 'შენახვა ვერ მოხერხდა: ' + err.message, true);
showMsg(sucEl, '', false);
} finally {
btn.disabled  = false;
btn.innerText = 'შენახვა';
}
}
function getCategoryLabel(catId) {
const cat = categories.find(c => c.id === catId);
return cat ? cat.name : 'ზოგადი';
}
function formatDate(dateStr) {
if (!dateStr) return '';
const d = new Date(dateStr);
return d.toLocaleDateString('ka-GE', { year:'numeric', month:'long', day:'numeric' });
}
let carouselInterval = null;
let currentSlide = 0;
let carouselNotes = [];
function initCarousel() {
carouselNotes = notes.slice(0, 6);
if (carouselNotes.length === 0) return;
const track = document.getElementById('carouselTrack');
const dotsContainer = document.getElementById('carouselDots');
if (!track || !dotsContainer) return;
track.innerHTML = '';
dotsContainer.innerHTML = '';
carouselNotes.forEach((note, index) => {
const card = document.createElement('div');
card.className = 'carousel-card';
let coverHTML = '';
if (note.coverUrl) {
coverHTML = `<div class="carousel-img-wrapper"><img src="${note.coverUrl}" alt="${escapeHtml(note.title || '')}" loading="eager" decoding="async" /></div>`;
}
card.innerHTML = `
${coverHTML}
<p class="carousel-card-cat">${getCategoryLabel(note.cat)}</p>
<h4 class="carousel-card-title">${note.title}</h4>
${note.author ? `<p class="carousel-card-author">✍️ ${note.author}</p>` : ''}
<p class="carousel-card-excerpt">${getExcerpt(note.content)}</p>
<div class="carousel-card-footer">
<span class="carousel-card-date">${formatDate(note.date)}</span>
<span class="carousel-card-read">კითხვა →</span>
</div>
`;
card.addEventListener('click', () => openReader(note));
card.addEventListener('mouseenter', () => { card.classList.add('carousel-card-hover'); });
card.addEventListener('mouseleave', () => { card.classList.remove('carousel-card-hover'); });
track.appendChild(card);
const dot = document.createElement('div');
dot.className = index === 0 ? 'carousel-dot carousel-dot-active' : 'carousel-dot';
dot.addEventListener('click', () => goToSlide(index));
dotsContainer.appendChild(dot);
});
if (carouselNotes.length >= 2) {
startCarousel();
} else {
const dot = dotsContainer.firstChild;
if (dot) {
dot.style.animation = 'pulse 2s ease-in-out infinite';
if (!document.querySelector('#pulseAnimation')) {
const style = document.createElement('style');
style.id = 'pulseAnimation';
style.textContent = `
@keyframes pulse {
0%, 100% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.3); opacity: 0.7; }
}
`;
document.head.appendChild(style);
}
}
}
}
function startCarousel() {
stopCarousel();
carouselInterval = setInterval(nextSlide, 5000);
}
function stopCarousel() {
if (carouselInterval) {
clearInterval(carouselInterval);
carouselInterval = null;
}
}
function nextSlide() {
currentSlide = (currentSlide + 1) % carouselNotes.length;
updateCarousel();
}
function goToSlide(index) {
currentSlide = index;
updateCarousel();
stopCarousel();
setTimeout(startCarousel, 10000);
}
function updateCarousel() {
const track = document.getElementById('carouselTrack');
const dots = document.getElementById('carouselDots').children;
if (!track) return;
track.style.transform = `translateX(-${currentSlide * 100}%)`;
Array.from(dots).forEach((dot, index) => {
dot.className = index === currentSlide ? 'carousel-dot carousel-dot-active' : 'carousel-dot';
});
}
function getExcerpt(html) {
const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
return text.length > 120 ? text.substring(0, 120) + '...' : text;
}
function filterNotes() {
const q = document.getElementById('searchInput').value.toLowerCase().trim();
if (!currentCat) return;
const filtered = notes.filter(n => {
if (n.cat !== currentCat.id) return false;
const titleMatch = (n.title || '').toLowerCase().includes(q);
const contentText = (n.content || '').replace(/<[^>]*>/g, ' ').toLowerCase();
const contentMatch = contentText.includes(q);
return titleMatch || contentMatch;
});
renderNotes(filtered);
}
function toggleMenu() {
document.getElementById('sidebar').classList.toggle('active');
document.getElementById('sidebarOverlay').classList.toggle('active');
}
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function updateFab() {
const fab = document.getElementById('fabBtn');
fab.style.display = (idToken && currentCat) ? 'flex' : 'none';
}
function updateHeaderButtons() {
const submitBtn = document.getElementById('submitBtn');
const pendingBtn = document.getElementById('pendingBtn');
if (idToken) {
submitBtn.style.display = 'none';
pendingBtn.style.display = 'flex';
} else {
submitBtn.style.display = 'flex';
pendingBtn.style.display = 'none';
}
}
function showMsg(el, text, show) {
el.innerText = text;
if (show) el.classList.add('active');
else el.classList.remove('active');
}
function escapeHtml(str) {
return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function copyNote(btn) {
if (!currentNote) return;
const title = currentNote.title || '';
const body  = document.getElementById('readBody').innerText || '';
const text  = title + '\n\n' + body;
const done  = () => {
btn.innerText = '\u2713 დაკოპირდა!';
setTimeout(() => { btn.innerText = '\ud83d\udccb კოპირება'; }, 2000);
};
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
} else {
fallbackCopy(text, done);
}
}
function fallbackCopy(text, done) {
const ta = document.createElement('textarea');
ta.value = text;
ta.style.position = 'fixed';
ta.style.opacity  = '0';
document.body.appendChild(ta);
ta.focus(); ta.select();
document.execCommand('copy');
document.body.removeChild(ta);
done();
}
function openEditModal() {
if (!currentNote || !idToken) return;
document.getElementById('editTitle').value       = currentNote.title || '';
document.getElementById('editCat').value        = currentNote.cat   || 'epist';
document.getElementById('editArea').innerHTML   = currentNote.content || '';
document.getElementById('editCoverUrl').value   = currentNote.coverUrl || '';
document.getElementById('editAuthor').value     = currentNote.author || '';
const editCoverPreview = document.getElementById('editCoverPreview');
if (currentNote.coverUrl) {
editCoverPreview.innerHTML = `
<img src="${currentNote.coverUrl}" style="max-width:100%; max-height:200px; border-radius:12px; border:1px solid var(--border);" />
<p style="font-size:0.8rem; color:var(--text-dim); margin-top:8px;">ახალი სურათის ატვირთვა არასავალდებულოა</p>
`;
} else {
editCoverPreview.innerHTML = '';
}
showMsg(document.getElementById('editError'),   '', false);
showMsg(document.getElementById('editSuccess'), '', false);
openModal('editModal');
}
function fmtE(cmd, value = null) {
document.getElementById('editArea').focus();
document.execCommand(cmd, false, value);
}
function fmtEH(tag) {
document.getElementById('editArea').focus();
document.execCommand('formatBlock', false, tag);
}
function insertBlockquoteE() {
const editor = document.getElementById('editArea');
editor.focus();
const selection = window.getSelection();
if (selection.rangeCount > 0) {
const range = selection.getRangeAt(0);
const selectedText = range.toString();
if (selectedText) {
document.execCommand('formatBlock', false, 'blockquote');
}
}
}
function insertHRE() {
const editor = document.getElementById('editArea');
editor.focus();
document.execCommand('insertHorizontalRule', false, null);
}
function insertLinkE() {
const url = prompt('ლინკი:');
if (url) { document.getElementById('editArea').focus(); document.execCommand('createLink', false, url); }
}
function changeFontSizeE(size) {
if (size) {
document.getElementById('editArea').focus();
document.execCommand('fontSize', false, size);
}
}
function changeTextColorE(color) {
document.getElementById('editArea').focus();
document.execCommand('foreColor', false, color);
}
function changeBackColorE(color) {
document.getElementById('editArea').focus();
document.execCommand('hiliteColor', false, color);
}
async function updateNote() {
if (!currentNote || !idToken) return;
const title   = document.getElementById('editTitle').value.trim();
const cat     = document.getElementById('editCat').value;
const content = document.getElementById('editArea').innerHTML.trim();
const coverUrlInput = document.getElementById('editCoverUrl').value.trim();
const author  = document.getElementById('editAuthor').value.trim();
const errEl   = document.getElementById('editError');
const sucEl   = document.getElementById('editSuccess');
const btn     = document.getElementById('updateBtn');
showMsg(errEl, '', false);
showMsg(sucEl, '', false);
if (!title)   { showMsg(errEl, 'სათაური სავალდებულოა', true); return; }
if (!content || content === '<br>') { showMsg(errEl, 'შინაარსი სავალდებულოა', true); return; }
btn.disabled  = true;
btn.innerText = 'ინახება...';
try {
const updated = { ...currentNote, title, cat, content };
if (author) {
updated.author = author;
} else {
delete updated.author;
}
if (coverUrlInput) {
updated.coverUrl = coverUrlInput;
}
else if (currentNote.coverUrl === null) {
delete updated.coverUrl;
}
delete updated.fbId;
const endpoint = currentNote.pending
? `${FIREBASE_DB}/pending-notes/${currentNote.fbId}.json?auth=${idToken}`
: `${FIREBASE_DB}/notes/${currentNote.fbId}.json?auth=${idToken}`;
const res = await fbFetch(endpoint, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(updated)
});
if (!res.ok) throw new Error('Firebase-ის შეცდომა');
currentNote = { ...updated, fbId: currentNote.fbId };
showMsg(sucEl, '✓ განახლდა!', true);
showMsg(errEl, '', false);
document.getElementById('readTitle').innerText = title;
document.getElementById('readBody').innerHTML  = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
const coverContainer = document.getElementById('readCover');
if (coverContainer) {
if (updated.coverUrl) {
coverContainer.innerHTML = `<img src="${updated.coverUrl}" style="width:100%; max-height:min(500px,45vh); object-fit:contain; border-radius:16px; margin-bottom:30px;" />`;
} else {
coverContainer.innerHTML = '';
}
}
const authorEl = document.getElementById('readAuthor');
if (authorEl) {
if (updated.author) {
authorEl.innerText = `✍️ ${updated.author}`;
authorEl.style.display = 'block';
} else {
authorEl.innerText = '';
authorEl.style.display = 'none';
}
}
await fetchNotes();
if (currentNote.pending) {
await fetchPendingNotes();
}
setTimeout(() => {
showMsg(sucEl, '', false);
closeModal('editModal');
}, 800);
} catch (err) {
showMsg(errEl, 'განახლება ვერ მოხერხდა: ' + err.message, true);
showMsg(sucEl, '', false);
} finally {
btn.disabled  = false;
btn.innerText = 'განახლება';
}
}
document.querySelectorAll('.modal').forEach(m => {
m.addEventListener('click', e => {
if (e.target === m) m.classList.remove('active');
});
});
document.addEventListener('keydown', e => {
if (e.key === 'Escape') {
document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
if (document.getElementById('reader').style.display === 'block') closeReader();
if (document.getElementById('glossaryView').classList.contains('active')) closeGlossary();
if (document.getElementById('sidebar').classList.contains('active')) toggleMenu();
}
});
document.addEventListener('contextmenu', e => {
if (!idToken) e.preventDefault();
});
let logoClickCount = 0;
let logoClickTimer = null;
document.querySelector('.logo').addEventListener('click', () => {
logoClickCount++;
clearTimeout(logoClickTimer);
logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
if (logoClickCount >= 10) {
logoClickCount = 0;
localStorage.removeItem('lockUntil');
localStorage.removeItem('loginFails');
document.getElementById('loginBtn').disabled = false;
const errEl = document.getElementById('loginError');
showMsg(errEl, '✅ განბლოკილია! სცადე თავიდან.', false);
}
});
async function fetchGlossary() {
const countEl = document.getElementById('glossaryCount');
if (countEl) countEl.innerText = 'იტვირთება...';
try {
const res = await fbFetch(`${FIREBASE_DB}/glossary.json`);
if (!res.ok) throw new Error('Failed to fetch glossary');
const data = await res.json();
allGlossaryTerms = data ? Object.keys(data).map(key => ({
...data[key],
fbId: key
})) : [];
allGlossaryTerms.sort((a, b) => a.term.localeCompare(b.term, 'ka'));
updateGlossaryCount();
} catch (err) {
console.error('Error fetching glossary:', err);
allGlossaryTerms = [];
if (countEl) countEl.innerText = '0';
}
}
function updateGlossaryCount() {
const countEl = document.getElementById('glossaryCount');
if (countEl) {
countEl.innerText = allGlossaryTerms.length.toLocaleString();
}
}
function openGlossary() {
document.getElementById('glossaryView').classList.add('active');
document.getElementById('glossaryView').scrollTop = 0;
document.body.style.overflow = 'hidden';
document.getElementById('glossarySearchInput').focus();
document.getElementById('termDisplay').style.display = 'none';
document.getElementById('glossaryInitialView').style.display = 'block';
document.getElementById('glossarySearchInput').value = '';
document.getElementById('suggestionDropdown').classList.remove('active');
toggleMenu();
const fab = document.getElementById('fabBtn');
if (fab) fab.style.display = 'none';
const addBtn = document.getElementById('glossaryAddBtn');
if (addBtn) addBtn.style.display = idToken ? 'flex' : 'none';
}
function closeGlossary() {
document.getElementById('glossaryView').classList.remove('active');
document.body.style.overflow = '';
const addBtn = document.getElementById('glossaryAddBtn');
if (addBtn) addBtn.style.display = 'none';
updateFab();
}
function searchGlossary() {
const query = document.getElementById('glossarySearchInput').value.trim().toLowerCase();
const dropdown = document.getElementById('suggestionDropdown');
if (!query) {
dropdown.classList.remove('active');
return;
}
const filtered = allGlossaryTerms.filter(term =>
term.term.toLowerCase().includes(query)
);
if (filtered.length === 0) {
dropdown.innerHTML = '<div class="no-results">სიტყვა ლექსიკონში ვერ მოიძებნა</div>';
dropdown.classList.add('active');
return;
}
dropdown.innerHTML = filtered.slice(0, 8).map(term => `
<div class="suggestion-item" data-term-id="${term.fbId}">
<div class="suggestion-term">${term.term}</div>
<div class="suggestion-preview">${term.definition.substring(0, 100)}...</div>
</div>
`).join('');
dropdown.querySelectorAll('.suggestion-item').forEach(item => {
  item.addEventListener('touchend', (e) => {
    e.preventDefault();
    showTerm(item.dataset.termId);
  }, { passive: false });
  item.addEventListener('mousedown', (e) => {
    e.preventDefault();
    showTerm(item.dataset.termId);
  });
});
dropdown.classList.add('active');
}
function showTerm(termId) {
const term = allGlossaryTerms.find(t => t.fbId === termId);
if (!term) return;
currentGlossaryTerm = term;
document.getElementById('glossaryInitialView').style.display = 'none';
document.getElementById('suggestionDropdown').classList.remove('active');
document.getElementById('glossarySearchInput').value = '';
document.getElementById('termDisplay').style.display = 'block';
document.getElementById('glossaryView').scrollTop = 0;
document.getElementById('termTitle').innerText = term.term;
document.getElementById('termDefinition').innerText = term.definition;
if (term.category) {
document.getElementById('termCategory').innerText = term.category;
document.getElementById('termCategory').style.display = 'inline-block';
} else {
document.getElementById('termCategory').style.display = 'none';
}
if (idToken) {
document.getElementById('glossaryAdminControls').classList.add('active');
} else {
document.getElementById('glossaryAdminControls').classList.remove('active');
}
}
function backToGlossarySearch() {
document.getElementById('termDisplay').style.display = 'none';
document.getElementById('glossaryInitialView').style.display = 'block';
document.getElementById('glossarySearchInput').value = '';
document.getElementById('glossarySearchInput').focus();
}
async function addGlossaryTerm() {
if (!idToken) return;
const term = document.getElementById('newTermName').value.trim();
const category = document.getElementById('newTermCategory').value.trim();
const definition = document.getElementById('newTermDefinition').value.trim();
const errEl = document.getElementById('addGlossaryError');
const sucEl = document.getElementById('addGlossarySuccess');
const btn = document.getElementById('addTermBtn');
showMsg(errEl, '', false);
showMsg(sucEl, '', false);
if (!term) {
showMsg(errEl, 'ტერმინი სავალდებულოა', true);
return;
}
if (!definition) {
showMsg(errEl, 'განმარტება სავალდებულოა', true);
return;
}
btn.disabled = true;
btn.innerText = 'ემატება...';
try {
const newTerm = {
term,
definition,
category: category || null,
timestamp: Date.now()
};
const res = await fbFetch(`${FIREBASE_DB}/glossary.json?auth=${idToken}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(newTerm)
});
if (!res.ok) throw new Error('Firebase error');
showMsg(sucEl, '✓ ტერმინი დაემატა!', true);
await fetchGlossary();
setTimeout(() => {
closeModal('addGlossaryModal');
}, 1000);
} catch (err) {
showMsg(errEl, 'დამატება ვერ მოხერხდა: ' + err.message, true);
} finally {
btn.disabled = false;
btn.innerText = 'დამატება';
}
}
function editGlossaryTerm() {
if (!currentGlossaryTerm) return;
document.getElementById('editTermName').value = currentGlossaryTerm.term;
document.getElementById('editTermCategory').value = currentGlossaryTerm.category || '';
document.getElementById('editTermDefinition').value = currentGlossaryTerm.definition;
openModal('editGlossaryModal');
showMsg(document.getElementById('editGlossaryError'), '', false);
showMsg(document.getElementById('editGlossarySuccess'), '', false);
}
async function updateGlossaryTerm() {
if (!idToken || !currentGlossaryTerm) return;
const term = document.getElementById('editTermName').value.trim();
const category = document.getElementById('editTermCategory').value.trim();
const definition = document.getElementById('editTermDefinition').value.trim();
const errEl = document.getElementById('editGlossaryError');
const sucEl = document.getElementById('editGlossarySuccess');
const btn = document.getElementById('updateTermBtn');
showMsg(errEl, '', false);
showMsg(sucEl, '', false);
if (!term || !definition) {
showMsg(errEl, 'ტერმინი და განმარტება სავალდებულოა', true);
return;
}
btn.disabled = true;
btn.innerText = 'ინახება...';
try {
const updated = {
term,
definition,
category: category || null,
timestamp: currentGlossaryTerm.timestamp
};
const res = await fbFetch(`${FIREBASE_DB}/glossary/${currentGlossaryTerm.fbId}.json?auth=${idToken}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(updated)
});
if (!res.ok) throw new Error('Firebase error');
showMsg(sucEl, '✓ განახლდა!', true);
currentGlossaryTerm = { ...updated, fbId: currentGlossaryTerm.fbId };
document.getElementById('termTitle').innerText = term;
document.getElementById('termDefinition').innerText = definition;
if (category) {
document.getElementById('termCategory').innerText = category;
document.getElementById('termCategory').style.display = 'inline-block';
} else {
document.getElementById('termCategory').style.display = 'none';
}
await fetchGlossary();
setTimeout(() => {
closeModal('editGlossaryModal');
}, 800);
} catch (err) {
showMsg(errEl, 'განახლება ვერ მოხერხდა: ' + err.message, true);
} finally {
btn.disabled = false;
btn.innerText = 'განახლება';
}
}
async function deleteGlossaryTerm() {
if (!idToken || !currentGlossaryTerm) return;
if (!confirm(`დარწმუნებული ხართ, რომ გსურთ ტერმინის "${currentGlossaryTerm.term}" წაშლა?`)) {
return;
}
try {
const res = await fbFetch(`${FIREBASE_DB}/glossary/${currentGlossaryTerm.fbId}.json?auth=${idToken}`, {
method: 'DELETE'
});
if (!res.ok) throw new Error('Firebase error');
await fetchGlossary();
backToGlossarySearch();
} catch (err) {
alert('წაშლა ვერ მოხერხდა: ' + err.message);
}
}
setupEventListeners();
init();
async function adminUnblockBot() {
if (!idToken) return;
const btn = document.querySelector('#botAdminUnblock button');
btn.disabled = true;
btn.innerText = '⏳ იხსნება...';
try {
localStorage.removeItem('botBlockedUntil');
await fbFetch('https://gen-lang-client-0339684222-default-rtdb.firebaseio.com/bot-blocks.json', {
method: 'DELETE'
});
await fbFetch('https://gen-lang-client-0339684222-default-rtdb.firebaseio.com/bot-ratelimit.json', {
method: 'DELETE'
});
const resultEl = document.getElementById('articleBotResult');
resultEl.innerHTML = '<div class="article-bot-a bot-warning">✅ ყველა ბლოკი მოიხსნა!</div>';
resultEl.style.display = 'block';
document.getElementById('articleBotInput').disabled = false;
document.getElementById('articleBotSendBtn').disabled = false;
btn.innerText = '✅ მოიხსნა!';
setTimeout(() => {
btn.disabled = false;
btn.innerText = '🔓 ბლოკის მოხსნა (ადმინი)';
}, 2000);
} catch (err) {
btn.disabled = false;
btn.innerText = '🔓 ბლოკის მოხსნა (ადმინი)';
alert('შეცდომა: ' + err.message);
}
}
function generateFingerprint() {
const components = [
navigator.userAgent,
navigator.language,
navigator.languages ? navigator.languages.join(',') : '',
screen.width + 'x' + screen.height,
screen.colorDepth,
new Date().getTimezoneOffset(),
navigator.hardwareConcurrency || 0,
navigator.platform || '',
navigator.maxTouchPoints || 0,
Intl.DateTimeFormat().resolvedOptions().timeZone || ''
];
const str = components.join('|');
let hash = 0;
for (let i = 0; i < str.length; i++) {
const char = str.charCodeAt(i);
hash = ((hash << 5) - hash) + char;
hash = hash & hash;
}
return Math.abs(hash).toString(36);
}
function toggleArticleBot() {
const panel = document.getElementById('articleBotPanel');
const chevron = document.getElementById('articleBotChevron');
const isOpen = panel.style.display !== 'none';
panel.style.display = isOpen ? 'none' : 'block';
chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
const unblockBtn = document.getElementById('botAdminUnblock');
if (unblockBtn) unblockBtn.style.display = (!isOpen && idToken) ? 'block' : 'none';
if (!isOpen) {
const localBlock = parseInt(localStorage.getItem('botBlockedUntil') || '0');
if (localBlock && Date.now() < localBlock) {
const resultEl = document.getElementById('articleBotResult');
resultEl.style.display = 'block';
showBotCountdown(resultEl, localBlock);
document.getElementById('articleBotInput').disabled = true;
document.getElementById('articleBotSendBtn').disabled = true;
} else {
localStorage.removeItem('botBlockedUntil');
document.getElementById('articleBotInput').disabled = false;
document.getElementById('articleBotSendBtn').disabled = false;
setTimeout(() => document.getElementById('articleBotInput').focus(), 100);
}
}
}
function renderBotMarkdown(text) {
return text
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
.replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
.replace(/(<li>[\s\S]+?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
.replace(/\n{2,}/g, '</p><p>')
.replace(/\n/g, '<br>')
.replace(/^(.+)/, '<p>$1')
.replace(/(.+)$/, '$1</p>');
}
async function askArticleBot() {
const input = document.getElementById('articleBotInput');
const question = input.value.trim();
if (!question) return;
const localBlock = parseInt(localStorage.getItem('botBlockedUntil') || '0');
if (localBlock && Date.now() < localBlock) {
const resultEl = document.getElementById('articleBotResult');
showBotCountdown(resultEl, localBlock);
resultEl.style.display = 'block';
return;
}
const resultEl  = document.getElementById('articleBotResult');
const loadingEl = document.getElementById('articleBotLoading');
const sendBtn   = document.getElementById('articleBotSendBtn');
const articleText  = document.getElementById('readBody').innerText;
const articleTitle = document.getElementById('readTitle').innerText;
const articleAuthor = document.getElementById('readAuthor').innerText;
input.disabled  = true;
sendBtn.disabled = true;
resultEl.style.display  = 'none';
loadingEl.style.display = 'flex';
const prompt = `შენ ხარ სტატიის ასისტენტი. გაქვს წვდომა მხოლოდ ამ სტატიაზე.
სტატია: "${articleTitle}"
ავტორი: ${articleAuthor || 'მითითებული არ არის'}
შინაარსი: ${articleText}
წესები:
1. პასუხი მხოლოდ ამ სტატიის მიხედვით
2. თუ პასუხი სტატიაში არ არის — თქვი "ამ სტატიაში ეს არ განხილულა"
3. მოკლედ და ზუსტად
4. ქართულად
5. თუ გკითხეს სტატიაში მოყვანილი სიტყვის განმარტება, განმარტე ის სტატიის კონტექსტის მიხედვით
6. თუ გკითხეს ვინ შეგქმნა, ვინ ხარ, ან მსგავსი — უპასუხე რომ შენ ხარ ფილოსოფიის საიტის ასისტენტი, შექმნილი ნოდარ ქებაძის მიერ, საიტის ადმინისტრატორის მიერ
კითხვა: ${question}`;
try {
const res = await fetch('/api/gemini', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
fp: generateFingerprint(),
contents: [{ parts: [{ text: prompt }] }]
})
});
const data = await res.json();
if (res.status === 429 || data.status === 'ratelimited') {
const secs = data.retryAfterSeconds || 30;
showBotRateLimit(resultEl, secs);
resultEl.style.display = 'block';
return;
}
if (data.status === 'blocked') {
const blockedUntil = Date.now() + data.hoursLeft * 60 * 60 * 1000;
localStorage.setItem('botBlockedUntil', blockedUntil);
showBotCountdown(resultEl, blockedUntil);
resultEl.style.display = 'block';
return;
}
if (!res.ok) throw new Error('სერვერის შეცდომა');
if (data.status === 'warning') {
resultEl.innerHTML = `<div class="article-bot-a bot-warning">${data.message}</div>`;
resultEl.style.display = 'block';
return;
}
const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'პასუხი ვერ მოიძებნა';
const similarity = question.trim().toLowerCase() === botLastQuestion
? 1.0
: (() => {
const a = question.trim().toLowerCase().replace(/\s+/g, '');
const b = botLastQuestion.replace(/\s+/g, '');
if (!a || !b) return 0;
if (a === b) return 1.0;
const longer = a.length > b.length ? a : b;
const shorter = a.length > b.length ? b : a;
let matches = 0;
for (let i = 0; i < shorter.length; i++) {
if (longer.includes(shorter[i])) matches++;
}
return matches / longer.length;
})();
if (similarity >= 0.8) {
botSameCount++;
} else {
botLastQuestion = question.trim().toLowerCase();
botSameCount = 1;
}
if (botSameCount >= 3) {
const spamRes = await fetch('/api/gemini', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ fp: generateFingerprint(), contents: [{ parts: [{ text: '__SPAM_VIOLATION__' }] }] })
});
const spamData = await spamRes.json();
if (spamData.status === 'blocked') {
const blockedUntil = Date.now() + spamData.hoursLeft * 60 * 60 * 1000;
localStorage.setItem('botBlockedUntil', blockedUntil);
showBotCountdown(resultEl, blockedUntil);
resultEl.style.display = 'block';
botSameCount = 0;
return;
}
if (spamData.status === 'warning') {
resultEl.innerHTML = '<div class="article-bot-a bot-warning">' + spamData.message + '</div>';
resultEl.style.display = 'block';
return;
}
}
const isOffTopic = answer.includes('ამ სტატიაში ეს არ განხილულა') || answer.includes('სტატიაში არ არის განხილული');
if (isOffTopic) {
const otRes = await fetch('/api/gemini', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ fp: generateFingerprint(), contents: [{ parts: [{ text: '__OFFTOPIC_VIOLATION__' }] }] })
});
const otData = await otRes.json();
if (otData.status === 'blocked') {
const blockedUntil = Date.now() + otData.hoursLeft * 60 * 60 * 1000;
localStorage.setItem('botBlockedUntil', blockedUntil);
showBotCountdown(resultEl, blockedUntil);
resultEl.style.display = 'block';
return;
}
if (otData.status === 'warning') {
resultEl.innerHTML = '<div class="article-bot-a bot-warning">' + otData.message + '</div>';
resultEl.style.display = 'block';
return;
}
}
resultEl.innerHTML = '<div class="article-bot-a">' + renderBotMarkdown(answer) + '</div>';
resultEl.style.display = 'block';
input.value = '';
} catch (err) {
resultEl.innerHTML = `<div class="article-bot-a" style="color:#ef4444;">⚠️ შეცდომა: ${err.message}</div>`;
resultEl.style.display = 'block';
} finally {
loadingEl.style.display = 'none';
input.disabled  = false;
sendBtn.disabled = false;
input.focus();
}
}
function showBotRateLimit(el, retryAfterSeconds) {
const input = document.getElementById('articleBotInput');
const btn = document.getElementById('articleBotSendBtn');
if (input) input.disabled = true;
if (btn) btn.disabled = true;
let remaining = retryAfterSeconds;
function updateRateLimit() {
if (remaining <= 0) {
el.innerHTML = '<div class="article-bot-a bot-warning">✅ შეგიძლია კვლავ დასვა კითხვა!</div>';
if (input) input.disabled = false;
if (btn) btn.disabled = false;
return;
}
el.innerHTML = '<div class="article-bot-a bot-blocked" style="text-align:center;">⏳ ძალიან ბევრი კითხვა!<br><span class="bot-countdown" style="font-size:2.5rem;">' + remaining + '</span><br><small>წამი დარჩენილია</small></div>';
el.style.display = 'block';
remaining--;
setTimeout(updateRateLimit, 1000);
}
updateRateLimit();
}
function showBotCountdown(el, blockedUntil) {
const input = document.getElementById('articleBotInput');
const btn = document.getElementById('articleBotSendBtn');
if (input) input.disabled = true;
if (btn) btn.disabled = true;
function updateCountdown() {
const remaining = blockedUntil - Date.now();
if (remaining <= 0) {
localStorage.removeItem('botBlockedUntil');
el.innerHTML = '<div class="article-bot-a bot-warning">✅ ბლოკი მოიხსნა! შეგიძლია კვლავ გამოიყენო ბოტი.</div>';
if (input) input.disabled = false;
if (btn) btn.disabled = false;
return;
}
const h = Math.floor(remaining / 3600000);
const m = Math.floor((remaining % 3600000) / 60000);
const s = Math.floor((remaining % 60000) / 1000);
const hh = String(h).padStart(2,'0');
const mm = String(m).padStart(2,'0');
const ss = String(s).padStart(2,'0');
el.innerHTML = '<div class="article-bot-a bot-blocked">🚫 დაბლოკილი ხარ სარგებლობის წესების დარღვევის გამო<br><span class="bot-countdown">' + hh + ':' + mm + ':' + ss + '</span><br><small>დარჩენილი დრო განბლოკვამდე</small></div>';
setTimeout(updateCountdown, 1000);
}
updateCountdown();
}
function setupEventListeners() {
document.getElementById('menuBtn').addEventListener('click', toggleMenu);
document.getElementById('logoBtn').addEventListener('click', goHome);
document.getElementById('submitBtn').addEventListener('click', openPublicSubmission);
document.getElementById('pendingBtn').addEventListener('click', openPendingPanel);
document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('lockBtn').addEventListener('click', handleAuthBtn);
document.getElementById('sidebarOverlay').addEventListener('click', toggleMenu);
document.getElementById('sidebarCloseBtn').addEventListener('click', toggleMenu);
document.getElementById('glossaryOpenBtn').addEventListener('click', openGlossary);
const searchInput = document.getElementById('searchInput');
if (searchInput) {
searchInput.addEventListener('input', filterNotes);
searchInput.addEventListener('focus', () => {
searchInput.style.borderColor = 'var(--accent)';
searchInput.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
});
searchInput.addEventListener('blur', () => {
searchInput.style.borderColor = 'var(--border)';
searchInput.style.boxShadow = 'none';
});
}
document.getElementById('closeReaderBtn').addEventListener('click', closeReader);
document.getElementById('copyNoteBtn').addEventListener('click', function() { copyNote(this); });
document.getElementById('openEditModalBtn').addEventListener('click', openEditModal);
document.getElementById('deleteCurrentNoteBtn').addEventListener('click', deleteCurrentNote);
document.getElementById('articleBotToggle').addEventListener('click', toggleArticleBot);
document.getElementById('articleBotSendBtn').addEventListener('click', askArticleBot);
document.getElementById('articleBotInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') askArticleBot();
});
const adminUnblockBotBtn = document.getElementById('adminUnblockBotBtn');
if (adminUnblockBotBtn) adminUnblockBotBtn.addEventListener('click', adminUnblockBot);
document.getElementById('fabBtn').addEventListener('click', openEditor);
document.getElementById('closeGlossaryBtn').addEventListener('click', closeGlossary);
document.getElementById('backToSearchBtn').addEventListener('click', backToGlossarySearch);
document.getElementById('editGlossaryTermBtn').addEventListener('click', editGlossaryTerm);
document.getElementById('deleteGlossaryTermBtn').addEventListener('click', deleteGlossaryTerm);
document.getElementById('glossaryAddBtn').addEventListener('click', () => openModal('addGlossaryModal'));
const glossarySearch = document.getElementById('glossarySearchInput');
if (glossarySearch) glossarySearch.addEventListener('input', searchGlossary);
document.getElementById('closeLoginModalBtn').addEventListener('click', () => closeModal('loginModal'));
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('totpBtn').addEventListener('click', doTotpVerify);
document.getElementById('totpInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doTotpVerify(); });
document.getElementById('closeTotpModalBtn').addEventListener('click', () => { closeModal('totpModal'); window._pendingAuthData = null; });
document.getElementById('loginPassword').addEventListener('keydown', (e) => {
if (e.key === 'Enter') doLogin();
});
document.getElementById('closeEditorModalBtn').addEventListener('click', () => closeModal('editorModal'));
document.getElementById('cancelEditorBtn').addEventListener('click', () => closeModal('editorModal'));
document.getElementById('saveBtn').addEventListener('click', saveNote);
document.getElementById('coverUrl').addEventListener('change', (e) => previewCoverUrl(e.target.value, 'coverPreview'));
document.getElementById('textColorPicker').addEventListener('change', (e) => changeTextColor(e.target.value));
document.getElementById('bgColorPicker').addEventListener('change', (e) => changeBackColor(e.target.value));
document.getElementById('fontSizeSelect').addEventListener('change', (e) => changeFontSize(e.target.value));
document.querySelectorAll('#toolbar .tb-btn[data-cmd]').forEach(btn => {
btn.addEventListener('click', () => {
const cmd = btn.dataset.cmd;
const type = btn.dataset.type;
if (type === 'heading') formatHeading(cmd);
else if (cmd === 'blockquote') insertBlockquote();
else if (cmd === 'link') insertLink();
else if (cmd === 'hr') insertHR();
else fmt(cmd);
});
});
document.getElementById('closeEditModalBtn').addEventListener('click', () => closeModal('editModal'));
document.getElementById('cancelEditBtn').addEventListener('click', () => closeModal('editModal'));
document.getElementById('updateBtn').addEventListener('click', updateNote);
document.getElementById('editCoverUrl').addEventListener('change', (e) => previewCoverUrl(e.target.value, 'editCoverPreview'));
document.getElementById('removeCoverImageBtn').addEventListener('click', removeCoverImage);
document.getElementById('removeCoverImageBtn').addEventListener('mouseover', function() { this.style.background = 'rgba(239,68,68,0.2)'; });
document.getElementById('removeCoverImageBtn').addEventListener('mouseout', function() { this.style.background = 'rgba(239,68,68,0.1)'; });
document.getElementById('textColorPickerE').addEventListener('change', (e) => changeTextColorE(e.target.value));
document.getElementById('bgColorPickerE').addEventListener('change', (e) => changeBackColorE(e.target.value));
document.getElementById('fontSizeSelectE').addEventListener('change', (e) => changeFontSizeE(e.target.value));
document.querySelectorAll('.tb-btn[data-target="edit"]').forEach(btn => {
btn.addEventListener('click', () => {
const cmd = btn.dataset.cmd;
const type = btn.dataset.type;
if (type === 'heading') fmtEH(cmd);
else if (cmd === 'blockquote') insertBlockquoteE();
else if (cmd === 'link') insertLinkE();
else if (cmd === 'hr') insertHRE();
else fmtE(cmd);
});
});
document.getElementById('closeSubmissionModalBtn').addEventListener('click', () => closeModal('publicSubmissionModal'));
document.getElementById('cancelSubmissionBtn').addEventListener('click', () => closeModal('publicSubmissionModal'));
document.getElementById('submitArticleBtn').addEventListener('click', submitArticle);
document.querySelectorAll('.tb-btn[data-target="sub"]').forEach(btn => {
btn.addEventListener('click', () => {
const cmd = btn.dataset.cmd;
const type = btn.dataset.type;
if (type === 'heading') formatHeadingS(cmd);
else if (cmd === 'blockquote') insertBlockquoteS();
else fmtS(cmd);
});
});
document.getElementById('closePendingModalBtn').addEventListener('click', () => closeModal('pendingModal'));
document.getElementById('closeAddGlossaryModalBtn').addEventListener('click', () => closeModal('addGlossaryModal'));
document.getElementById('addTermBtn').addEventListener('click', addGlossaryTerm);
document.getElementById('closeEditGlossaryModalBtn').addEventListener('click', () => closeModal('editGlossaryModal'));
document.getElementById('updateTermBtn').addEventListener('click', updateGlossaryTerm);
}

// ===== GEMINI STATUS CHECKER =====
async function checkGeminiStatus() {
  const result = document.getElementById('geminiStatusResult');
  const dot = document.getElementById('geminiStatusDot');

  result.innerHTML = '<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:8px 0;">⏳ შემოწმება მიმდინარეობს...</div>';

  const startTime = Date.now();
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'გამარჯობა. უპასუხე ერთი სიტყვით: OK' }] }] })
    });
    const elapsed = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.status === 'ok' || data.candidates)) {
      result.innerHTML = `<div style="color:#22c55e;font-weight:700;">✅ Gemini მუშაობს! (${elapsed}ms)</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">🔑 გასაღები OK · 🌐 სერვერი OK</div>`;
    } else if (res.status === 503) {
      result.innerHTML = '<div style="color:#ef4444;font-weight:700;">🌐 Google-ის სერვერის პრობლემა</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">შენი კოდი სწორია — Google Gemini-ს სერვერი არ პასუხობს. დაელოდე და ცადე მოგვიანებით.</div>';
    } else if (res.status === 500) {
      const isNoKeys = (data.error || '').includes('No API keys');
      result.innerHTML = isNoKeys
        ? '<div style="color:#ef4444;font-weight:700;">🔑 Vercel-ში გასაღები არ არის</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Settings → Environment Variables → GEMINI_KEY_1 დაამატე → Redeploy</div>'
        : `<div style="color:#ef4444;font-weight:700;">⚙️ gemini.js-ის შეცდომა</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${data.error || 'უცნობი შეცდომა'}</div>`;
    } else if (res.status === 429) {
      result.innerHTML = '<div style="color:#eab308;font-weight:700;">⏱️ დღიური ლიმიტი ამოიწურა</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">ხვალ UTC 00:00-ზე განახლდება. ახალი გასაღები ააღე AI Studio-ში.</div>';
    } else {
      result.innerHTML = `<div style="color:#ef4444;font-weight:700;">❓ სტატუსი: ${res.status}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${data.error || JSON.stringify(data).substring(0,80)}</div>`;
    }
  } catch(err) {
    result.innerHTML = `<div style="color:#ef4444;font-weight:700;">📡 ქსელის პრობლემა</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">${err.message}</div>`;
  }
}

// ===== ERROR MONITOR (admin only) =====
(function() {
  const errors = [];
  const MAX_ERRORS = 50;

  function formatTime() {
    const now = new Date();
    return now.toTimeString().substring(0, 8);
  }

  function addError(type, message, level = 'error') {
    errors.unshift({ type, message, level, time: formatTime() });
    if (errors.length > MAX_ERRORS) errors.pop();
    renderErrors();
    updateBadge();
  }

  function renderErrors() {
    const list = document.getElementById('errorMonitorList');
    if (!list) return;
    if (errors.length === 0) {
      list.innerHTML = '<div class="error-monitor-empty">✅ ერორები არ არის</div>';
      return;
    }
    list.innerHTML = errors.map(e => `
      <div class="error-item ${e.level}">
        <div class="error-item-time">${e.time}</div>
        <div class="error-item-type">${e.type}</div>
        <div class="error-item-msg">${e.message}</div>
      </div>
    `).join('');
  }

  function updateBadge() {
    const btn = document.getElementById('errorMonitorBtn');
    const count = document.getElementById('errorMonitorCount');
    if (!btn || !count) return;
    count.textContent = errors.length;
    if (errors.length > 0) {
      btn.classList.add('has-errors');
      btn.style.color = '#ef4444';
    } else {
      btn.classList.remove('has-errors');
      btn.style.color = '#22c55e';
    }
  }

  // გლობალური JS შეცდომები
  window.addEventListener('error', function(e) {
    addError('JS Error', `${e.message}\n${e.filename ? e.filename.split('/').pop() + ':' + e.lineno : ''}`, 'error');
  });

  // Promise შეცდომები (fetch, firebase და სხვა)
  window.addEventListener('unhandledrejection', function(e) {
    const msg = e.reason?.message || String(e.reason) || 'Unknown rejection';
    addError('Promise Error', msg, 'error');
  });

  // console.error-ის ჩაჭერა
  const origError = console.error;
  console.error = function(...args) {
    addError('Console Error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error');
    origError.apply(console, args);
  };

  // console.warn-ის ჩაჭერა
  const origWarn = console.warn;
  console.warn = function(...args) {
    addError('Warning', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn');
    origWarn.apply(console, args);
  };

  // ღილაკები
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('errorMonitorBtn');
    const panel = document.getElementById('errorMonitorPanel');
    const closeBtn = document.getElementById('errorMonitorClose');
    const clearBtn = document.getElementById('errorMonitorClear');
    const checkBtn = document.getElementById('geminiCheckBtn');

    if (btn) btn.addEventListener('click', function() {
      panel.classList.toggle('open');
    });
    if (closeBtn) closeBtn.addEventListener('click', function() {
      panel.classList.remove('open');
    });
    if (clearBtn) clearBtn.addEventListener('click', function() {
      errors.length = 0;
      renderErrors();
      updateBadge();
    });
    if (checkBtn) checkBtn.addEventListener('click', checkGeminiStatus);

    renderErrors();
    updateBadge();
  });
})();


// ━━━━━━━━━━━━━━━━ GITHUB UPLOADER ━━━━━━━━━━━━━━━━
var UP_OWNER = 'Phillosopheer', UP_REPO = 'filosofia', UP_BRANCH = 'main';

function upSyncBtn() {
  var btn = document.getElementById('uploaderBtn');
  if (!btn) return;
  btn.style.display = document.body.classList.contains('admin-mode') ? 'flex' : 'none';
}
new MutationObserver(upSyncBtn).observe(document.body, {attributes:true, attributeFilter:['class']});

function upSetTokenStatus(text, state) {
  var dot = document.getElementById('upTokenDot');
  var span = document.getElementById('upTokenText');
  if (!dot || !span) return;
  span.textContent = text;
  dot.style.background = state === 'ok' ? '#4a9e6b' : state === 'err' ? '#c0392b' : 'var(--text-dim)';
}

function upLog(msg, type) {
  var el = document.getElementById('upLog');
  if (!el) return;
  el.style.display = 'block';
  var line = document.createElement('div');
  line.style.color = type === 'ok' ? '#4a9e6b' : type === 'err' ? '#ef4444' : 'var(--gold-dim)';
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function upSetSlotStatus(slot, msg, ok) {
  var el = slot.querySelector('.up-status');
  if (!el) return;
  el.innerHTML = '<div style="width:6px;height:6px;border-radius:50%;background:'+(ok?'#4a9e6b':'#ef4444')+';flex-shrink:0;"></div><span style="color:'+(ok?'#4a9e6b':'#ef4444')+'">'+msg+'</span>';
}

async function upGetSHA(path, token) {
  try {
    var r = await fetch('https://api.github.com/repos/'+UP_OWNER+'/'+UP_REPO+'/contents/'+path+'?ref='+UP_BRANCH, {headers:{Authorization:'token '+token}});
    if (r.ok) { var d = await r.json(); return d.sha; }
  } catch(e) {}
  return null;
}

async function upUploadFile(slot, token) {
  var inp = slot.querySelector('input[type=file]');
  if (!inp || !inp.files[0]) return 'skip';
  var path = slot.dataset.path;
  var content = await new Promise(function(res) {
    var fr = new FileReader();
    fr.onload = function(e) { res(e.target.result.split(',')[1]); };
    fr.readAsDataURL(inp.files[0]);
  });
  var sha = await upGetSHA(path, token);
  console.log('[UP] path='+path+' sha='+sha);
  var body = {message: 'Update '+path, content: content, branch: UP_BRANCH};
  if (sha) body.sha = sha;
  try {
    var r = await fetch('https://api.github.com/repos/'+UP_OWNER+'/'+UP_REPO+'/contents/'+path, {
      method: 'PUT',
      headers: {Authorization: 'token '+token, 'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    var rtext = await r.text();
    console.log('[UP] status='+r.status+' response='+rtext.substring(0,200));
    return r.ok ? 'ok' : 'err';
  } catch(e) {
    console.error('[UP] fetch error: '+e.message);
    return 'err';
  }
}

window.openUploader = function() {
  var modal = document.getElementById('uploaderModal');
  if (modal) modal.classList.add('active');
  var saved = localStorage.getItem('gh_uploader_token');
  if (saved) {
    var inp = document.getElementById('upToken');
    if (inp) { inp.value = saved; upSetTokenStatus('შენახული token ჩაიტვირთა', 'idle'); }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  upSyncBtn();

  // ღილაკი — გახსნა
  var uploaderBtn = document.getElementById('uploaderBtn');
  if (uploaderBtn) uploaderBtn.addEventListener('click', window.openUploader);

  // X — დახურვა
  var closeBtn = document.getElementById('uploaderCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', function() {
    var modal = document.getElementById('uploaderModal');
    if (modal) modal.classList.remove('active');
  });

  // Token შემოწმება
  var checkBtn = document.getElementById('upCheckBtn');
  if (checkBtn) checkBtn.addEventListener('click', async function() {
    var t = (document.getElementById('upToken').value || '').trim();
    if (!t) { upSetTokenStatus('Token შეიყვანე', 'err'); return; }
    upSetTokenStatus('შემოწმება...', 'idle');
    try {
      var r = await fetch('https://api.github.com/repos/'+UP_OWNER+'/'+UP_REPO, {headers:{Authorization:'token '+t}});
      if (r.ok) {
        upSetTokenStatus('✓ '+UP_OWNER+' — Token ვალიდია', 'ok');
        if (document.getElementById('upSave').checked) localStorage.setItem('gh_uploader_token', t);
      } else {
        upSetTokenStatus('Token არასწორია', 'err');
      }
    } catch(e) { upSetTokenStatus('შეცდომა', 'err'); }
  });

  // ტაბები
  var tabs = document.querySelectorAll('#upTabs .up-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.up-group').forEach(function(g) { g.classList.remove('visible'); });
      tab.classList.add('active');
      var group = document.getElementById('upgroup-'+tab.dataset.tab);
      if (group) group.classList.add('visible');
    });
  });

  // ფაილის არჩევა — delegation
  document.addEventListener('change', function(e) {
    if (e.target.type === 'file' && e.target.closest('#uploaderModal')) {
      var f = e.target.files[0];
      if (!f) return;
      var area = e.target.closest('.up-area');
      if (area) { var txt = area.querySelector('.up-atext'); if (txt) { txt.textContent = '✓ '+f.name; txt.classList.add('ready'); } }
      var slot = e.target.closest('.up-slot');
      if (slot) { var st = slot.querySelector('.up-status'); if (st) st.innerHTML = ''; }
    }
  });

  // X — slot გასუფთავება — delegation
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('up-xbtn')) {
      var slot = e.target.closest('.up-slot');
      if (!slot) return;
      var inp = slot.querySelector('input[type=file]');
      if (inp) inp.value = '';
      var txt = slot.querySelector('.up-atext');
      if (txt) { txt.textContent = '📁 არჩიე'; txt.classList.remove('ready'); }
      var st = slot.querySelector('.up-status');
      if (st) st.innerHTML = '';
    }
  });

  // Custom slot დამატება
  var addCustomBtn = document.getElementById('upAddCustomBtn');
  if (addCustomBtn) addCustomBtn.addEventListener('click', function() {
    var pathVal = (document.getElementById('upCustomPath').value || '').trim();
    if (!pathVal) return;
    var name = pathVal.split('/').pop();
    var slot = document.createElement('div');
    slot.className = 'up-slot'; slot.dataset.path = pathVal;
    slot.innerHTML = '<div class="up-slot-top"><span class="up-sname">'+name+'</span><button class="up-xbtn" style="position:relative;z-index:1;">✕</button></div><div class="up-spath">'+pathVal+'</div><label class="up-area"><input type="file"><div class="up-atext">📁 არჩიე</div></label><div class="up-status"></div>';
    document.getElementById('upCustomSlots').appendChild(slot);
    document.getElementById('upCustomPath').value = '';
  });

  // ↑ ატვირთვა
  var uploadBtn = document.getElementById('upUploadBtn');
  if (uploadBtn) uploadBtn.addEventListener('click', async function() {
    var token = (document.getElementById('upToken').value || '').trim();
    if (!token) { alert('Token შეიყვანე!'); return; }
    var logEl = document.getElementById('upLog');
    if (logEl) { logEl.innerHTML = ''; logEl.style.display = 'none'; }
    var slots = Array.from(document.querySelectorAll('#uploaderModal .up-slot')).filter(function(s) {
      var inp = s.querySelector('input[type=file]'); return inp && inp.files[0];
    });
    if (!slots.length) { upLog('ფაილები არ არჩეულა', 'err'); return; }
    var wrap = document.getElementById('upProgressWrap');
    var bar = document.getElementById('upProgressBar');
    if (wrap) wrap.style.display = 'block';
    if (bar) bar.style.width = '0%';
    var done = 0, uploaded = 0;
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var path = slot.dataset.path;
      upLog('↑ '+path, 'info');
      try {
        var res = await upUploadFile(slot, token);
        done++;
        if (bar) bar.style.width = (done/slots.length*100)+'%';
        if (res === 'ok') { upSetSlotStatus(slot, '✓ ატვირთულია', true); upLog('✓ '+path, 'ok'); uploaded++; }
        else if (res === 'skip') { upLog('— '+path+' (გამოტოვდა)', 'info'); }
        else { upSetSlotStatus(slot, '✗ შეცდომა', false); upLog('✗ '+path, 'err'); }
      } catch(e) { upSetSlotStatus(slot, '✗ შეცდომა', false); upLog('✗ '+path+' — '+e.message, 'err'); }
    }
    upLog('━━━ '+uploaded+'/'+slots.length+' ━━━', 'info');
    setTimeout(function() { if (wrap) wrap.style.display = 'none'; if (bar) bar.style.width = '0%'; }, 3000);
  });

  // ✕ გასუფთავება
  var clearAllBtn = document.getElementById('upClearAllBtn');
  if (clearAllBtn) clearAllBtn.addEventListener('click', function() {
    document.querySelectorAll('#uploaderModal .up-slot').forEach(function(slot) {
      var inp = slot.querySelector('input[type=file]'); if (inp) inp.value = '';
      var txt = slot.querySelector('.up-atext'); if (txt) { txt.textContent = '📁 არჩიე'; txt.classList.remove('ready'); }
      var st = slot.querySelector('.up-status'); if (st) st.innerHTML = '';
    });
    var logEl = document.getElementById('upLog'); if (logEl) { logEl.innerHTML = ''; logEl.style.display = 'none'; }
  });
});
