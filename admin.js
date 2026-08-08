/* admin.js
   Admin panel-er shob logic — access check, upload, listing,
   student submission approve/reject, report resolve.
*/

(function () {

    var db = null;
    var me = null;

    /* ============================================================
       1. GATE
       ============================================================ */
    document.addEventListener("DOMContentLoaded", function () {

        var gate    = document.getElementById("gateScreen");
        var gateMsg = document.getElementById("gateMessage");
        var gateAct = document.getElementById("gateActions");
        var app     = document.getElementById("adminApp");

        if (typeof firebase === "undefined") {
            gateMsg.textContent = "Firebase failed to load. Check your internet connection and reload the page.";
            gateAct.style.display = "flex";
            return;
        }
        if (typeof firebaseConfig === "undefined") {
            gateMsg.textContent = "firebase-config.js is missing its config values.";
            return;
        }

        // "Checking your access..." e ATKE thakle jate keu bujhte
        // pare kichu ekta bhul hoyeche, tar jonno 8 second por-o
        // gate na sorle ekta clear error dekhabo — chirokal
        // spinner-e atke thakbe na.
        var settled = false;
        var timeoutId = setTimeout(function () {
            if (settled) return;
            settled = true;
            gateMsg.innerHTML =
                "This is taking longer than expected.<br>" +
                "<small>Reload the page. If it keeps happening, open your browser's " +
                "console (F12) and share the red error text.</small>";
            gateAct.style.display = "flex";
        }, 8000);

        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        } catch (initErr) {
            settled = true;
            clearTimeout(timeoutId);
            gateMsg.textContent = "Firebase setup error: " + initErr.message;
            gateAct.style.display = "flex";
            return;
        }

        firebase.auth().onAuthStateChanged(function (user) {
            if (settled) return;   // timeout already fired, don't fight it
            settled = true;
            clearTimeout(timeoutId);

            if (!user) {
                gateMsg.textContent = "This page is for admins only. Sign in first.";
                gateAct.style.display = "flex";
                return;
            }
            if (!uapIsAdmin(user.email)) {
                gateMsg.innerHTML =
                    "<b>" + esc(user.email) + "</b> is not an admin account.<br>" +
                    "If you meant to use a different account, sign out and try again.";
                gateAct.style.display = "flex";
                return;
            }

            // Admin confirmed — show the panel FIRST. Firestore setup
            // happens after, wrapped safely, so even if Firestore has
            // a problem the panel is still visible instead of stuck
            // on this loading screen.
            me = user;
            gate.style.display = "none";
            app.style.display  = "block";
            document.getElementById("adminWho").textContent =
                "Signed in as " + user.email;

            checkConfigBanner();
            var nDateEl = document.getElementById("nDate");
            var qDateEl = document.getElementById("qDate");
            if (nDateEl) nDateEl.value = todayISO();
            if (qDateEl) qDateEl.value = todayISO();
            var gDateEl = document.getElementById("gDate");
            if (gDateEl) gDateEl.value = todayISO();

            try {
                db = firebase.firestore();
            } catch (fsErr) {
                document.getElementById("adminWho").innerHTML +=
                    '<br><span class="status-line error">Firestore did not load: ' +
                    esc(fsErr.message) + '</span>';
                return;
            }

            loadNotes();
            loadQuestions();
            loadGallery();
            loadPending();
            loadReports();
            refreshDatalists();
        }, function (authErr) {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            gateMsg.textContent = "Sign-in check failed: " + authErr.message;
            gateAct.style.display = "flex";
        });
    });

    /* ============================================================
       2. HELPERS
       ============================================================ */
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }

    function safeUrl(u) {
        return (typeof u === "string" && /^https:\/\//i.test(u)) ? u : "";
    }

    function when(ts) {
        if (!ts || !ts.toDate) return "just now";
        var d = ts.toDate();
        var days = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (days === 0) return "today";
        if (days === 1) return "yesterday";
        if (days < 30) return days + " days ago";
        return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
    }

    function say(id, msg, kind) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.className = "status-line" + (kind ? " " + kind : "");
    }

    function progress(id, pct) {
        var bar = document.getElementById(id);
        if (!bar) return;
        if (pct === null) { bar.classList.remove("active"); bar.firstElementChild.style.width = "0%"; return; }
        bar.classList.add("active");
        bar.firstElementChild.style.width = pct + "%";
    }

    /* Drop-zone gulo ke click + drag-drop + explicit "Choose file" */
    function wireDrop(zoneId, inputId, chooseId, onPick) {
        var zone   = document.getElementById(zoneId);
        var input  = document.getElementById(inputId);
        var choose = chooseId ? document.getElementById(chooseId) : null;
        if (!zone || !input) return;

        zone.addEventListener("click", function (e) {
            if (choose && e.target === choose) return;  // button nijer click handle korbe
            input.click();
        });
        if (choose) {
            choose.addEventListener("click", function (e) {
                e.stopPropagation();
                input.click();
            });
        }

        zone.addEventListener("dragover", function (e) {
            e.preventDefault(); zone.classList.add("dragover");
        });
        zone.addEventListener("dragleave", function () {
            zone.classList.remove("dragover");
        });
        zone.addEventListener("drop", function (e) {
            e.preventDefault();
            zone.classList.remove("dragover");
            input.files = e.dataTransfer.files;
            onPick(input.files);
        });
        input.addEventListener("change", function () { onPick(input.files); });
    }

    function fileLabel(zoneId, files, fallback) {
        var zone = document.getElementById(zoneId);
        if (!zone) return;
        var strong = zone.querySelector("strong");
        if (!files || !files.length) { strong.textContent = fallback; return; }
        if (files.length === 1) {
            strong.textContent = "✅ " + files[0].name + "  (" + uapHumanSize(files[0].size) + ")";
        } else {
            strong.textContent = "✅ " + files.length + " files selected";
        }
    }

    /* Aj-er tarikh — date field default value hishebe use hoy */
    function todayISO() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + day;
    }

    /* Cloudinary configure kora ache kina check kore banner */
    function checkConfigBanner() {
        var banner = document.getElementById("configBanner");
        if (!banner) return;
        var ready = (typeof cloudinaryReady === "function") && cloudinaryReady();
        banner.style.display = ready ? "none" : "flex";
    }

    /* Admin dashboard-er upore stat box gulo update kore */
    function setStat(id, n) {
        var el = document.getElementById(id);
        if (el) el.textContent = n;
    }

    /* ============================================================
       3. NOTES
       ============================================================ */
    wireDropOnReady("nDrop", "nFile", "nChoose", "Drop the PDF here");

    function wireDropOnReady(zoneId, inputId, chooseId, fallback) {
        document.addEventListener("DOMContentLoaded", function () {
            wireDrop(zoneId, inputId, chooseId, function (files) {
                fileLabel(zoneId, files, fallback);
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("nSave");
        if (btn) btn.addEventListener("click", saveNote);
    });

    function saveNote() {
        var title   = document.getElementById("nTitle").value.trim();
        var subject = document.getElementById("nSubject").value.trim();
        var sem     = document.getElementById("nSemester").value.trim();
        var batch   = document.getElementById("nBatch").value.trim();
        var author  = document.getElementById("nAuthor").value.trim();
        var date    = document.getElementById("nDate").value || todayISO();
        var drive   = document.getElementById("nDrive").value.trim();
        var files   = document.getElementById("nFile").files;

        if (!title)   { say("nStatus", "Title is required.", "error"); return; }
        if (!subject) { say("nStatus", "Subject is required.", "error"); return; }
        if (!author)  { say("nStatus", "Enter whose note this is.", "error"); return; }
        if (!drive && (!files || !files.length)) {
            say("nStatus", "Select a PDF, or provide a Drive link.", "error"); return;
        }

        var btn = document.getElementById("nSave");
        btn.disabled = true;

        var base = {
            title: title,
            subject: subject,
            semester: sem,
            batch: batch,
            author: author,
            displayDate: date,
            uploadedBy: me.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        /* Drive link deya thakle Cloudinary bad — direct Drive. */
        if (drive) {
            var parsed = uapDriveLink(drive);
            if (!parsed) {
                say("nStatus", "Couldn't recognize that Drive link. Paste the '.../file/d/…/view' format.", "error");
                btn.disabled = false; return;
            }
            base.source   = "drive";
            base.url      = parsed.preview;
            base.download = parsed.download;
            base.sizeMB   = null;

            say("nStatus", "Saving…");
            db.collection("notes").add(base)
                .then(afterNoteSaved)
                .catch(function (e) { say("nStatus", e.message, "error"); btn.disabled = false; });
            return;
        }

        /* Chhoto PDF -> Cloudinary */
        say("nStatus", "Uploading…");
        progress("nProgress", 0);

        uapUpload(files[0], cloudinaryConfig.folders.notes, function (p) {
            progress("nProgress", p);
        }).then(function (res) {
            base.source   = "cloudinary";
            base.url      = res.url;
            base.download = res.url;
            base.sizeMB   = +(res.bytes / 1024 / 1024).toFixed(2);
            base.pages    = res.pages || null;
            base.publicId = res.publicId;
            return db.collection("notes").add(base);
        }).then(afterNoteSaved)
          .catch(function (e) {
            progress("nProgress", null);
            say("nStatus", e.message, "error");
            btn.disabled = false;
        });
    }

    function afterNoteSaved() {
        progress("nProgress", null);
        say("nStatus", "✅ Note published — it will now appear on the Notes page.", "success");
        ["nTitle","nSubject","nAuthor","nDrive"].forEach(function (id) {
            document.getElementById(id).value = "";
        });
        document.getElementById("nFile").value = "";
        document.getElementById("nDate").value = todayISO();
        fileLabel("nDrop", null, "Drop the PDF here");
        document.getElementById("nSave").disabled = false;
        loadNotes();
    }

    function loadNotes() {
        var body = document.getElementById("notesRows");
        db.collection("notes").orderBy("createdAt", "desc").limit(60).get()
            .then(function (snap) {
                setStat("statNotes", snap.size);
                if (snap.empty) {
                    body.innerHTML = '<tr><td colspan="5">No notes yet.</td></tr>';
                    return;
                }
                body.innerHTML = "";
                snap.forEach(function (doc) {
                    var n = doc.data();
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        '<td><b>' + esc(n.title) + '</b><br>' +
                        '<span class="pill neutral">' + esc(n.source === "drive" ? "Drive" : "Cloudinary") + '</span> ' +
                        (n.sizeMB ? '<span class="pill neutral">' + n.sizeMB + ' MB</span>' : '') + '</td>' +
                        '<td>' + esc(n.subject) + '<br><small>' + esc(n.author) + '</small></td>' +
                        '<td>' + esc(n.batch) + '</td>' +
                        '<td>' + when(n.createdAt) + '</td>' +
                        '<td><div class="row-actions">' +
                        '<button class="btn-sm" data-open="' + esc(safeUrl(n.url)) + '" data-title="' + esc(n.title) + '">Open</button>' +
                        '<button class="btn-sm btn-no" data-del="' + doc.id + '">Delete</button>' +
                        '</div></td>';
                    body.appendChild(tr);
                });

                body.querySelectorAll("[data-open]").forEach(function (b) {
                    b.addEventListener("click", function () {
                        uapOpenPdf(b.dataset.open, b.dataset.title);
                    });
                });
                body.querySelectorAll("[data-del]").forEach(function (b) {
                    b.addEventListener("click", function () {
                        if (!confirm("Delete this note?")) return;
                        db.collection("notes").doc(b.dataset.del).delete().then(loadNotes);
                    });
                });
            })
            .catch(function (e) {
                body.innerHTML = '<tr><td colspan="5">Load holo na: ' + esc(e.message) + '</td></tr>';
            });
    }

    /* ============================================================
       4. QUESTION PAPERS
       ============================================================ */
    wireDropOnReady("qDrop", "qFile", "qChoose", "Drop question paper photos here");

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("qSave");
        if (btn) btn.addEventListener("click", saveQuestion);
    });

    function saveQuestion() {
        var subject = document.getElementById("qSubject").value.trim();
        var files   = document.getElementById("qFile").files;
        if (!subject) { say("qStatus", "Subject is required.", "error"); return; }
        if (!files.length) { say("qStatus", "Select at least one image.", "error"); return; }

        var meta = {
            semester: document.getElementById("qSemester").value.trim(),
            exam:     document.getElementById("qExam").value.trim(),
            subject:  subject,
            batch:    document.getElementById("qBatch").value.trim(),
            section:  document.getElementById("qSection").value.trim() || null,
            set:      document.getElementById("qSet").value.trim() || null,
            displayDate: document.getElementById("qDate").value || todayISO()
        };

        var btn = document.getElementById("qSave");
        btn.disabled = true;
        say("qStatus", "Uploading 1 of " + files.length + "…");
        progress("qProgress", 0);

        var list = Array.prototype.slice.call(files);
        var done = 0;

        function next() {
            if (!list.length) {
                progress("qProgress", null);
                say("qStatus", "✅ " + done + " paper(s) published.", "success");
                document.getElementById("qFile").value = "";
                document.getElementById("qDate").value = todayISO();
                fileLabel("qDrop", null, "Drop question paper photos here");
                btn.disabled = false;
                loadQuestions();
                refreshDatalists();
                return;
            }
            var f = list.shift();
            say("qStatus", "Uploading " + (done + 1) + " of " + (done + 1 + list.length) + "…");

            uapUpload(f, cloudinaryConfig.folders.questions, function (p) {
                progress("qProgress", p);
            }).then(function (res) {
                var doc = Object.assign({}, meta, {
                    url: res.url,
                    publicId: res.publicId,
                    page: done + 1,
                    status: "approved",
                    uploadedBy: me.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return db.collection("questions").add(doc);
            }).then(function () {
                done++; next();
            }).catch(function (e) {
                progress("qProgress", null);
                say("qStatus", e.message, "error");
                btn.disabled = false;
            });
        }
        next();
    }

    function loadQuestions() {
        var body = document.getElementById("questionRows");
        db.collection("questions").orderBy("createdAt", "desc").limit(40).get()
            .then(function (snap) {
                setStat("statQuestions", snap.size);
                if (snap.empty) {
                    body.innerHTML = '<tr><td colspan="5">Nothing added yet.</td></tr>';
                    return;
                }
                body.innerHTML = "";
                snap.forEach(function (doc) {
                    var q = doc.data();
                    var label = q.semester + " · " + q.exam + " · " + q.subject +
                                (q.section ? " · Sec " + q.section : "") +
                                (q.set ? " · Set " + q.set : "");
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        '<td><a href="' + esc(safeUrl(q.url)) + '" target="_blank" rel="noopener">' + esc(label) + '</a></td>' +
                        '<td>' + esc(q.batch) + '</td>' +
                        '<td><small>' + esc(q.uploadedBy) + '</small></td>' +
                        '<td>' + when(q.createdAt) + '</td>' +
                        '<td><button class="btn-sm btn-no" data-del="' + doc.id + '">Delete</button></td>';
                    body.appendChild(tr);
                });
                body.querySelectorAll("[data-del]").forEach(function (b) {
                    b.addEventListener("click", function () {
                        if (!confirm("Delete this?")) return;
                        db.collection("questions").doc(b.dataset.del).delete().then(loadQuestions);
                    });
                });
            })
            .catch(function (e) {
                body.innerHTML = '<tr><td colspan="5">Load holo na: ' + esc(e.message) + '</td></tr>';
            });
    }

    /* ============================================================
       5. GALLERY
       ============================================================ */
    wireDropOnReady("gDrop", "gFile", "gChoose", "Drop photos here");

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("gSave");
        if (btn) btn.addEventListener("click", saveGallery);
    });

    function saveGallery() {
        var caption = document.getElementById("gCaption").value.trim();
        var files   = document.getElementById("gFile").files;
        if (!files.length) { say("gStatus", "Select a photo.", "error"); return; }

        var btn = document.getElementById("gSave");
        btn.disabled = true;
        progress("gProgress", 0);

        var list = Array.prototype.slice.call(files);
        var done = 0;

        function next() {
            if (!list.length) {
                progress("gProgress", null);
                say("gStatus", "✅ " + done + " photo(s) added to the gallery.", "success");
                document.getElementById("gCaption").value = "";
                document.getElementById("gFile").value = "";
                document.getElementById("gDate").value = todayISO();
                fileLabel("gDrop", null, "Drop photos here");
                btn.disabled = false;
                loadGallery();
                return;
            }
            var f = list.shift();
            say("gStatus", "Uploading " + (done + 1) + " of " + (done + 1 + list.length) + "…");

            uapUpload(f, cloudinaryConfig.folders.gallery, function (p) {
                progress("gProgress", p);
            }).then(function (res) {
                return db.collection("gallery").add({
                    title: document.getElementById("gTitle").value.trim() || "Untitled",
                    displayDate: document.getElementById("gDate").value || todayISO(),
                    caption: caption || f.name.replace(/\.[^.]+$/, ""),
                    url: res.url,
                    publicId: res.publicId,
                    width: res.width,
                    height: res.height,
                    uploadedBy: me.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }).then(function () { done++; next(); })
              .catch(function (e) {
                progress("gProgress", null);
                say("gStatus", e.message, "error");
                btn.disabled = false;
            });
        }
        next();
    }

    function loadGallery() {
        var body = document.getElementById("galleryRows");
        db.collection("gallery").orderBy("createdAt", "desc").limit(60).get()
            .then(function (snap) {
                setStat("statGallery", snap.size);
                if (snap.empty) {
                    body.innerHTML = '<tr><td colspan="4">Gallery is empty.</td></tr>';
                    return;
                }
                body.innerHTML = "";
                snap.forEach(function (doc) {
                    var g = doc.data();
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        '<td><img src="' + esc(safeUrl(g.url)) + '" alt="" style="width:64px;height:64px;object-fit:cover;' +
                        'border-radius:8px;margin:0;"></td>' +
                        '<td>' + esc(g.caption) + '</td>' +
                        '<td>' + when(g.createdAt) + '</td>' +
                        '<td><button class="btn-sm btn-no" data-del="' + doc.id + '">Delete</button></td>';
                    body.appendChild(tr);
                });
                body.querySelectorAll("[data-del]").forEach(function (b) {
                    b.addEventListener("click", function () {
                        if (!confirm("Delete this?")) return;
                        db.collection("gallery").doc(b.dataset.del).delete().then(loadGallery);
                    });
                });
            })
            .catch(function (e) {
                body.innerHTML = '<tr><td colspan="4">Load holo na: ' + esc(e.message) + '</td></tr>';
            });
    }

    /* ============================================================
       6. PENDING (student submissions)
       ============================================================ */
    function loadPending() {
        var body = document.getElementById("pendingRows");
        db.collection("submissions").where("status", "==", "pending")
          .orderBy("createdAt", "desc").limit(50).get()
            .then(function (snap) {
                document.getElementById("pendingCount").textContent =
                    snap.size ? "(" + snap.size + ")" : "";
                setStat("statPending", snap.size);
                if (snap.empty) {
                    body.innerHTML = '<tr><td colspan="5">Nothing pending — all clear. 🎉</td></tr>';
                    return;
                }
                body.innerHTML = "";
                snap.forEach(function (doc) {
                    var s = doc.data();
                    var label = (s.kind === "gallery")
                        ? "🖼 Gallery · " + (s.title || "Untitled") +
                          (s.displayDate ? " · " + s.displayDate : "")
                        : s.semester + " · " + s.exam + " · " + s.subject +
                          " · Batch " + s.batch +
                          (s.section ? " · Sec " + s.section : "");
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        '<td><img src="' + esc(safeUrl(s.url)) + '" alt="" style="width:60px;height:76px;object-fit:cover;' +
                        'border-radius:6px;margin:0;cursor:zoom-in;" data-zoom="' + esc(safeUrl(s.url)) + '"></td>' +
                        '<td>' + esc(label) + (s.note ? '<br><small>' + esc(s.note) + '</small>' : '') + '</td>' +
                        '<td><small>' + esc(s.submittedBy) + '</small></td>' +
                        '<td>' + when(s.createdAt) + '</td>' +
                        '<td><div class="row-actions">' +
                        '<button class="btn-sm btn-ok" data-ok="' + doc.id + '">Approve</button>' +
                        '<button class="btn-sm btn-no" data-no="' + doc.id + '">Reject</button>' +
                        '</div></td>';
                    body.appendChild(tr);
                });

                body.querySelectorAll("[data-zoom]").forEach(function (im) {
                    im.addEventListener("click", function () { window.open(im.dataset.zoom, "_blank"); });
                });

                body.querySelectorAll("[data-ok]").forEach(function (b) {
                    b.addEventListener("click", function () { decide(b.dataset.ok, true); });
                });
                body.querySelectorAll("[data-no]").forEach(function (b) {
                    b.addEventListener("click", function () { decide(b.dataset.no, false); });
                });
            })
            .catch(function (e) {
                body.innerHTML = '<tr><td colspan="5">Could not load: ' + esc(e.message) +
                    '<br><small>May need a Firestore index — click the link in the error to auto-create it.</small></td></tr>';
            });
    }

    /* Approve korle submission ta "questions" collection e copy hoy, */
    function decide(id, approve) {
        var ref = db.collection("submissions").doc(id);
        ref.get().then(function (doc) {
            var s = doc.data();
            if (!approve) {
                return ref.update({
                    status: "rejected",
                    reviewedBy: me.email,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            var target, payload;
            if (s.kind === "gallery") {
                target = "gallery";
                payload = {
                    title: s.title || "Untitled",
                    caption: s.caption || null,
                    displayDate: s.displayDate || null,
                    url: s.url, publicId: s.publicId || null,
                    uploadedBy: s.submittedBy,
                    approvedBy: me.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
            } else {
                target = "questions";
                payload = {
                    semester: s.semester, exam: s.exam, subject: s.subject,
                    batch: s.batch, section: s.section || null, set: s.set || null,
                    url: s.url, publicId: s.publicId || null, page: 1,
                    status: "approved",
                    uploadedBy: s.submittedBy,
                    approvedBy: me.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
            }
            return db.collection(target).add(payload).then(function () {
                return ref.update({
                    status: "approved",
                    reviewedBy: me.email,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        }).then(function () {
            loadPending(); loadQuestions(); loadGallery();
        }).catch(function (e) { alert("Failed: " + e.message); });
    }

    /* ============================================================
       7. REPORTS
       ============================================================ */
    function loadReports() {
        var body = document.getElementById("reportRows");
        db.collection("reports").orderBy("createdAt", "desc").limit(50).get()
            .then(function (snap) {
                var open = 0;
                body.innerHTML = "";
                snap.forEach(function (doc) {
                    var r = doc.data();
                    if (r.resolved) return;
                    open++;
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        '<td><span class="pill warn">' + esc(r.type) + '</span></td>' +
                        '<td>' + esc(r.message) + '</td>' +
                        '<td><small>' + esc(r.page) + '</small></td>' +
                        '<td><small>' + esc(r.email) + '</small><br><small>' + when(r.createdAt) + '</small></td>' +
                        '<td><button class="btn-sm btn-ok" data-fix="' + doc.id + '">Resolve</button></td>';
                    body.appendChild(tr);
                });
                document.getElementById("reportCount").textContent = open ? "(" + open + ")" : "";
                setStat("statReports", open);
                if (!open) body.innerHTML = '<tr><td colspan="5">No open reports. 🎉</td></tr>';

                body.querySelectorAll("[data-fix]").forEach(function (b) {
                    b.addEventListener("click", function () {
                        db.collection("reports").doc(b.dataset.fix).update({
                            resolved: true,
                            resolvedBy: me.email,
                            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(loadReports);
                    });
                });
            })
            .catch(function (e) {
                body.innerHTML = '<tr><td colspan="5">Load holo na: ' + esc(e.message) + '</td></tr>';
            });
    }

    /* 8. DYNAMIC DATALISTS */
    function refreshDatalists() {
        if (!db) return;
        db.collection("questions").limit(300).get().then(function (snap) {
            var sems = {}, exams = {}, subs = {}, batches = {};
            snap.forEach(function (doc) {
                var q = doc.data();
                if (q.semester) sems[q.semester] = 1;
                if (q.exam) exams[q.exam] = 1;
                if (q.subject) subs[q.subject] = 1;
                if (q.batch) batches[q.batch] = 1;
            });
            addOptions("semesterList", Object.keys(sems));
            addOptions("examList", Object.keys(exams));
            addOptions("subjectList", Object.keys(subs));
            addOptions("batchList", Object.keys(batches));
        }).catch(function () { /* datalist shudhu suggestion, fail hole chup thako */ });
    }

    function addOptions(listId, values) {
        var list = document.getElementById(listId);
        if (!list) return;
        var existing = {};
        list.querySelectorAll("option").forEach(function (o) {
            existing[o.value] = 1;
        });
        values.forEach(function (v) {
            if (!v || existing[v]) return;
            existing[v] = 1;
            var opt = document.createElement("option");
            opt.value = v;
            list.appendChild(opt);
        });
    }

    /* ============================================================
       9. TABS
       ============================================================ */
    document.addEventListener("DOMContentLoaded", function () {
        var tabs = document.querySelectorAll(".admin-tabs button");
        tabs.forEach(function (btn) {
            btn.addEventListener("click", function () {
                tabs.forEach(function (b) { b.classList.remove("active"); });
                document.querySelectorAll(".admin-panel").forEach(function (p) {
                    p.classList.remove("active");
                });
                btn.classList.add("active");
                var panel = document.getElementById(btn.dataset.panel);
                if (panel) panel.classList.add("active");
            });
        });
    });

})();
