/* gallery.js
   Gallery page — chobi gula title + date onujayi group kore dekhay.
   Notun group age ashe. Static chobi shob shesh e.
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

    function niceDate(iso) {
        if (!iso) return "";
        var d = new Date(iso + "T00:00:00");
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var strip = document.getElementById("galleryStrip");
        if (!strip) return;

        // Static chobi gula tule rakhi, tarpor niche render() shob bosabe
        var staticItems = [];
        strip.querySelectorAll(".gallery-item img").forEach(function (im) {
            staticItems.push({ url: im.getAttribute("src"), caption: im.getAttribute("alt") || "" });
        });

        var host = strip.parentElement;
        strip.remove();

        renderAll(host, [], staticItems);

        if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") return;
        if (typeof firebase.firestore !== "function") return;
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        firebase.auth().onAuthStateChanged(function (user) {
            if (!user) return;
            firebase.firestore().collection("gallery").get()
                .then(function (snap) {
                    var live = [];
                    snap.forEach(function (d) {
                        var g = d.data();
                        var url = safeUrl(g.url);
                        if (!url) return;
                        live.push({
                            url: url,
                            title: g.title || "Untitled",
                            date: g.displayDate || "",
                            caption: g.caption || "",
                            at: g.createdAt && g.createdAt.seconds ? g.createdAt.seconds : 0
                        });
                    });
                    renderAll(host, live, staticItems);
                })
                .catch(function () { /* static chobi to already ache */ });
        });
    });

    function renderAll(host, live, staticItems) {
        // (title + date) onujayi group — eki title ar eki date hole ek group
        var groups = {};
        live.forEach(function (it) {
            var key = it.title + "||" + it.date;
            if (!groups[key]) {
                groups[key] = { title: it.title, date: it.date, at: it.at, items: [] };
            }
            groups[key].items.push(it);
            if (it.at > groups[key].at) groups[key].at = it.at;
        });

        // Notun group age
        var ordered = Object.keys(groups).map(function (k) { return groups[k]; });
        ordered.sort(function (a, b) {
            if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
            return b.at - a.at;
        });

        var html = "";
        ordered.forEach(function (g) {
            html += '<section class="gallery-group">' +
                    '<div class="gallery-group-head">' +
                    '<h3>' + esc(g.title) + '</h3>' +
                    (g.date ? '<span class="g-date">' + esc(niceDate(g.date)) + '</span>' : '') +
                    '<span class="g-count">' + g.items.length + ' photo' +
                    (g.items.length !== 1 ? 's' : '') + '</span>' +
                    '</div><div class="gallery-strip">';
            g.items.forEach(function (it) {
                html += '<div class="gallery-item"><img src="' + esc(it.url) +
                        '" alt="' + esc(it.caption || g.title) + '" loading="lazy"></div>';
            });
            html += '</div></section>';
        });

        if (staticItems.length) {
            html += '<section class="gallery-group">' +
                    '<div class="gallery-group-head"><h3>Campus</h3>' +
                    '<span class="g-count">' + staticItems.length + ' photo' +
                    (staticItems.length !== 1 ? 's' : '') + '</span></div>' +
                    '<div class="gallery-strip">';
            staticItems.forEach(function (it) {
                html += '<div class="gallery-item"><img src="' + esc(it.url) +
                        '" alt="' + esc(it.caption) + '" loading="lazy"></div>';
            });
            html += '</div></section>';
        }

        if (!html) {
            html = '<div class="empty-state"><span class="empty-icon">🖼</span>' +
                   '<b>Gallery is empty.</b></div>';
        }

        var old = host.querySelectorAll(".gallery-group, .empty-state");
        old.forEach(function (el) { el.remove(); });

        var pager = document.getElementById("galleryPager");
        if (pager) pager.insertAdjacentHTML("beforebegin", html);
        else host.insertAdjacentHTML("beforeend", html);
    }

})();
