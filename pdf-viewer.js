/* pdf-viewer.js
   Shared PDF reader popup. Byabohar: uapOpenPdf(url, title, downloadUrl)
*/

(function () {

    var pdfPushedHistory = false;

    window.uapOpenPdf = function (url, title, downloadUrl) {
        var modal = document.getElementById("pdfModal");
        var frame = document.getElementById("pdfFrame");
        var label = document.getElementById("pdfTitle");
        var open  = document.getElementById("pdfOpen");
        if (!/^https:\/\//i.test(String(url))) return;   // https chara khulbo na
        if (!modal || !frame) { window.open(url, "_blank", "noopener"); return; }

        frame.src = url;
        if (label) label.textContent = title || "Note";
        if (open) open.href = downloadUrl || url;

        /* Inline style-i asol source of truth — shudhu class-er upor */
        modal.style.display = "flex";
        modal.classList.add("active");
        document.body.style.overflow = "hidden";

        /* Browser BACK jate reader bondho kore, page theke ber na kore */
        if (!pdfPushedHistory) {
            try { history.pushState({ uapModal: "pdf" }, ""); pdfPushedHistory = true; }
            catch (e) { /* history block thakleo reader kaj korbe */ }
        }
    };

    function closePdfDirect() {
        var modal = document.getElementById("pdfModal");
        var frame = document.getElementById("pdfFrame");
        if (!modal) return;
        modal.classList.remove("active");
        modal.style.display = "none";
        if (frame) frame.src = "";
        document.body.style.overflow = "";
    }

    window.uapClosePdf = function () {
        var wasPushed = pdfPushedHistory;
        pdfPushedHistory = false;
        closePdfDirect();
        if (wasPushed) { try { history.back(); } catch (e) {} }
    };

    /* Browser BACK -> reader bondho hobe, page theke ber hobe na */
    window.addEventListener("popstate", function () {
        var modal = document.getElementById("pdfModal");
        if (modal && modal.classList.contains("active")) {
            pdfPushedHistory = false;
            closePdfDirect();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            var modal = document.getElementById("pdfModal");
            if (modal && modal.classList.contains("active")) uapClosePdf();
        }
    });

})();
