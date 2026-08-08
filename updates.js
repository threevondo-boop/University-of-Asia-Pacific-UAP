/* updates.js
   updates-data.js-er list ke timeline hishebe dekhay.
*/

(function () {

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }

    function formatDate(iso) {
        var d = new Date(iso + "T00:00:00");
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var host = document.getElementById("updatesTimeline");
        if (!host) return;

        if (typeof SITE_UPDATES === "undefined" || !SITE_UPDATES.length) {
            host.innerHTML = '<div class="empty-state"><span class="empty-icon">🔔</span>' +
                             '<b>No updates logged yet.</b></div>';
            return;
        }

        var items = SITE_UPDATES.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        host.innerHTML = items.map(function (u) {
            var linkHtml = u.link
                ? '<a class="update-link" href="' + esc(u.link) + '">' +
                  esc(u.linkLabel || "Visit →") + '</a>'
                : '';
            return '<div class="update-item">' +
                   '<span class="update-date">' + esc(formatDate(u.date)) + '</span>' +
                   '<h3>' + esc(u.title) + '</h3>' +
                   '<p>' + esc(u.description) + '</p>' +
                   linkHtml +
                   '</div>';
        }).join("");
    });

})();
