/* nav.js
   Mobile hamburger menu open/close (1150px-er niche).
*/

(function () {

    function setOpen(links, toggle, open) {
        if (open) {
            links.classList.add("open");
            links.style.display = "flex";
            toggle.setAttribute("aria-expanded", "true");
        } else {
            links.classList.remove("open");
            links.style.display = "";
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var toggle = document.getElementById("navToggle");
        var links  = document.getElementById("navLinks");
        if (!toggle || !links) return;

        toggle.addEventListener("click", function () {
            var isOpen = links.classList.contains("open");
            setOpen(links, toggle, !isOpen);
        });

        // Link e click korle menu bondho hoye jak — na hole page
        // change hobar por-o menu khola thake mone hoy.
        links.querySelectorAll("a, button").forEach(function (el) {
            el.addEventListener("click", function () {
                setOpen(links, toggle, false);
            });
        });

        // Menu-r baire click korle bondho
        document.addEventListener("click", function (e) {
            if (!links.classList.contains("open")) return;
            if (links.contains(e.target) || toggle.contains(e.target)) return;
            setOpen(links, toggle, false);
        });

        // Esc chapleo bondho
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setOpen(links, toggle, false);
        });

        // Boro screen e resize korle (ba rotate) menu-r leftover
        // "open" state clear kore dei, na hole desktop e giye
        // dropdown-er style atke thakte pare.
        window.addEventListener("resize", function () {
            if (window.innerWidth > 1150) setOpen(links, toggle, false);
        });

        setupAutoHide(links, toggle);
    });

    /* Niche scroll korle nav upore uthe jay (poRar jonno puro screen),
       upore scroll korlei shate shate fire ashe — YouTube / Facebook
       jei rokom kore. */
    function setupAutoHide(links, toggle) {
        var nav = document.querySelector(".site-nav");
        if (!nav) return;

        var lastY = window.pageYOffset;
        var ticking = false;
        var THRESHOLD = 90;   // ei tuku upore na gele lukabo na
        var DELTA = 6;        // chotto jhaka-y jate na bodlay

        function onScroll() {
            var y = window.pageYOffset;

            // Mobile menu khola thakle nav lukano jabe na
            if (links && links.classList.contains("open")) {
                nav.classList.remove("nav-hidden");
                lastY = y;
                ticking = false;
                return;
            }

            if (Math.abs(y - lastY) < DELTA) { ticking = false; return; }

            if (y > lastY && y > THRESHOLD) {
                nav.classList.add("nav-hidden");        // niche jacche
            } else {
                nav.classList.remove("nav-hidden");     // upore jacche
            }

            lastY = y;
            ticking = false;
        }

        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }, { passive: true });
    }

})();
