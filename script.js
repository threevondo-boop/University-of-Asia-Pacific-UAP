/* script.js
   Shared image viewer. Kono question/gallery image e click korle
   full-screen popup e boro kore dekhay — zoom, pan, download.
*/

/* One shared image viewer for both the Gallery and question-paper */

let modalScale = 1;
let modalPosX = 0;
let modalPosY = 0;
let modalDragging = false;
let modalStartX = 0;
let modalStartY = 0;

/* Ei page-er shob viewable image, jei order e ache */
let modalList = [];
let modalIndex = -1;
let modalPushedHistory = false;

const IMG_SELECTOR = ".question-image, .gallery-item img, .lc-images img";

function collectImages() {
    modalList = Array.prototype.slice.call(document.querySelectorAll(IMG_SELECTOR));
}

function showAt(i) {
    if (i < 0 || i >= modalList.length) return;
    modalIndex = i;
    const imgEl = modalList[i];
    const modalImg = document.getElementById("modalImage");
    const downloadBtn = document.getElementById("downloadBtn");
    if (!modalImg) return;

    modalImg.src = imgEl.src;
    modalImg.alt = imgEl.alt || "Question paper";
    if (downloadBtn) {
        downloadBtn.href = imgEl.src;
        downloadBtn.download = imgEl.alt ? imgEl.alt : "uap-image";
    }
    resetZoom();
    updateNavUI();
}

function nextImage() { if (modalIndex < modalList.length - 1) showAt(modalIndex + 1); }
function prevImage() { if (modalIndex > 0) showAt(modalIndex - 1); }

function updateNavUI() {
    const prev = document.getElementById("modalPrev");
    const next = document.getElementById("modalNext");
    const count = document.getElementById("modalCount");
    if (prev) prev.style.visibility = modalIndex > 0 ? "visible" : "hidden";
    if (next) next.style.visibility = modalIndex < modalList.length - 1 ? "visible" : "hidden";
    if (count) {
        count.textContent = modalList.length > 1
            ? (modalIndex + 1) + " / " + modalList.length : "";
    }
}

function openImage(imgEl) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    if (!modal || !modalImg) return;

    collectImages();
    const idx = modalList.indexOf(imgEl);
    showAt(idx >= 0 ? idx : 0);
    if (idx < 0) {   // list-e nai (jemon dynamically add hoyeche)
        modalImg.src = imgEl.src;
        modalImg.alt = imgEl.alt || "";
    }

    modal.style.display = "flex";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    /* Browser-er BACK button jate modal ta bondho kore, page theke
       ber kore na niye jay. History te ekta fake entry push kori;
       back chapleye popstate ashe ar amra modal bondho kore dei. */
    if (!modalPushedHistory) {
        try { history.pushState({ uapModal: "image" }, ""); modalPushedHistory = true; }
        catch (e) { /* history block kora thakle-o modal kaj korbe */ }
    }
}

/* Shudhu hide kore — history te hat dey na (popstate theke call hoy) */
function closeImageDirect() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
    document.body.style.overflow = "";
    resetZoom();
}

function closeImage() {
    const wasPushed = modalPushedHistory;
    modalPushedHistory = false;
    closeImageDirect();
    // history.back() korle popstate ashbe, kintu tokhon modal already
    // bondho — tai ar kichu hobe na, shudhu URL thik hoye jabe.
    if (wasPushed) { try { history.back(); } catch (e) {} }
}

function zoomIn() {
    modalScale = Math.min(modalScale + 0.25, 6);
    updateModalTransform();
}

function zoomOut() {
    modalScale = Math.max(modalScale - 0.25, 1);
    if (modalScale === 1) { modalPosX = 0; modalPosY = 0; }
    updateModalTransform();
}

function resetZoom() {
    modalScale = 1;
    modalPosX = 0;
    modalPosY = 0;
    updateModalTransform();
}

