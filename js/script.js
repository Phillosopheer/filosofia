// ---- FIREBASE CONFIG & INIT ----
const firebaseConfig = {
    apiKey: "AIzaSyCLDlXXqAgJp5SdE_xefzS1sQ2fHI-l1Tg",
    authDomain: "gen-lang-client-0339684222.firebaseapp.com",
    databaseURL: "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com",
    projectId: "gen-lang-client-0339684222",
    storageBucket: "gen-lang-client-0339684222.appspot.com",
    messagingSenderId: "339684222",
    appId: "1:339684222:web:YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ---- CONFIG ----
const FIREBASE_DB   = "https://gen-lang-client-0339684222-default-rtdb.firebaseio.com";
const FIREBASE_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts";
const API_KEY       = "AIzaSyCLDlXXqAgJp5SdE_xefzS1sQ2fHI-l1Tg";

// ---- STATE ----
let idToken    = null;
let currentUid = null;
let notes      = [];
let currentCat = null;
let currentNote = null;
let allGlossaryTerms = [];
let currentGlossaryTerm = null;

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
    }
];

// ---- PHILOSOPHER QUOTES ----
const philosopherQuotes = [
    // ნიცშე
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
    // სოკრატე
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
    // ბლეზ პასკალი
    { text: "ადამიანი ლერწამია, უმწეო ლერწამი, მაგრამ ეს ლერწამი აზროვნებს. მთელი ჩვენი ღირსება აზროვნებაა.", author: "ბლეზ პასკალი" },
    { text: "ადამიანი არის ყველაფერი არარაობასთან შედარებით და არარაობა უსასრულობასთან შედარებით.", author: "ბლეზ პასკალი" },
    // რენე დეკარტი
    { text: "ფილოსოფია ერთადერთი რამაა ისეთი, რითაც ველურებისა და ბარბაროსებისგან განვსხვავდებით.", author: "რენე დეკარტი" },
    // შალვა ნუცუბიძე
    { text: "ფილოსოფოსობის სიძნელე იმაშია, რომ ადამიანი დარჩე და ადამიანის მირმურს სწვდე.", author: "შალვა ნუცუბიძე" },
    // ეპიკურე
    { text: "ახალგაზრდობაში ნურვინ დააყოვნებს ფილოსოფოსობას, მოხუცობის ჟამს ნურვინ მოიღლება ფილოსოფოსობაში.", author: "ეპიკურე" },
    // აბრამ ჰეშელი
    { text: "ადამიანად ყოფნა ნიშნავს იყო ადამიანი იმაზე მეტი ვიდრე ადამიანია.", author: "აბრამ ჰეშელი" },
    // სენეკა
    { text: "ფილოსოფიამ გვასწავლა ჩვენ ადამიანების სიყვარული.", author: "სენეკა" },
    // ფრენსის ბეკონი
    { text: "ზერელედ მიწოდებული ფილოსოფია გვაშორებს რელიგიას, სიღრმისეული ფილოსოფია კი გვაბრუნებს მის წიაღში.", author: "ფრენსის ბეკონი" },
    // პავლე მოციქული
    { text: "სიბრძნე ამა სოფლისაი სიცოფე არს წინაშე ღვთისა.", author: "პავლე მოციქული" },
    // ნიცშე (წიგნიდან)
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

// ---- WAVE FADE ANIMATION (optimized - CSS only) ----
function waveFadeText(element, text) {
    const lines = text.split('|');
    element.innerHTML = lines.join('<br>');
    element.classList.add('wave-anim');
}

// ---- PUBLIC SUBMISSION ----
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

// Submission editor toolbar helpers
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

        const res = await fetch(`${FIREBASE_DB}/pending-notes.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
        });
        
        if (!res.ok) throw new Error('გაგზავნა ვერ მოხერხდა');

        showMsg(sucEl, '✓ სტატია გაგზავნილია! ადმინისტრატორი მალე განიხილავს.', true);
        
        // Clear form
        document.getElementById('submissionTitle').value = '';
        document.getElementById('submissionAuthor').value = '';
        document.getElementById('submissionArea').innerHTML = '';

        setTimeout(() => {
            closeModal('publicSubmissionModal');
            showMsg(sucEl, '', false);
        }, 2000);

    } catch (err) {
        showMsg(errEl, 'შეცდომა: ' + err.message, true);
    } finally {
        btn.disabled  = false;
        btn.innerText = 'გაგზავნა';
    }
}

// ---- PENDING PANEL (ADMIN ONLY) ----
async function fetchPendingNotes() {
    if (!idToken) {
        console.log('fetchPendingNotes: No idToken, skipping');
        return;
    }
    try {
        console.log('Fetching pending notes...');
        const res = await fetch(`${FIREBASE_DB}/pending-notes.json?auth=${idToken}`);
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
        
        // Update badge
        const badge = document.getElementById('pendingBadge');
        
        // Only show badge if there are pending notes
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
    
    // Fetch latest pending notes
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
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="previewPendingNote('${note.fbId}')" style="padding:8px 16px; background:var(--surface); border:1px solid var(--border); border-radius:8px; color:var(--text); cursor:pointer; font-size:0.85rem; transition:0.3s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">👁 ნახვა</button>
                        <button onclick="editPendingNote('${note.fbId}')" style="padding:8px 16px; background:var(--surface); border:1px solid var(--border); border-radius:8px; color:var(--accent); cursor:pointer; font-size:0.85rem; transition:0.3s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">✏️ რედაქტირება</button>
                        <button onclick="approvePendingNote('${note.fbId}')" style="padding:8px 16px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:8px; color:#22c55e; cursor:pointer; font-size:0.85rem; font-weight:600; transition:0.3s;" onmouseover="this.style.background='rgba(34,197,94,0.2)'" onmouseout="this.style.background='rgba(34,197,94,0.1)'">✅ დადასტურება</button>
                        <button onclick="rejectPendingNote('${note.fbId}')" style="padding:8px 16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; color:#ef4444; cursor:pointer; font-size:0.85rem; transition:0.3s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">❌ უარყოფა</button>
                    </div>
                `;
                
                list.appendChild(card);
            });
    }

    openModal('pendingModal');
}

