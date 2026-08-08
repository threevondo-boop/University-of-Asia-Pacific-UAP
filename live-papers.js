/* live-papers.js
   Admin panel theke upload kora question paper matching
   batch page e 'Recently added' hishebe dekhay.
*/

(function () {

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }

    /* URL ta shotti https kina dekhi. Database e kono karone */
    function safeUrl(u) {
        return (typeof u === "string" && /^https:\/\//i.test(u)) ? u : "";
    }

    document.addEventListener("DOMContentLoaded", function () {
        var box = document.querySelector(".live-papers");
        if (!box) return;
        if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") return;
        if (typeof firebase.firestore !== "function") return;
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        var sem     = box.dataset.sem;
        var exam    = box.dataset.exam;
        var subject = box.dataset.subject;
        var batch   = box.dataset.batch;
        if (!batch) return;   // previous-semester page — skip

        /* Sign-in na thakle Firestore rules read dibe na, tai */
        firebase.auth().onAuthStateChanged(function (user) {
            if (!user) return;

            firebase.firestore().collection("questions")
                .where("semester", "==", sem)
                .where("exam", "==", exam)
                .where("subject", "==", subject)
                .where("batch", "==", batch)
                .get()
                .then(function (snap) {
                    if (snap.empty) return;

                    var items = [];
                    snap.forEach(function (d) {
                        var q = d.data();
                        var url = safeUrl(q.url);
                        if (url) items.push({ url: url, q: q });
                    });
                    if (!items.length) return;

                    items.sort(function (a, b) { return (a.q.page || 0) - (b.q.page || 0); });

                    var html = '<div class="paper-group">' +
                               '<h3 class="section-heading">Recently added</h3>' +
                               '<div class="question-image-grid">';
                    items.forEach(function (it) {
                        var label = [it.q.section ? "Section " + it.q.section : "",
                                     it.q.set ? "Set " + it.q.set : ""]
                                    .filter(Boolean).join(" · ");
                        html += '<img src="' + esc(it.url) + '" alt="' +
                                esc(subject + " " + exam + " Batch " + batch + " " + label) +
                                '" class="question-image" loading="lazy" onclick="openImage(this)">';
                    });
                    html += '</div></div>';
                    box.innerHTML = html;
                })
                .catch(function () { /* index nai ba permission nai — chup thako */ });
        });
    });

})();