function updateModalTransform() {
    const modalImg = document.getElementById("modalImage");
    if (!modalImg) return;
    modalImg.style.transform = `translate(${modalPosX}px, ${modalPosY}px) scale(${modalScale})`;
}

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    if (!modal || !modalImg) return;

    /* Proti <img class="question-image"> e already onclick="openImage(this)" */
    document.body.addEventListener("click", function (e) {
        const img = e.target.closest(IMG_SELECTOR);
        if (img) openImage(img);
    });

    /* Prev / Next / counter button gula JS diye banai — tahole 374 ta
       HTML file e hat dite hobe na. */
    if (!document.getElementById("modalPrev")) {
        const mk = function (id, txt, label) {
            const b = document.createElement("button");
            b.id = id; b.type = "button"; b.className = "modal-nav";
            b.innerHTML = txt; b.setAttribute("aria-label", label);
            return b;
        };
        const prev = mk("modalPrev", "&#8249;", "Previous image");
        const next = mk("modalNext", "&#8250;", "Next image");
        prev.classList.add("prev"); next.classList.add("next");
        prev.addEventListener("click", function (e) { e.stopPropagation(); prevImage(); });
        next.addEventListener("click", function (e) { e.stopPropagation(); nextImage(); });

        const count = document.createElement("span");
        count.id = "modalCount"; count.className = "modal-count";

        const back = document.createElement("button");
        back.type = "button"; back.className = "modal-back";
        back.innerHTML = "&#8592; Back";
        back.setAttribute("aria-label", "Close viewer");
        back.addEventListener("click", function (e) { e.stopPropagation(); closeImage(); });

        modal.appendChild(prev); modal.appendChild(next);
        modal.appendChild(count); modal.appendChild(back);
    }

    /* Keyboard: ← → next/prev, Esc bondho */
    document.addEventListener("keydown", function (e) {
        if (!modal.classList.contains("active")) return;
        if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); prevImage(); }
        else if (e.key === "Escape") { closeImage(); }
    });

    /* Browser BACK -> modal bondho hobe, page theke ber hobe na */
    window.addEventListener("popstate", function () {
        if (modal.classList.contains("active")) {
            modalPushedHistory = false;
            closeImageDirect();
        }
    });

    // Mouse wheel = zoom in/out
    modal.addEventListener("wheel", function (e) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn(); else zoomOut();
    });

    // Drag to pan once zoomed in
    modalImg.addEventListener("mousedown", function (e) {
        if (modalScale <= 1) return;
        modalDragging = true;
        modalStartX = e.clientX - modalPosX;
        modalStartY = e.clientY - modalPosY;
    });

    window.addEventListener("mousemove", function (e) {
        if (!modalDragging) return;
        modalPosX = e.clientX - modalStartX;
        modalPosY = e.clientY - modalStartY;
        updateModalTransform();
    });

    window.addEventListener("mouseup", function () {
        modalDragging = false;
    });

    // Click the dark backdrop (not the image or toolbar) to close
    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeImage();
    });
});

/* Navbar-e "current page" ta highlight kore dekhabe (bold/underline */
document.addEventListener("DOMContentLoaded", function () {
    const currentFile = window.location.pathname.split("/").pop() || "home.html";
    document.querySelectorAll("nav a").forEach(function (link) {
        const linkFile = link.getAttribute("href").split("/").pop();
        if (linkFile === currentFile) {
            link.classList.add("active");
        }
    });
});

/* [POLISH] Mobile touch support — pinch to zoom, drag to pan */
(function () {
    var startDist = 0;
    var startScale = 1;
    var touchStartX = 0, touchStartY = 0;

    function dist(t) {
        var dx = t[0].clientX - t[1].clientX;
        var dy = t[0].clientY - t[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    document.addEventListener("DOMContentLoaded", function () {
        var img = document.getElementById("modalImage");
        if (!img) return;

        img.addEventListener("touchstart", function (e) {
            if (e.touches.length === 2) {
                startDist = dist(e.touches);
                startScale = modalScale;
            } else if (e.touches.length === 1 && modalScale > 1) {
                touchStartX = e.touches[0].clientX - modalPosX;
                touchStartY = e.touches[0].clientY - modalPosY;
            }
        }, { passive: true });

        img.addEventListener("touchmove", function (e) {
            if (e.touches.length === 2 && startDist) {
                e.preventDefault();
                var ratio = dist(e.touches) / startDist;
                modalScale = Math.min(Math.max(startScale * ratio, 1), 6);
                if (modalScale === 1) { modalPosX = 0; modalPosY = 0; }
                updateModalTransform();
            } else if (e.touches.length === 1 && modalScale > 1) {
                e.preventDefault();
                modalPosX = e.touches[0].clientX - touchStartX;
                modalPosY = e.touches[0].clientY - touchStartY;
                updateModalTransform();
            }
        }, { passive: false });

        img.addEventListener("touchend", function (e) {
            if (e.touches.length < 2) startDist = 0;
        }, { passive: true });

        /* Double-tap = zoom in / reset */
        var lastTap = 0;
        img.addEventListener("touchend", function () {
            var now = Date.now();
            if (now - lastTap < 300) {
                if (modalScale > 1) resetZoom();
                else { modalScale = 2.5; updateModalTransform(); }
            }
            lastTap = now;
        }, { passive: true });
    });
})();
