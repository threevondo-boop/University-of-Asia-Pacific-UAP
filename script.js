/* UAP Question Archive — Global Image Viewer
 * v25: stable controls, navigation, zoom, drag, touch and history handling.
 */
(() => {
    "use strict";

    const IMG_SELECTOR = ".question-image, .gallery-item img, .lc-images img";
    const state = {
        list: [],
        index: -1,
        scale: 1,
        x: 0,
        y: 0,
        dragging: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        historyPushed: false,
        closingFromPopstate: false,
        pinchStartDistance: 0,
        pinchStartScale: 1
    };

    const $ = (id) => document.getElementById(id);

    function getModal() { return $("imageModal"); }
    function getModalImage() { return $("modalImage"); }

    function collectImages() {
        state.list = Array.from(document.querySelectorAll(IMG_SELECTOR));
        return state.list;
    }

    function setModalVisible(visible) {
        const modal = getModal();
        if (!modal) return;
        modal.classList.toggle("active", visible);
        modal.style.display = visible ? "flex" : "none";
        modal.setAttribute("aria-hidden", visible ? "false" : "true");
        document.body.classList.toggle("viewer-open", visible);
        document.body.style.overflow = visible ? "hidden" : "";
    }

    function updateTransform() {
        const img = getModalImage();
        if (!img) return;
        img.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
    }

    function resetZoom() {
        state.scale = 1;
        state.x = 0;
        state.y = 0;
        updateTransform();
    }

    function zoomTo(nextScale, centerX, centerY) {
        const oldScale = state.scale;
        const scale = Math.max(1, Math.min(6, nextScale));
        if (scale === 1) {
            resetZoom();
            return;
        }

        // Keep the point under the cursor/finger approximately fixed while zooming.
        if (typeof centerX === "number" && typeof centerY === "number" && oldScale > 0) {
            const ratio = scale / oldScale;
            state.x = centerX - (centerX - state.x) * ratio;
            state.y = centerY - (centerY - state.y) * ratio;
        }
        state.scale = scale;
        updateTransform();
    }

    function zoomIn() { zoomTo(state.scale + 0.25); }
    function zoomOut() { zoomTo(state.scale - 0.25); }

    function updateNav() {
        const prev = $("modalPrev");
        const next = $("modalNext");
        const count = $("modalCount");
        const hasPrev = state.index > 0;
        const hasNext = state.index >= 0 && state.index < state.list.length - 1;

        if (prev) {
            prev.disabled = !hasPrev;
            prev.setAttribute("aria-hidden", hasPrev ? "false" : "true");
        }
        if (next) {
            next.disabled = !hasNext;
            next.setAttribute("aria-hidden", hasNext ? "false" : "true");
        }
        if (count) {
            count.textContent = state.list.length > 1 && state.index >= 0
                ? `${state.index + 1} / ${state.list.length}`
                : "";
        }
    }

    function showAt(index) {
        if (!state.list.length) collectImages();
        if (index < 0 || index >= state.list.length) return;

        const source = state.list[index];
        const modalImg = getModalImage();
        const download = $("downloadBtn");
        if (!modalImg || !source) return;

        state.index = index;
        modalImg.src = source.currentSrc || source.src;
        modalImg.alt = source.alt || "Question paper";
        resetZoom();

        if (download) {
            download.href = source.currentSrc || source.src;
            download.download = (source.alt || "uap-question-paper")
                .replace(/[^a-z0-9 _.-]/gi, "")
                .trim() || "uap-question-paper";
        }
        updateNav();
    }

    function nextImage() {
        if (state.index < state.list.length - 1) showAt(state.index + 1);
    }

    function prevImage() {
        if (state.index > 0) showAt(state.index - 1);
    }

    function openImage(imgEl) {
        const modal = getModal();
        if (!modal || !imgEl) return;

        collectImages();
        let index = state.list.indexOf(imgEl);
        if (index < 0) {
            state.list.push(imgEl);
            index = state.list.length - 1;
        }

        showAt(index);
        setModalVisible(true);

        if (!state.historyPushed) {
            try {
                history.pushState({ uapImageViewer: true }, "", window.location.href);
                state.historyPushed = true;
            } catch (_) {
                state.historyPushed = false;
            }
        }

        const close = $("modalClose");
        if (close) close.focus({ preventScroll: true });
    }

    function closeImageDirect() {
        state.dragging = false;
        state.pointerId = null;
        state.pinchStartDistance = 0;
        resetZoom();
        setModalVisible(false);
    }

    function closeImage() {
        const shouldGoBack = state.historyPushed;
        state.historyPushed = false;
        closeImageDirect();
        if (shouldGoBack && !state.closingFromPopstate) {
            try { history.back(); } catch (_) { /* ignore */ }
        }
    }

    function buildControls() {
        const modal = getModal();
        if (!modal) return;

        // Remove duplicate controls if a page already contains a previous generated copy.
        modal.querySelectorAll(".uap-generated-control").forEach(el => el.remove());

        const makeButton = (id, text, label, className) => {
            const button = document.createElement("button");
            button.type = "button";
            button.id = id;
            button.className = `${className} uap-generated-control`;
            button.textContent = text;
            button.setAttribute("aria-label", label);
            return button;
        };

        const close = modal.querySelector(".modal-close") || makeButton("modalClose", "×", "Close viewer", "modal-close");
        close.id = "modalClose";
        close.setAttribute("role", "button");
        close.setAttribute("tabindex", "0");
        if (!close.parentElement) modal.appendChild(close);

        const toolbar = modal.querySelector(".viewer-toolbar");
        if (toolbar) {
            toolbar.innerHTML = "";
            const out = makeButton("zoomOutBtn", "−", "Zoom out", "");
            const reset = makeButton("resetZoomBtn", "⟳", "Reset zoom", "");
            const inBtn = makeButton("zoomInBtn", "+", "Zoom in", "");
            toolbar.append(out, reset, inBtn);
            out.addEventListener("click", e => { e.stopPropagation(); zoomOut(); });
            reset.addEventListener("click", e => { e.stopPropagation(); resetZoom(); });
            inBtn.addEventListener("click", e => { e.stopPropagation(); zoomIn(); });
        }

        if (!$("modalPrev")) {
            const prev = makeButton("modalPrev", "‹", "Previous image", "modal-nav prev");
            modal.appendChild(prev);
            prev.addEventListener("click", e => { e.stopPropagation(); prevImage(); });
        }
        if (!$("modalNext")) {
            const next = makeButton("modalNext", "›", "Next image", "modal-nav next");
            modal.appendChild(next);
            next.addEventListener("click", e => { e.stopPropagation(); nextImage(); });
        }
        if (!$("modalCount")) {
            const count = document.createElement("span");
            count.id = "modalCount";
            count.className = "modal-count uap-generated-control";
            modal.appendChild(count);
        }
        if (!modal.querySelector(".modal-back")) {
            const back = makeButton("modalBack", "← Back", "Close viewer", "modal-back");
            modal.appendChild(back);
            back.addEventListener("click", e => { e.stopPropagation(); closeImage(); });
        }

        close.addEventListener("click", e => { e.stopPropagation(); closeImage(); });
        close.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                closeImage();
            }
        });
    }

    function pointerDistance(a, b) {
        const dx = a.clientX - b.clientX;
        const dy = a.clientY - b.clientY;
        return Math.hypot(dx, dy);
    }

    function setupViewer() {
        const modal = getModal();
        const modalImg = getModalImage();
        if (!modal || !modalImg) return;

        buildControls();
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        document.addEventListener("click", e => {
            const img = e.target.closest && e.target.closest(IMG_SELECTOR);
            if (img) {
                e.preventDefault();
                e.stopPropagation();
                openImage(img);
            }
        }, true);

        document.addEventListener("keydown", e => {
            if (!modal.classList.contains("active")) return;
            if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); prevImage(); }
            else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
            else if (e.key === "-") { e.preventDefault(); zoomOut(); }
            else if (e.key === "0") { e.preventDefault(); resetZoom(); }
            else if (e.key === "Escape") { e.preventDefault(); closeImage(); }
        });

        modal.addEventListener("wheel", e => {
            if (!modal.classList.contains("active")) return;
            e.preventDefault();
            const rect = modalImg.getBoundingClientRect();
            const cx = e.clientX - (rect.left + rect.width / 2);
            const cy = e.clientY - (rect.top + rect.height / 2);
            zoomTo(state.scale + (e.deltaY < 0 ? 0.25 : -0.25), cx, cy);
        }, { passive: false });

        modalImg.addEventListener("pointerdown", e => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (state.scale <= 1) return;
            state.dragging = true;
            state.pointerId = e.pointerId;
            state.startX = e.clientX - state.x;
            state.startY = e.clientY - state.y;
            modalImg.setPointerCapture?.(e.pointerId);
        });

        modalImg.addEventListener("pointermove", e => {
            if (!state.dragging || state.pointerId !== e.pointerId) return;
            state.x = e.clientX - state.startX;
            state.y = e.clientY - state.startY;
            updateTransform();
        });

        const endDrag = e => {
            if (state.pointerId === e.pointerId || e.pointerId == null) {
                state.dragging = false;
                state.pointerId = null;
            }
        };
        modalImg.addEventListener("pointerup", endDrag);
        modalImg.addEventListener("pointercancel", endDrag);
        modalImg.addEventListener("dragstart", e => e.preventDefault());

        // Two-finger pinch uses native touch points without interfering with buttons.
        modalImg.addEventListener("touchstart", e => {
            if (e.touches.length === 2) {
                state.pinchStartDistance = pointerDistance(e.touches[0], e.touches[1]);
                state.pinchStartScale = state.scale;
            }
        }, { passive: true });
        modalImg.addEventListener("touchmove", e => {
            if (e.touches.length !== 2 || !state.pinchStartDistance) return;
            e.preventDefault();
            const ratio = pointerDistance(e.touches[0], e.touches[1]) / state.pinchStartDistance;
            zoomTo(state.pinchStartScale * ratio);
        }, { passive: false });
        modalImg.addEventListener("touchend", e => {
            if (e.touches.length < 2) state.pinchStartDistance = 0;
        }, { passive: true });

        modal.addEventListener("click", e => {
            if (e.target === modal) closeImage();
        });

        window.addEventListener("popstate", () => {
            if (!modal.classList.contains("active")) return;
            state.closingFromPopstate = true;
            state.historyPushed = false;
            closeImageDirect();
            state.closingFromPopstate = false;
        });

        // Keep controls correct if content is added dynamically later.
        updateNav();
    }

    // Backwards-compatible global functions used by existing HTML onclick attributes.
    window.openImage = openImage;
    window.closeImage = closeImage;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.resetZoom = resetZoom;
    window.nextImage = nextImage;
    window.prevImage = prevImage;

    document.addEventListener("DOMContentLoaded", () => {
        setupViewer();

        const currentFile = window.location.pathname.split("/").pop() || "home.html";
        document.querySelectorAll("nav a").forEach(link => {
            const href = link.getAttribute("href") || "";
            const linkFile = href.split("/").pop();
            if (linkFile === currentFile) link.classList.add("active");
        });
    });
})();
