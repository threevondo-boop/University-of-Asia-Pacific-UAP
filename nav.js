

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


        links.querySelectorAll("a, button").forEach(function (el) {
            el.addEventListener("click", function () {
                setOpen(links, toggle, false);
            });
        });

        document.addEventListener("click", function (e) {
            if (!links.classList.contains("open")) return;
            if (links.contains(e.target) || toggle.contains(e.target)) return;
            setOpen(links, toggle, false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setOpen(links, toggle, false);
        });



        window.addEventListener("resize", function () {
            if (window.innerWidth > 1150) setOpen(links, toggle, false);
        });

        setupAutoHide(links, toggle);
    });

    
    function setupAutoHide(links, toggle) {
        var nav = document.querySelector(".site-nav");
        if (!nav) return;

        var lastY = window.pageYOffset;
        var ticking = false;
        var THRESHOLD = 90;   
        var DELTA = 6;        

        function onScroll() {
            var y = window.pageYOffset;

            if (links && links.classList.contains("open")) {
                nav.classList.remove("nav-hidden");
                lastY = y;
                ticking = false;
                return;
            }

            if (Math.abs(y - lastY) < DELTA) { ticking = false; return; }

            if (y > lastY && y > THRESHOLD) {
                nav.classList.add("nav-hidden");        
            } else {
                nav.classList.remove("nav-hidden");     
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
