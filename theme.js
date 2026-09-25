

(function () {
    const root = document.documentElement;

    
    function readStore(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeStore(key, val) {
        try { localStorage.setItem(key, val); } catch (e) {  }
    }

    const saved = readStore("uap-theme");


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
