/* live-catalog.js
   Admin-er banano notun semester/exam/subject (jar static page
   nai) semester.html-er niche accordion e dekhay.
*/

(function () {

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }

    function safeUrl(u) {
        return (typeof u === "string" && /^https:\/\//i.test(u)) ? u : "";
    }

    document.addEventListener("DOMContentLoaded", function () {
        var host = document.getElementById("liveCatalog");
        if (!host) return;
        if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") return;
        if (typeof firebase.firestore !== "function") return;
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        firebase.auth().onAuthStateChanged(function (user) {
            if (!user) return;   // sign-in gated, same as the rest of the site

            firebase.firestore().collection("questions").limit(500).get()
                .then(function (snap) {
                    if (snap.empty) return;

                    // semester -> exam -> subject -> batch -> [images]
                    var tree = {};
                    snap.forEach(function (doc) {
                        var q = doc.data();
                        var url = safeUrl(q.url);
                        if (!url || !q.semester || !q.exam || !q.subject || !q.batch) return;
                        tree[q.semester] = tree[q.semester] || {};
                        tree[q.semester][q.exam] = tree[q.semester][q.exam] || {};
                        tree[q.semester][q.exam][q.subject] = tree[q.semester][q.exam][q.subject] || {};
                        var batches = tree[q.semester][q.exam][q.subject];
                        batches[q.batch] = batches[q.batch] || [];
                        batches[q.batch].push({ url: url, section: q.section, set: q.set, page: q.page || 1 });
                    });

                    if (!Object.keys(tree).length) return;
                    render(host, tree);
                })
                .catch(function () { /* nothing to show — stay quiet */ });
        });
    });

    function render(host, tree) {
        var html = '<div class="live-catalog-head">' +
                   '<h2>🔔 Recently added by admins</h2>' +
                   '<p>Papers added straight from the admin panel — grouped by semester, exam and subject.</p>' +
                   '</div>';

        Object.keys(tree).sort().forEach(function (sem) {
            Object.keys(tree[sem]).sort().forEach(function (exam) {
                Object.keys(tree[sem][exam]).sort().forEach(function (subject) {
                    var batches = tree[sem][exam][subject];
                    var batchKeys = Object.keys(batches).sort();
                    var totalImgs = batchKeys.reduce(function (sum, b) { return sum + batches[b].length; }, 0);
                    var gid = "lc" + Math.random().toString(36).slice(2, 9);

                    html += '<div class="lc-group" id="' + gid + '">' +
                            '<button type="button" class="lc-group-head" data-toggle="' + gid + '">' +
                            '<span class="lc-group-title"><b>' + esc(subject) + '</b>' +
                            '<small>' + esc(sem) + ' · ' + esc(exam) + ' · ' +
                            batchKeys.length + ' batch' + (batchKeys.length !== 1 ? 'es' : '') +
                            ' · ' + totalImgs + ' paper' + (totalImgs !== 1 ? 's' : '') + '</small></span>' +
                            '<span class="lc-chevron">▾</span>' +
                            '</button>' +
                            '<div class="lc-group-body">' +
                            '<div class="lc-batch-chips">';

                    batchKeys.forEach(function (b) {
                        html += '<button type="button" class="lc-batch-chip" data-batch="' + gid + '-' + esc(b) + '">Batch ' + esc(b) + '</button>';
                    });
                    html += '</div>';

                    batchKeys.forEach(function (b) {
                        html += '<div class="lc-images" id="' + gid + '-' + esc(b) + '">';
                        batches[b].sort(function (a, c) { return (a.page || 0) - (c.page || 0); });
                        batches[b].forEach(function (it) {
                            var label = [it.section ? "Section " + it.section : "", it.set ? "Set " + it.set : ""]
                                        .filter(Boolean).join(" · ");
                            var alt = esc(subject + " " + exam + " Batch " + b + " " + label);
                            html += '<img src="' + esc(it.url) + '" alt="' + alt +
                                   '" loading="lazy" onclick="openImage(this)">';
                        });
                        html += '</div>';
                    });

                    html += '</div></div>';
                });
            });
        });

        host.innerHTML = html;
        host.style.display = "block";

        host.querySelectorAll("[data-toggle]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.getElementById(btn.dataset.toggle).classList.toggle("open");
            });
        });

        host.querySelectorAll("[data-batch]").forEach(function (chip) {
            chip.addEventListener("click", function () {
                var panel = document.getElementById(chip.dataset.batch);
                var wasOpen = panel.classList.contains("open");
                // Shei group-er baki batch panel gula bondho kore ekta-i khola rakhi
                panel.parentElement.querySelectorAll(".lc-images").forEach(function (p) { p.classList.remove("open"); });
                panel.parentElement.querySelectorAll(".lc-batch-chip").forEach(function (c) { c.classList.remove("active"); });
                if (!wasOpen) {
                    panel.classList.add("open");
                    chip.classList.add("active");
                }
            });
        });
    }

})();
