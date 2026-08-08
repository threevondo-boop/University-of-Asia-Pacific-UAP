/* notes.js
   Notes page — Firestore theke note ene card e dekhay, filter,
   sort, ar pagination kore.
*/

(function () {

    var PER_PAGE = 12;
    var all = [];
    var view = [];
    var page = 1;

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }


    /* https ছাড়া kono URL ke bishash kori na. Database e kono */
    function safeUrl(u) {
        if (typeof u !== "string" || !u) return "";
        // https:// full URL (Cloudinary / Drive) — thik ache
        if (/^https:\/\//i.test(u)) return u;
        // notes-data.js-er relative path (jemon "notes-pdf/x.pdf") —
        // eta amader nijer repo-r file, tai eta-o thik ache.
        // Kintu "javascript:", "data:" etc kokhono na.
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u)) return "";
        return u;
    }

    function when(ts) {
        if (!ts || !ts.toDate) return "";
        return ts.toDate().toLocaleDateString("en-GB",
            { day:"numeric", month:"short", year:"numeric" });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var grid = document.getElementById("noteGrid");

        /* Firestore-er reply asha porjonto shimmer card dekhai — */
        grid.innerHTML = new Array(6).fill('<div class="note-skeleton"></div>').join("");

        if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") {
            grid.innerHTML = emptyState("⚠️", "Firebase failed to load.", "Check your internet connection.");
            return;
        }
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        ["noteSearch","noteSemester","noteBatch","noteSort"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener("input", function () { page = 1; apply(); });
        });

        // notes-data.js-er hate likha note gula age nei — Firestore
        // fail korleo eigulo dekhabe.
        all = staticNotes();
        apply();

        firebase.firestore().collection("notes").get()
            .then(function (snap) {
                var live = [];
                snap.forEach(function (d) {
                    var n = d.data(); n._id = d.id;
                    n.url = safeUrl(n.url);
                    n.download = safeUrl(n.download) || n.url;
                    if (n.url) live.push(n);   // bad URL hole dekhabo na
                });
                all = staticNotes().concat(live);
                apply();
            })
            .catch(function () {
                // Firestore na pele-o static note gula to ache
                apply();
            });
    });

    /* notes-data.js theke hate likha note gula normalize kore ney,
       jate Firestore-er note-er shathe ekshathe kaj kore. */
    /* Drive-er share link (.../view?usp=sharing) iframe e khule na —
       embed korte hole .../preview lagbe. Ekhane automatic convert
       kore dei, jate notes-data.js e Drive theke copy kora link ta
       shorashori paste kore dile-i kaj kore. */
    function driveEmbed(u) {
        var m = String(u).match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/) ||
                String(u).match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
        if (!m) return null;
        return {
            preview: "https://drive.google.com/file/d/" + m[1] + "/preview",
            download: "https://drive.google.com/uc?export=download&id=" + m[1]
        };
    }

    function staticNotes() {
        if (typeof STATIC_NOTES === "undefined") return [];
        return STATIC_NOTES.map(function (n) {
            var u = safeUrl(n.url);
            if (!u) return null;

            var read = u, dl = u;
            if (/drive\.google\.com/i.test(u)) {
                var d = driveEmbed(u);
                if (d) { read = d.preview; dl = d.download; }
            }

            return {
                title: n.title, subject: n.subject,
                semester: n.semester, batch: n.batch,
                author: n.author, url: read, download: dl,
                displayDate: n.date,
                createdAt: n.date ? { seconds: Date.parse(n.date + "T00:00:00") / 1000 } : null
            };
        }).filter(Boolean);
    }

    function emptyState(icon, title, sub) {
        return '<div class="empty-state" style="grid-column:1/-1;">' +
               '<span class="empty-icon">' + icon + '</span>' +
               '<b>' + title + '</b><br><small>' + sub + '</small></div>';
    }

    function apply() {
        var q    = (document.getElementById("noteSearch").value || "").trim().toLowerCase();
        var sem  = document.getElementById("noteSemester").value;
        var bat  = document.getElementById("noteBatch").value;
        var sort = document.getElementById("noteSort").value;

        view = all.filter(function (n) {
            if (sem && n.semester !== sem) return false;
            if (bat && String(n.batch) !== bat) return false;
            if (!q) return true;
            return [n.title, n.subject, n.author].join(" ").toLowerCase().indexOf(q) !== -1;
        });

        view.sort(function (a, b) {
            if (sort === "az") return String(a.title).localeCompare(String(b.title));
            var ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return sort === "old" ? ta - tb : tb - ta;
        });

        render();
    }

    function render() {
        var grid  = document.getElementById("noteGrid");
        var pager = document.getElementById("notePager");

        if (!view.length) {
            grid.innerHTML = all.length
                ? emptyState("🔍", "No results found.", "Try changing the filters.")
                : emptyState("📄", "No notes yet.", "Notes added by admins will appear here.");
            pager.innerHTML = "";
            return;
        }

        var pages = Math.ceil(view.length / PER_PAGE);
        if (page > pages) page = pages;
        var slice = view.slice((page - 1) * PER_PAGE, page * PER_PAGE);

        grid.innerHTML = slice.map(function (n) {
            var size = n.sizeMB ? n.sizeMB + " MB" : (n.source === "drive" ? "Drive" : "PDF");
            return '' +
            '<article class="note-card">' +
              '<div class="note-meta">' +
                '<span class="pill">' + esc(n.subject) + '</span>' +
                '<span class="pill neutral">Batch ' + esc(n.batch) + '</span>' +
                '<span class="pill neutral">' + esc(n.semester) + '</span>' +
              '</div>' +
              '<h3>' + esc(n.title) + '</h3>' +
              '<p class="note-sub">' +
                 esc(n.author) + ' &middot; ' + esc(size) +
                 (n.createdAt ? ' &middot; ' + when(n.createdAt) : '') +
              '</p>' +
              '<div class="note-actions">' +
                '<a href="#" data-read="' + esc(n.url) + '" data-title="' + esc(n.title) + '" ' +
                   'data-dl="' + esc(n.download || n.url) + '">📖 Read</a>' +
                '<a href="' + esc(n.download || n.url) + '" target="_blank" rel="noopener">⬇ Download</a>' +
              '</div>' +
            '</article>';
        }).join("");

        grid.querySelectorAll("[data-read]").forEach(function (a) {
            a.addEventListener("click", function (e) {
                e.preventDefault();
                uapOpenPdf(a.dataset.read, a.dataset.title, a.dataset.dl);
            });
        });

        buildPager(pages);
    }

    function buildPager(pages) {
        var pager = document.getElementById("notePager");
        if (pages <= 1) { pager.innerHTML = ""; return; }

        var html = '<button ' + (page === 1 ? "disabled" : "") + ' data-go="' + (page - 1) + '">← Prev</button>';
        for (var i = 1; i <= pages; i++) {
            if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - page) > 1) {
                if (i === 3) html += '<span class="pager-info">…</span>';
                continue;
            }
            html += '<button ' + (i === page ? 'aria-current="true"' : '') +
                    ' data-go="' + i + '">' + i + '</button>';
        }
        html += '<button ' + (page === pages ? "disabled" : "") + ' data-go="' + (page + 1) + '">Next →</button>';
        html += '<span class="pager-info">' + view.length + ' notes</span>';
        pager.innerHTML = html;

        pager.querySelectorAll("[data-go]").forEach(function (b) {
            b.addEventListener("click", function () {
                page = +b.dataset.go;
                render();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });
    }

})();
