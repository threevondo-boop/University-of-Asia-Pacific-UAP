/* upload.js
   Student der upload page — question paper ba gallery photo.
   Duitai "submissions" e pending hoye jay, admin approve korle live.
*/

(function () {

    var db = null, me = null;

    function say(msg, kind) {
        var el = document.getElementById("cStatus");
        el.textContent = msg;
        el.className = "status-line" + (kind ? " " + kind : "");
    }

    function todayISO() {
        var d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function currentType() {
        return document.getElementById("cType").value;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var gate = document.getElementById("cGate");
        var form = document.getElementById("cForm");

        if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") {
            gate.textContent = "Firebase failed to load.";
            gate.className = "status-line error";
            return;
        }
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        document.getElementById("cDate").value = todayISO();

        firebase.auth().onAuthStateChanged(function (user) {
            if (!user) {
                gate.innerHTML = 'Sign in first to upload — <a href="signin.html?redirect=upload.html">sign in here</a>.';
                gate.className = "status-line error";
                form.style.display = "none";
                return;
            }
            me = user;
            db = firebase.firestore();
            gate.textContent = "Signed in as " + user.email;
            gate.className = "status-line success";
            form.style.display = "block";
        });

        // Type bodlale kon field group dekhabe
        document.getElementById("cType").addEventListener("change", function () {
            var isGallery = currentType() === "gallery";
            document.getElementById("cGalleryFields").style.display = isGallery ? "block" : "none";
            document.getElementById("cQuestionFields").style.display = isGallery ? "none" : "block";
            var strong = document.querySelector("#cDrop strong");
            if (strong) strong.textContent = isGallery ? "Photos" : "Question paper photo";
        });

        var zone   = document.getElementById("cDrop");
        var input  = document.getElementById("cFile");
        var choose = document.getElementById("cChoose");

        zone.addEventListener("click", function (e) {
            if (e.target === choose || choose.contains(e.target)) return;
            input.click();
        });
        choose.addEventListener("click", function (e) { e.stopPropagation(); input.click(); });

        zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("dragover"); });
        zone.addEventListener("dragleave", function () { zone.classList.remove("dragover"); });
        zone.addEventListener("drop", function (e) {
            e.preventDefault(); zone.classList.remove("dragover");
            input.files = e.dataTransfer.files; showPick();
        });
        input.addEventListener("change", showPick);

        function showPick() {
            var f = input.files;
            var strong = zone.querySelector("strong");
            var fallback = currentType() === "gallery" ? "Photos" : "Question paper photo";
            if (!f || !f.length) { strong.textContent = fallback; return; }
            strong.textContent = f.length === 1
                ? "✅ " + f[0].name + "  (" + uapHumanSize(f[0].size) + ")"
                : "✅ " + f.length + " files selected";
        }

        document.getElementById("cSend").addEventListener("click", send);
    });

    function send() {
        var type  = currentType();
        var files = document.getElementById("cFile").files;
        if (!files.length) { say("Select at least one image.", "error"); return; }

        var meta;
        if (type === "gallery") {
            var title = document.getElementById("cTitle").value.trim();
            if (!title) { say("Enter a title / event name.", "error"); return; }
            meta = {
                kind: "gallery",
                title: title,
                displayDate: document.getElementById("cDate").value || todayISO(),
                caption: document.getElementById("cCaption").value.trim() || null
            };
        } else {
            var subject = document.getElementById("cSubject").value.trim();
            if (!subject) { say("Enter the subject.", "error"); return; }
            meta = {
                kind: "question",
                semester: document.getElementById("cSemester").value,
                exam:     document.getElementById("cExam").value,
                subject:  subject,
                batch:    document.getElementById("cBatch").value,
                section:  document.getElementById("cSection").value.trim() || null,
                set:      document.getElementById("cSet").value.trim() || null,
                note:     document.getElementById("cNote").value.trim() || null
            };
        }

        var btn = document.getElementById("cSend");
        btn.disabled = true;
        var bar = document.getElementById("cProgress");
        bar.classList.add("active");

        var list = Array.prototype.slice.call(files);
        var done = 0;

        function next() {
            if (!list.length) {
                bar.classList.remove("active");
                bar.firstElementChild.style.width = "0%";
                say("✅ " + done + " file(s) submitted. An admin will review them shortly.", "success");
                document.getElementById("cFile").value = "";
                document.querySelector("#cDrop strong").textContent =
                    type === "gallery" ? "Photos" : "Question paper photo";
                btn.disabled = false;
                return;
            }
            var f = list.shift();
            say("Uploading " + (done + 1) + " of " + (done + 1 + list.length) + "…");

            var folder = type === "gallery"
                ? cloudinaryConfig.folders.gallery
                : cloudinaryConfig.folders.questions;

            uapUpload(f, folder, function (p) {
                bar.firstElementChild.style.width = p + "%";
            }).then(function (res) {
                var doc = Object.assign({}, meta, {
                    url: res.url,
                    publicId: res.publicId,
                    status: "pending",
                    submittedBy: me.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return db.collection("submissions").add(doc);
            }).then(function () { done++; next(); })
              .catch(function (e) {
                bar.classList.remove("active");
                say(e.message, "error");
                btn.disabled = false;
            });
        }
        next();
    }

})();
