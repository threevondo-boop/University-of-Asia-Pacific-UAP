/* search.js
   Navbar-er search box. search-data.js-er list theke match kore
   dropdown e result dekhay.
*/

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("siteSearch");
    const resultsBox = document.getElementById("searchResults");
    if (!input || !resultsBox || typeof SITE_PAGES === "undefined") return;

    const prefix = window.SITE_PREFIX || "";

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
        });
    }

    function render(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            resultsBox.classList.remove("active");
            resultsBox.innerHTML = "";
            return;
        }

        const matches = SITE_PAGES.filter(function (p) {
            return p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q);
        }).slice(0, 8);

        if (matches.length === 0) {
            resultsBox.innerHTML = '<div class="search-empty">No results for "' + esc(query) + '"</div>';
        } else {
            resultsBox.innerHTML = matches.map(function (p) {
                return '<a href="' + esc(prefix + p.url) + '">' + esc(p.title) +
                       '<small>' + esc(p.tag) + '</small></a>';
            }).join("");
        }
        resultsBox.classList.add("active");
    }

    input.addEventListener("input", function () {
        render(input.value);
    });

    input.addEventListener("focus", function () {
        if (input.value.trim()) render(input.value);
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".nav-search")) {
            resultsBox.classList.remove("active");
        }
    });
});