function previewPendingNote(noteId) {
    const note = pendingNotes.find(n => n.fbId === noteId);
    if (!note) return;
    
    // Close pending modal first
    closeModal('pendingModal');
    
    // Create a preview version with date field
    const previewNote = { 
        ...note, 
        date: note.submittedDate || note.date || Date.now() 
    };
    
    // Use existing reader to preview
    openReader(previewNote);
}

function editPendingNote(noteId) {
    const note = pendingNotes.find(n => n.fbId === noteId);
    if (!note) return;
    
    // Set currentNote and open edit modal
    currentNote = { ...note, pending: true };
    openEditModal();
    closeModal('pendingModal');
}

async function approvePendingNote(noteId) {
    if (!idToken) return;
    if (!confirm('დაადასტურო ეს სტატია?')) return;

    try {
        const note = pendingNotes.find(n => n.fbId === noteId);
        if (!note) throw new Error('სტატია არ მოიძებნა');

        // Create approved note (remove pending flag, add date)
        const approved = { ...note };
        delete approved.pending;
        delete approved.submittedDate;
        delete approved.fbId;
        approved.date = Date.now();

        // Add to /notes
        const addRes = await fetch(`${FIREBASE_DB}/notes.json?auth=${idToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(approved)
        });
        if (!addRes.ok) throw new Error('დადასტურება ვერ მოხერხდა');

        // Delete from /pending-notes
        const delRes = await fetch(`${FIREBASE_DB}/pending-notes/${noteId}.json?auth=${idToken}`, {
            method: 'DELETE'
        });
        if (!delRes.ok) throw new Error('წაშლა pending-დან ვერ მოხერხდა');

        // Refresh
        await fetchPendingNotes();
        await fetchNotes();
        openPendingPanel();

    } catch (err) {
        alert('შეცდომა: ' + err.message);
    }
}

async function rejectPendingNote(noteId) {
    if (!idToken) return;
    if (!confirm('უარყო ეს სტატია? ის სამუდამოდ წაიშლება.')) return;

    try {
        const res = await fetch(`${FIREBASE_DB}/pending-notes/${noteId}.json?auth=${idToken}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('წაშლა ვერ მოხერხდა');

        await fetchPendingNotes();
        openPendingPanel();

    } catch (err) {
        alert('შეცდომა: ' + err.message);
    }
}

// ---- INIT ----
function init() {
    // Always hide glossary add button on load
    const addBtn = document.getElementById('glossaryAddBtn');
    if (addBtn) addBtn.style.display = 'none';
    
    // Restore session from localStorage if exists - WITH SECURITY CHECKS
    const savedToken = localStorage.getItem('idToken');
    const savedUid = localStorage.getItem('currentUid');
    const savedEmail = localStorage.getItem('userEmail');
    const sessionTimestamp = parseInt(localStorage.getItem('sessionTimestamp') || '0');
    
    // Check if session exists
    if (savedToken && savedUid && sessionTimestamp) {
        // SECURITY CHECK 1: Check if token expired (7 days)
        const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const sessionAge = Date.now() - sessionTimestamp;
        
        if (sessionAge > sevenDays) {
            // Token expired - clear everything and logout
            console.log('🔒 Session expired (7+ days old) - auto logout');
            clearSession();
            idToken = null;
            currentUid = null;
        } else {
            // Token not expired - restore session
            idToken = savedToken;
            currentUid = savedUid;
            
            // Restore UI state
            if (savedEmail) {
                const badge = document.getElementById('userBadge');
                badge.innerText = savedEmail.split('@')[0];
                badge.style.display = 'inline-block';
            }
            
            document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>';
            document.getElementById('logoutBtn').classList.add('active');
            document.body.classList.add('admin-mode');
            
            // SECURITY CHECK 2: Validate token with Firebase in background
            validateToken(savedToken);
        }
    } else {
        idToken = null;
        currentUid = null;
    }
    
    // Pre-check saved category to prevent flash effect on page load
    const preSavedCatId = localStorage.getItem('lastCategoryId');
    if (preSavedCatId) {
        // Try to find the category (works because categories is already defined)
        const preSavedCat = categories.find(c => c.id === preSavedCatId);
        if (preSavedCat) {
            currentCat = preSavedCat;
            // Hide home content immediately to prevent flash
            document.getElementById('heroBook').style.display = 'none';
            document.querySelector('.welcome-text').style.display = 'none';
            document.getElementById('quoteSection').style.display = 'none';
            document.getElementById('homeSection').style.display = 'none';
            document.querySelector('.hero').classList.add('no-bg');
            // Don't render yet - fetchNotes will handle it
            // This just prevents goHome() from being called and home content from showing
        }
    }
    
    displayRandomQuote(); // Display random Nietzsche quote on load
    updateHeaderButtons(); // Set initial header button visibility
    fetchNotes();
    fetchGlossary();
    
    // Fetch pending notes if logged in
    if (idToken) {
        fetchPendingNotes();
    }
    
    // Start wave fade animation on page title (| = line break)
    const titleElement = document.getElementById('pageTitle');
    waveFadeText(titleElement, 'ჩვენ გვიყვარს|ფილოსოფია');
}

function goHome() {
    currentCat = null;
    
    // Always hide glossary add button
    const addBtn = document.getElementById('glossaryAddBtn');
    if (addBtn) addBtn.style.display = 'none';
    
    localStorage.removeItem('lastCategoryId');
    
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
    const pt = document.getElementById('pageTitle'); 
    pt.classList.add('shimmer');
    document.getElementById('pageSubtitle').innerText = '';
    document.getElementById('heroBook').style.display = 'block';
    document.querySelector('.welcome-text').style.display = 'block';
    document.getElementById('quoteSection').style.display = 'block';
    document.querySelector('.hero').classList.remove('no-bg');
    displayRandomQuote(); // Show new random quote each time
    document.getElementById('notesGrid').innerHTML = '';
    document.getElementById('searchBar').style.display = 'none';
    document.getElementById('homeSection').style.display = 'block';
    updateFab();
    renderHomeCats();
    initCarousel();
    
    // Restart wave fade animation (| = line break)
    waveFadeText(pt, 'ჩვენ გვიყვარს|ფილოსოფია');
}

function renderHomeCats() {
    // no-op: category cards removed, using clock only
}

// ---- CATEGORY LIST ----
// Colorful ripple effect function
function createRipple(element, e, color) {
    const rect = element.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let x, y;
    if (e.touches && e.touches.length > 0) {
        // Touch event
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        // Mouse event
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
    
    // Different colors for each category
    const colors = [
        'rgba(167, 139, 250, 0.6)', // Purple - ეთიკა
        'rgba(129, 140, 248, 0.6)', // Blue - მეტაფიზიკა
        'rgba(244, 114, 182, 0.6)', // Pink - ეპისტემოლოგია
        'rgba(251, 146, 60, 0.6)',  // Orange - ლოგიკა
        'rgba(52, 211, 153, 0.6)',  // Green - ესთეტიკა
        'rgba(248, 113, 113, 0.6)', // Red - სოციალური
        'rgba(96, 165, 250, 0.6)'   // Light blue - პოლიტიკური
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
        
        // Get color for this category
        const categoryColor = colors[index % colors.length];
        
        // Add touch/click ripple effect
        d.addEventListener('click', (e) => {
            createRipple(d, e, categoryColor);
            
            // Brief color flash
            d.style.background = categoryColor.replace('0.6', '0.3');
            setTimeout(() => {
                if (!d.classList.contains('active')) {
                    d.style.background = '';
                }
            }, 300);
            
            document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
            d.classList.add('active');
            currentCat = c;
            
            // Save current category to localStorage for page refresh
            localStorage.setItem('lastCategoryId', c.id);
            
            toggleMenu();
            renderNotes();
        });
        
        list.appendChild(d);
    });
}

// ---- FETCH NOTES ----
async function fetchNotes() {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '<div class="spinner"></div>';
    try {
        const res  = await fetch(`${FIREBASE_DB}/notes.json`);
        if (!res.ok) throw new Error('ჩატვირთვა ვერ მოხერხდა');
        const data = await res.json();
        notes = data
            ? Object.entries(data).map(([k, v]) => ({ ...v, fbId: k }))
            : [];
        buildCatList();
        
        // Check localStorage FIRST before making any navigation decisions
        const lastCatId = localStorage.getItem('lastCategoryId');
        
        // If we have a saved category and currentCat is not set, restore it
        if (!currentCat && lastCatId) {
            // Find the saved category
            const savedCat = categories.find(c => c.id === lastCatId);
            if (savedCat) {
                currentCat = savedCat;
                
                // Highlight the category in the menu
                const catElement = document.getElementById('cat_' + lastCatId);
                if (catElement) {
                    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
                    catElement.classList.add('active');
                }
                
                renderNotes();
                return; // Don't call goHome() - we found saved category
            }
        }
        
        // Only now, if no currentCat and no saved category, go home
        if (!currentCat) goHome();
        else renderNotes();
    } catch (err) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>${err.message}</p></div>`;
    }
}

// ---- RENDER NOTES ----
function renderNotes(filtered_override) {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';
    // Always hide glossary add button
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
            
            // Add 3D parallax effect on hover (only on devices with hover support)
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
                // Mobile: Add ripple effect on touch
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
            
            // Build card HTML with optional cover image
            let cardHTML = '';
            if (n.coverUrl) {
                cardHTML += `<img src="${n.coverUrl}" style="width:120%; height:250px; object-fit:cover; object-position:center; border-radius:12px 12px 0 0; margin:-20px -35px 16px -35px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />`;
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

// ---- OPEN READER ----
function openReader(note) {
    currentNote = note;
    const cat = categories.find(c => c.id === note.cat);

    document.getElementById('readCat').innerText   = cat ? cat.name : '';
    document.getElementById('readTitle').innerText = note.title || 'უსახელო';
    document.getElementById('readDate').innerText  = note.date
        ? new Date(note.date).toLocaleDateString('ka-GE', { year:'numeric', month:'long', day:'numeric' })
        : '';
    
    // Display author if available
    const authorEl = document.getElementById('readAuthor');
    if (note.author) {
        authorEl.innerText = `✍️ ${note.author}`;
        authorEl.style.display = 'block';
    } else {
        authorEl.innerText = '';
        authorEl.style.display = 'none';
    }

    // Display cover image if available
    const coverContainer = document.getElementById('readCover');
    if (note.coverUrl) {
        coverContainer.innerHTML = `<img src="${note.coverUrl}" style="width:100%; max-height:500px; object-fit:contain; border-radius:16px; margin-bottom:30px;" />`;
    } else {
        coverContainer.innerHTML = '';
    }

    // Safe HTML rendering — only admin can post, so content is trusted
    // but we still sanitize basic script tags
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
}

// ---- DELETE NOTE ----
async function deleteCurrentNote() {
    if (!currentNote || !idToken) return;
    if (!confirm(`წაიშალოს "${currentNote.title}"?`)) return;

    try {
        const res = await fetch(`${FIREBASE_DB}/notes/${currentNote.fbId}.json?auth=${idToken}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('წაშლა ვერ მოხერხდა');
        closeReader();
        await fetchNotes();
    } catch (err) {
        alert(err.message);
    }
}

// ---- AUTH ----
function handleAuthBtn() {
    openModal('loginModal');
    
    // Check if locked out
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

    // ---- LOCKOUT CHECK ----
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
            // Count failed attempt
            const newFails = failCount + 1;
            localStorage.setItem('loginFails', newFails);

            if (newFails >= 2) {
                const until = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
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

        // Success — clear lockout data
        localStorage.removeItem('loginFails');
        localStorage.removeItem('lockUntil');

        idToken    = data.idToken;
        currentUid = data.localId;

        // Save to localStorage with timestamp for security
        localStorage.setItem('idToken', data.idToken);
        localStorage.setItem('currentUid', data.localId);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('sessionTimestamp', Date.now().toString()); // Track session age

        const badge = document.getElementById('userBadge');
        badge.innerText = data.email.split('@')[0];
        badge.style.display = 'inline-block';

        document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>';
        document.getElementById('lockBtn').setAttribute('title', 'შესვლა');
        document.getElementById('logoutBtn').classList.add('active');
        document.body.classList.add('admin-mode');
        closeModal('loginModal');
        updateFab();
        updateHeaderButtons();
        fetchPendingNotes(); // Load pending submissions

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
    
    // Clear localStorage
    localStorage.removeItem('idToken');
    localStorage.removeItem('currentUid');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('sessionTimestamp'); // Clear session timestamp too
    
    // Update lock icon to locked state
    document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    
    // Update button title
    document.getElementById('lockBtn').setAttribute('title', 'შესვლა');
    
    // Hide logout button
    document.getElementById('logoutBtn').classList.remove('active');
    
    // Hide user badge
    document.getElementById('userBadge').style.display = 'none';
    
    // Remove admin mode
    document.body.classList.remove('admin-mode');
    
    // Update FAB
    updateFab();
    
    // Update header buttons
    updateHeaderButtons();
    
    // Refresh notes to show only public view
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

// ---- SECURITY HELPERS ----
function clearSession() {
    // Clear all session data from localStorage
    localStorage.removeItem('idToken');
    localStorage.removeItem('currentUid');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('sessionTimestamp');
    
    // Reset global variables
    idToken = null;
    currentUid = null;
    
    // Update UI
    document.getElementById('lockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    document.getElementById('logoutBtn').classList.remove('active');
    document.getElementById('userBadge').style.display = 'none';
    document.body.classList.remove('admin-mode');
    
    updateFab();
    updateHeaderButtons();
}

async function validateToken(token) {
    // Validate token with Firebase in background
    // This checks if token is still valid on Firebase servers
    try {
        // Try to fetch user data with the token
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        
        if (!res.ok) {
            // Token invalid - force logout
            console.log('🔒 Token validation failed - forcing logout');
            clearSession();
            alert('⚠️ სესია არავალიდურია. გთხოვთ ხელახლა შეხვიდეთ.');
            fetchNotes(); // Refresh to public view
        }
        // If ok, token is valid - do nothing, user stays logged in
    } catch (err) {
        // Network error - don't logout, just log the error
        console.log('Token validation failed due to network error:', err);
    }
}

// ---- EDITOR ----
function openEditor() {
    if (!idToken) { openModal('loginModal'); return; }
    document.getElementById('editorTitle').value = '';
    document.getElementById('editorArea').innerHTML  = '';
    if (currentCat) document.getElementById('editorCat').value = currentCat.id;
    showMsg(document.getElementById('editorError'), '', false);
    showMsg(document.getElementById('editorSuccess'), '', false);
    openModal('editorModal');
}

// Rich text formatting commands
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

// ---- COVER IMAGE FUNCTIONS ----
function removeCoverImage() {
    if (!currentNote) return;
    if (!confirm('ნამდვილად გსურთ სურათის წაშლა?')) return;
    
    // Clear the cover URL from current note
    currentNote.coverUrl = null;
    
    // Clear preview and inputs
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
        
        // Use URL if provided
        if (coverUrlInput) {
            coverUrl = coverUrlInput;
        }

        const note = { title, cat, content, date: Date.now() };
        if (coverUrl) note.coverUrl = coverUrl;
        if (author) note.author = author;

        const res = await fetch(`${FIREBASE_DB}/notes.json?auth=${idToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Firebase-ის შეცდომა');
        }

        // Success!
        showMsg(sucEl, '✓ ჩანაწერი შენახულია!', true);
        
        await fetchNotes();

        // Clear form
        document.getElementById('editorTitle').value = '';
        document.getElementById('editorArea').innerHTML = '';
        document.getElementById('editorAuthor').value = '';
        const coverUrlEl = document.getElementById('coverUrl');
        if (coverUrlEl) coverUrlEl.value = '';
        const coverPreviewEl = document.getElementById('coverPreview');
        if (coverPreviewEl) coverPreviewEl.innerHTML = '';

        // Close modal and switch to category after short delay
        setTimeout(() => {
            showMsg(sucEl, '', false);
            showMsg(errEl, '', false);
            closeModal('editorModal');
            
            // Auto-switch to saved category
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

// ---- UTILS ----
// Helper functions for carousel
function getCategoryLabel(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'ზოგადი';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ka-GE', { year:'numeric', month:'long', day:'numeric' });
}

// ---- FEATURED CAROUSEL ----
let carouselInterval = null;
let currentSlide = 0;
let carouselNotes = [];

function initCarousel() {
    // Get all notes (up to 6)
    carouselNotes = notes.slice(0, 6);
    if (carouselNotes.length === 0) return;

    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!track || !dotsContainer) return;
    
    // Clear previous content
    track.innerHTML = '';
    dotsContainer.innerHTML = '';

    // Create carousel cards
    carouselNotes.forEach((note, index) => {
        const card = document.createElement('div');
        card.style.cssText = `
            min-width: 100%;
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;
        
        // Add cover image if available
        let coverHTML = '';
        if (note.coverUrl) {
            coverHTML = `<img src="${note.coverUrl}" style="width:100%; height:300px; object-fit:contain; border-radius:12px; margin-bottom:10px; background:var(--surface);" />`;
        }
        
        card.innerHTML = `
            ${coverHTML}
            <p style="color:var(--accent); font-size:0.7rem; font-weight:600; letter-spacing:2px; text-transform:uppercase;">${getCategoryLabel(note.cat)}</p>
            <h4 style="font-family:'Cormorant Garamond', serif; font-size:1.6rem; font-weight:600; color:var(--text); line-height:1.3;">${note.title}</h4>
            ${note.author ? `<p style="color:var(--accent); font-size:0.8rem; font-weight:600; margin-top:-8px;">✍️ ${note.author}</p>` : ''}
            <p style="color:var(--text-dim); font-size:0.85rem; line-height:1.6;">${getExcerpt(note.content)}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:15px; border-top:1px solid var(--border);">
                <span style="color:var(--text-dim); font-size:0.75rem;">${formatDate(note.date)}</span>
                <span style="color:var(--accent); font-size:0.85rem; font-weight:600;">კითხვა →</span>
            </div>
        `;
        
        card.addEventListener('click', () => openReader(note));
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.borderColor = 'var(--accent)';
            card.style.boxShadow = '0 10px 30px var(--glow)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.borderColor = 'var(--border)';
            card.style.boxShadow = 'none';
        });
        
        track.appendChild(card);

        // Create dot
        const dot = document.createElement('div');
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${index === 0 ? 'var(--accent)' : 'var(--border)'};
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    // Only start auto-scroll if there are 2+ articles
    if (carouselNotes.length >= 2) {
        startCarousel();
    } else {
        // If only 1 article, make the dot spin/pulse
        const dot = dotsContainer.firstChild;
        if (dot) {
            dot.style.animation = 'pulse 2s ease-in-out infinite';
            // Add pulse animation to head if not exists
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
    carouselInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
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
    setTimeout(startCarousel, 10000); // Resume auto-scroll after 10s
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots').children;
    
    if (!track) return;
    
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update dots
    Array.from(dots).forEach((dot, index) => {
        dot.style.background = index === currentSlide ? 'var(--accent)' : 'var(--border)';
        dot.style.width = index === currentSlide ? '20px' : '8px';
    });
}

function getExcerpt(html) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
}

// ---- SEARCH ----
function filterNotes() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!currentCat) return;
    const filtered = notes.filter(n => {
        if (n.cat !== currentCat.id) return false;
        
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        
        // Remove HTML tags from content for better search
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

// ---- COPY NOTE ----
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

// ---- OPEN EDIT MODAL ----
function openEditModal() {
    if (!currentNote || !idToken) return;
    document.getElementById('editTitle').value       = currentNote.title || '';
    document.getElementById('editCat').value        = currentNote.cat   || 'epist';
    document.getElementById('editArea').innerHTML   = currentNote.content || '';
    document.getElementById('editCoverUrl').value   = currentNote.coverUrl || '';
    document.getElementById('editAuthor').value     = currentNote.author || '';
    
    // Show existing cover image if available
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

// Edit toolbar helpers
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

// ---- UPDATE NOTE ----
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
        
        // Update author
        if (author) {
            updated.author = author;
        } else {
            delete updated.author; // Remove author if empty
        }
        
        // Use URL if provided
        if (coverUrlInput) {
            updated.coverUrl = coverUrlInput;
        }
        // If coverUrl was set to null (by removeCoverImage), keep it null
        else if (currentNote.coverUrl === null) {
            delete updated.coverUrl; // Remove coverUrl property entirely
        }
        
        delete updated.fbId;

        // Determine endpoint based on pending status
        const endpoint = currentNote.pending 
            ? `${FIREBASE_DB}/pending-notes/${currentNote.fbId}.json?auth=${idToken}`
            : `${FIREBASE_DB}/notes/${currentNote.fbId}.json?auth=${idToken}`;

        const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!res.ok) throw new Error('Firebase-ის შეცდომა');

        currentNote = { ...updated, fbId: currentNote.fbId };
        showMsg(sucEl, '✓ განახლდა!', true);
        showMsg(errEl, '', false);

        // Reader-შიც განვაახლოთ
        document.getElementById('readTitle').innerText = title;
        document.getElementById('readBody').innerHTML  = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        
        // Update cover image in reader
        const coverContainer = document.getElementById('readCover');
        if (coverContainer) {
            if (updated.coverUrl) {
                coverContainer.innerHTML = `<img src="${updated.coverUrl}" style="width:100%; max-height:500px; object-fit:contain; border-radius:16px; margin-bottom:30px;" />`;
            } else {
                coverContainer.innerHTML = '';
            }
        }
        
        // Update author in reader
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

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
        if (e.target === m) m.classList.remove('active');
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        if (document.getElementById('reader').style.display === 'block') closeReader();
        if (document.getElementById('glossaryView').classList.contains('active')) closeGlossary();
        if (document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    }
});

// Block right-click for non-admins
document.addEventListener('contextmenu', e => {
    if (!idToken) e.preventDefault();
});

// ---- LOGO SECRET UNBLOCK (10 clicks) ----
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

// ===== GLOSSARY FUNCTIONS =====
async function fetchGlossary() {
    try {
        const res = await fetch(`${FIREBASE_DB}/glossary.json`);
        if (!res.ok) throw new Error('Failed to fetch glossary');
        const data = await res.json();
        
        allGlossaryTerms = data ? Object.keys(data).map(key => ({
            ...data[key],
            fbId: key
        })) : [];
        
        // Sort alphabetically
        allGlossaryTerms.sort((a, b) => a.term.localeCompare(b.term, 'ka'));
        
        updateGlossaryCount();
    } catch (err) {
        console.error('Error fetching glossary:', err);
        allGlossaryTerms = [];
    }
}

function updateGlossaryCount() {
    const countEl = document.getElementById('glossaryCount');
    if (countEl) {
        countEl.innerText = allGlossaryTerms.length;
    }
}

function openGlossary() {
    document.getElementById('glossaryView').classList.add('active');
    document.getElementById('glossarySearchInput').focus();
    document.getElementById('termDisplay').style.display = 'none';
    document.getElementById('glossaryInitialView').style.display = 'block';
    document.getElementById('glossarySearchInput').value = '';
    document.getElementById('suggestionDropdown').classList.remove('active');
    toggleMenu();

    // Hide main FAB, show glossary add button for admin
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = 'none';
    const addBtn = document.getElementById('glossaryAddBtn');
    if (addBtn) addBtn.style.display = idToken ? 'flex' : 'none';
}

function closeGlossary() {
    document.getElementById('glossaryView').classList.remove('active');
    const addBtn = document.getElementById('glossaryAddBtn');
    if (addBtn) addBtn.style.display = 'none';
    // Restore main FAB if admin is in category view
    updateFab();
}

function searchGlossary() {
    const query = document.getElementById('glossarySearchInput').value.trim().toLowerCase();
    const dropdown = document.getElementById('suggestionDropdown');
    
    if (!query) {
        dropdown.classList.remove('active');
        return;
    }
    
    // Filter terms
    const filtered = allGlossaryTerms.filter(term =>
        term.term.toLowerCase().includes(query)
    );
    
    if (filtered.length === 0) {
        dropdown.classList.remove('active');
        fetchGeminiDefinition(query);
        return;
    }
    
    // Display suggestions
    dropdown.innerHTML = filtered.slice(0, 8).map(term => `
        <div class="suggestion-item" onclick="showTerm('${term.fbId}')">
            <div class="suggestion-term">${term.term}</div>
            <div class="suggestion-preview">${term.definition.substring(0, 100)}...</div>
        </div>
    `).join('');
    
    dropdown.classList.add('active');
}

function showTerm(termId) {
    const term = allGlossaryTerms.find(t => t.fbId === termId);
    if (!term) return;
    
    currentGlossaryTerm = term;
    
    // Hide search, show term
    document.getElementById('glossaryInitialView').style.display = 'none';
    document.getElementById('suggestionDropdown').classList.remove('active');
    document.getElementById('termDisplay').style.display = 'block';
    
    // Populate term details
    document.getElementById('termTitle').innerText = term.term;
    document.getElementById('termDefinition').innerText = term.definition;
    
    if (term.category) {
        document.getElementById('termCategory').innerText = term.category;
        document.getElementById('termCategory').style.display = 'inline-block';
    } else {
        document.getElementById('termCategory').style.display = 'none';
    }
    
    // Show admin controls if logged in
    if (idToken) {
        document.getElementById('glossaryAdminControls').classList.add('active');
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
        
        const res = await fetch(`${FIREBASE_DB}/glossary.json?auth=${idToken}`, {
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
        
        const res = await fetch(`${FIREBASE_DB}/glossary/${currentGlossaryTerm.fbId}.json?auth=${idToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        
        if (!res.ok) throw new Error('Firebase error');
        
        showMsg(sucEl, '✓ განახლდა!', true);
        
        // Update display
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
        const res = await fetch(`${FIREBASE_DB}/glossary/${currentGlossaryTerm.fbId}.json?auth=${idToken}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Firebase error');
        
        await fetchGlossary();
        backToGlossarySearch();
        
    } catch (err) {
        alert('წაშლა ვერ მოხერხდა: ' + err.message);
    }
}

init();


// ===== GEMINI DEFINITION FUNCTION =====
const GEMINI_KEYS = [
    "AIzaSyCC-6NDbrusfvXHQWJH9UpjjMd-JjaPupM",
    "AIzaSyBFCbcZm9SR-UniFAbL-omt9k1KYpLb2DI",
    "AIzaSyBxwuE_FN_zdpWgW9PCIE7_ToM8lllV6rA"
];

let geminiKeyIndex = 0;
let geminiTimer = null;

async function fetchGeminiDefinition(word) {
    const loading = document.getElementById('aiGlossaryLoading');
    const dropdown = document.getElementById('suggestionDropdown');

    // debounce — დაველოდოთ აკრეფის დასრულებას
    clearTimeout(geminiTimer);
    geminiTimer = setTimeout(async () => {
        loading.style.display = 'block';
        dropdown.classList.remove('active');

        const prompt = `განმარტე ეს სიტყვა ან ტერმინი ქართულად, მოკლედ და გასაგებად (მაქსიმუმ 4 წინადადება): "${word}". 
თუ ფილოსოფიური ტერმინია — მიუთითე საიდან მოდის. პასუხი მხოლოდ ქართულად.`;

        let success = false;
        let attempts = 0;

        while (!success && attempts < GEMINI_KEYS.length) {
            const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${key}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    }
                );

                if (res.status === 429 || res.status === 403) {
                    // ეს key ამოიწურა, შემდეგზე გადავიდეთ
                    geminiKeyIndex++;
                    attempts++;
                    continue;
                }

                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                    // შედეგი dropdown-ში ვაჩვენოთ
                    dropdown.innerHTML = `
                        <div class="suggestion-item" style="cursor:default;">
                            <div class="suggestion-term" style="margin-bottom:8px;">${word}</div>
                            <div class="suggestion-preview" style="line-height:1.7; font-size:0.88rem; color:var(--text);">${text.replace(/\n/g, '<br>')}</div>
                        </div>`;
                    dropdown.classList.add('active');
                    success = true;
                }

            } catch (err) {
                geminiKeyIndex++;
                attempts++;
            }
        }

        if (!success) {
            dropdown.innerHTML = '<div class="no-results">განმარტება ვერ მოიძებნა</div>';
            dropdown.classList.add('active');
        }

        loading.style.display = 'none';
    }, 800); // 800ms დაველოდოთ აკრეფის დასრულებას
}
