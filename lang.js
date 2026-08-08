/* lang.js
   English / Bangla toggle. Notun text translate korte hole:
   HTML e data-i18n="key" bosao, ar niche DICT.en + DICT.bn e
   shei key add koro.
*/

(function () {
    const root = document.documentElement;

    const DICT = {
        en: {
            "nav.home": "Home",
            "nav.questions": "Previous Questions",
            "nav.notes": "Notes",
            "nav.upload": "Upload",
            "nav.gallery": "Gallery",
            "nav.about": "About",
            "nav.contact": "Contact",
            "nav.updates": "Updates",
            "nav.report": "🚩 Report",
            "nav.signin": "🔒 Sign in",

            "footer.tagline": "Previous questions, organized by semester & batch.",
            "footer.copy_prefix": "Made with",
            "footer.copy_suffix": "for UAP students",

            "home.eyebrow": "University of Asia Pacific",
            "home.title": "Every past question,<br>one organized archive.",
            "home.subtitle": "Browse CT, Mid and Final question papers by semester, explore campus photos, and stop digging through scattered group chats for study material.",
            "home.cta.questions": "📚 Previous Questions",
            "home.cta.notes": "📄 Notes",
            "home.cta.gallery": "🏛 Gallery",
            "home.card.questions.title": "📚 Previous Questions",
            "home.card.questions.desc": "All 8 semesters, organized by CT, Mid and Final exams — searchable in seconds.",
            "home.card.gallery.title": "🖼 Gallery",
            "home.card.gallery.desc": "Photos, zoomable and downloadable, all in one clean strip.",
            "home.card.signin.title": "🔐 Student Sign-in",
            "home.card.signin.desc": "Sign in with your UAP email to unlock Previous Questions and the Gallery.",
            "home.card.updates.title": "🔔 Check out for updates",
            "home.card.updates.desc": "New semesters and exam types get added regularly — see what's changed.",
            "home.card.open": "Open →",

            "notes.eyebrow": "Study Material",
            "notes.title": "Notes",
            "notes.subtitle": "Handnotes and slides shared by students — open and read right here, no download needed.",
            "notes.search.placeholder": "Search title, subject or name…",
            "notes.filter.allSemesters": "All semesters",
            "notes.filter.allBatches": "All batches",
            "notes.sort.newest": "Newest first",
            "notes.sort.oldest": "Oldest first",
            "notes.sort.az": "Title A–Z",
            "notes.empty.title": "No notes yet.",
            "notes.empty.sub": "Notes added by admins will appear here.",
            "notes.noResults.title": "No results found.",
            "notes.noResults.sub": "Try changing the filters.",
            "notes.card.read": "📖 Read",
            "notes.card.download": "⬇ Download",

            "upload.eyebrow": "Help the archive grow",
            "upload.title": "Upload a question paper",
            "upload.subtitle": "Have a paper of your own? Upload it — once an admin approves it, everyone gets it.",
            "upload.form.title": "Upload",
            "upload.signinPrompt": "Sign in first to upload.",
            "upload.button": "Send for review",

            "gallery.eyebrow": "Gallery",
            "gallery.title": "Photo Gallery",
            "gallery.subtitle": "Click any photo to zoom in & download.",

            "about.eyebrow": "About",
            "about.title": "About This Archive",

            "contact.eyebrow": "Contact",
            "contact.title": "Get In Touch",
            "contact.subtitle": "Found a missing paper or have a question? Reach out below.",

            "signin.eyebrow": "Student Sign-in",
            "signin.title": "Sign in with your UAP email",
            "signin.subtitle": "Sign in to unlock Previous Questions and the Gallery.",
            "signin.button": "🔐 Sign in with Google",

            "semester.eyebrow": "Question Archive",
            "semester.title": "Choose Your Semester",
            "semester.subtitle": "Select a semester to see CT, Mid and Final question papers.",

            "report.eyebrow": "Feedback",
            "report.title": "Report a Problem",
            "report.subtitle": "Broken link, missing paper, wrong subject, anything else — let us know.",

            "notfound.eyebrow": "404",
            "notfound.title": "This page couldn't be found",
            "notfound.subtitle": "The link may be old, or the page may have moved. Start again below.",

            "updates.eyebrow": "What's New",
            "updates.title": "Updates",
            "updates.subtitle": "A running log of what's changed on the archive.",
        },

        bn: {
            "nav.home": "হোম",
            "nav.questions": "পুরনো প্রশ্ন",
            "nav.notes": "নোটস",
            "nav.upload": "আপলোড",
            "nav.gallery": "গ্যালারি",
            "nav.about": "সম্পর্কে",
            "nav.contact": "যোগাযোগ",
            "nav.updates": "আপডেট",
            "nav.report": "🚩 রিপোর্ট",
            "nav.signin": "🔒 সাইন ইন",

            "footer.tagline": "সেমিস্টার ও ব্যাচ অনুযায়ী সাজানো পুরনো প্রশ্নপত্র।",
            "footer.copy_prefix": "তৈরি করা হয়েছে",
            "footer.copy_suffix": "UAP শিক্ষার্থীদের জন্য, ভালোবাসা দিয়ে",

            "home.eyebrow": "ইউনিভার্সিটি অফ এশিয়া প্যাসিফিক",
            "home.title": "প্রতিটি পুরনো প্রশ্ন,<br>একটি সাজানো আর্কাইভে।",
            "home.subtitle": "সেমিস্টার অনুযায়ী CT, Mid ও Final প্রশ্নপত্র খুঁজুন, ক্যাম্পাসের ছবি দেখুন — ছড়িয়ে-ছিটিয়ে থাকা গ্রুপ চ্যাটে আর খোঁজাখুঁজি করতে হবে না।",
            "home.cta.questions": "📚 পুরনো প্রশ্ন",
            "home.cta.notes": "📄 নোটস",
            "home.cta.gallery": "🏛 গ্যালারি",
            "home.card.questions.title": "📚 পুরনো প্রশ্ন",
            "home.card.questions.desc": "৮টি সেমিস্টার, CT, Mid ও Final অনুযায়ী সাজানো — সেকেন্ডে খুঁজে নিন।",
            "home.card.gallery.title": "🖼 গ্যালারি",
            "home.card.gallery.desc": "ছবি জুম করে দেখুন ও ডাউনলোড করুন, একটি পরিষ্কার স্ট্রিপে।",
            "home.card.signin.title": "🔐 শিক্ষার্থী সাইন-ইন",
            "home.card.signin.desc": "UAP ইমেইল দিয়ে সাইন ইন করে পুরনো প্রশ্ন ও গ্যালারি আনলক করুন।",
            "home.card.updates.title": "🔔 আপডেটের জন্য দেখুন",
            "home.card.updates.desc": "নিয়মিত নতুন সেমিস্টার ও পরীক্ষার ধরন যুক্ত হচ্ছে — কী পরিবর্তন হলো দেখুন।",
            "home.card.open": "খুলুন →",

            "notes.eyebrow": "পড়াশোনার উপকরণ",
            "notes.title": "নোটস",
            "notes.subtitle": "শিক্ষার্থীদের শেয়ার করা হাতে লেখা নোট ও স্লাইড — এখানেই খুলে পড়ুন, ডাউনলোডের দরকার নেই।",
            "notes.search.placeholder": "শিরোনাম, বিষয় বা নাম খুঁজুন…",
            "notes.filter.allSemesters": "সব সেমিস্টার",
            "notes.filter.allBatches": "সব ব্যাচ",
            "notes.sort.newest": "নতুন আগে",
            "notes.sort.oldest": "পুরনো আগে",
            "notes.sort.az": "শিরোনাম A–Z",
            "notes.empty.title": "এখনো কোনো নোট নেই।",
            "notes.empty.sub": "অ্যাডমিন যোগ করলে এখানে দেখাবে।",
            "notes.noResults.title": "কিছু পাওয়া যায়নি।",
            "notes.noResults.sub": "ফিল্টার পরিবর্তন করে দেখুন।",
            "notes.card.read": "📖 পড়ুন",
            "notes.card.download": "⬇ ডাউনলোড",

            "upload.eyebrow": "আর্কাইভকে বড় হতে সাহায্য করুন",
            "upload.title": "প্রশ্নপত্র আপলোড করুন",
            "upload.subtitle": "আপনার কাছে কোনো প্রশ্নপত্র আছে? আপলোড করুন — অ্যাডমিন অনুমোদন করলে সবাই পেয়ে যাবে।",
            "upload.form.title": "আপলোড",
            "upload.signinPrompt": "আপলোড করতে আগে সাইন ইন করুন।",
            "upload.button": "রিভিউয়ের জন্য পাঠান",

            "gallery.eyebrow": "গ্যালারি",
            "gallery.title": "ফটো গ্যালারি",
            "gallery.subtitle": "জুম করে দেখতে ও ডাউনলোড করতে যেকোনো ছবিতে ক্লিক করুন।",

            "about.eyebrow": "সম্পর্কে",
            "about.title": "এই আর্কাইভ সম্পর্কে",

            "contact.eyebrow": "যোগাযোগ",
            "contact.title": "যোগাযোগ করুন",
            "contact.subtitle": "কোনো প্রশ্নপত্র খুঁজে পাচ্ছেন না বা প্রশ্ন আছে? নিচে যোগাযোগ করুন।",

            "signin.eyebrow": "শিক্ষার্থী সাইন-ইন",
            "signin.title": "আপনার UAP ইমেইল দিয়ে সাইন ইন করুন",
            "signin.subtitle": "পুরনো প্রশ্ন ও গ্যালারি আনলক করতে সাইন ইন করুন।",
            "signin.button": "🔐 Google দিয়ে সাইন ইন করুন",

            "semester.eyebrow": "প্রশ্ন আর্কাইভ",
            "semester.title": "আপনার সেমিস্টার বেছে নিন",
            "semester.subtitle": "CT, Mid ও Final প্রশ্নপত্র দেখতে একটি সেমিস্টার বেছে নিন।",

            "report.eyebrow": "মতামত",
            "report.title": "সমস্যা রিপোর্ট করুন",
            "report.subtitle": "ভাঙা লিংক, না-পাওয়া প্রশ্নপত্র, ভুল বিষয় — যা কিছুই হোক, আমাদের জানান।",

            "notfound.eyebrow": "৪০৪",
            "notfound.title": "এই পেজটি খুঁজে পাওয়া যায়নি",
            "notfound.subtitle": "লিংকটি হয়তো পুরনো, অথবা পেজটি সরে গেছে। নিচে থেকে আবার শুরু করুন।",

            "updates.eyebrow": "নতুন কী আছে",
            "updates.title": "আপডেট",
            "updates.subtitle": "আর্কাইভে কী কী পরিবর্তন হয়েছে তার তালিকা।",
        }
    };

    /* localStorage kichu browser e (incognito / cookie blocked) throw
       kore — try/catch na thakle language toggle purota bhenge jeto. */
    function readStore(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeStore(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
    }

    function currentLang() {
        return readStore("uap-lang") === "bn" ? "bn" : "en";
    }

    function apply(lang) {
        const dict = DICT[lang] || DICT.en;
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            const key = el.getAttribute("data-i18n");
            if (dict[key] === undefined) return;   // key nai — English default-e thak
            el.innerHTML = dict[key];
        });
        // placeholder attribute innerHTML diye bodlano jay na — alada handle
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
            const key = el.getAttribute("data-i18n-placeholder");
            if (dict[key] === undefined) return;
            el.setAttribute("placeholder", dict[key]);
        });
        root.setAttribute("lang", lang === "bn" ? "bn" : "en");

        const btn = document.getElementById("langToggle");
        if (btn) btn.textContent = lang === "bn" ? "EN" : "বাং";
    }

    // Page load-er shathe shathe age-r saved language apply — jate
    // flash na kore (English dekhiye tarpor Bangla-y switch na hoy)
    document.addEventListener("DOMContentLoaded", function () {
        apply(currentLang());

        const btn = document.getElementById("langToggle");
        if (!btn) return;

        btn.addEventListener("click", function () {
            const next = currentLang() === "bn" ? "en" : "bn";
            writeStore("uap-lang", next);
            apply(next);
        });
    });
})();
