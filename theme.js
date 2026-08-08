/* theme.js
   Dark / light mode toggle. Choice browser e save thake.
*/

(function () {
    const root = document.documentElement;

    /* Kichu browser e (incognito, cookie blocked, restricted school/
       office browser) localStorage use korle exception throw kore.
       Try/catch na thakle poro script ta bhenge jeto ar theme button
       kaj korto na. Ekhon storage na thakleo shob kaj kore — shudhu
       choice ta mone thake na. */
    function readStore(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeStore(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
    }

    const saved = readStore("uap-theme");

    // Page load hobar shathe shathe age-r saved theme apply kore dei
    // (na hole ekbar light dekhabe tarpor dark e switch hobe - flash hobe)
    if (saved === "dark") {
        root.setAttribute("data-theme", "dark");
    }

    document.addEventListener("DOMContentLoaded", function () {
        const btn = document.getElementById("themeToggle");
        if (!btn) return;

        function updateIcon() {
            const isDark = root.getAttribute("data-theme") === "dark";
            btn.textContent = isDark ? "☀️" : "🌙";
        }
        updateIcon();

        btn.addEventListener("click", function () {
            const isDark = root.getAttribute("data-theme") === "dark";
            if (isDark) {
                root.removeAttribute("data-theme");
                writeStore("uap-theme", "light");
            } else {
                root.setAttribute("data-theme", "dark");
                writeStore("uap-theme", "dark");
            }
            updateIcon();
        });
    });
})();
