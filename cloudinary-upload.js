/* cloudinary-upload.js
   Shob upload ei ek jaygay hoy.
   uapUpload(file, folder, onProgress) -> Promise<{url, ...}>
   uapDriveLink(shareUrl) -> {preview, download, id}
   uapHumanSize(bytes) -> "4.2 MB"
*/

(function () {

    /* ---------- File size ke porar moto text e ---------- */
    window.uapHumanSize = function (bytes) {
        if (!bytes && bytes !== 0) return "—";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
        return (bytes / 1024 / 1024).toFixed(1) + " MB";
    };

    /* ---------- Cloudinary te ekta file pathanor kaj ---------- */
    window.uapUpload = function (file, folder, onProgress) {
        return new Promise(function (resolve, reject) {

            if (!cloudinaryReady()) {
                reject(new Error(
                    "Cloudinary isn't set up yet. " +
                    "Add the Cloud name and Upload preset in cloudinary-config.js."));
                return;
            }

            if (file.size > cloudinaryConfig.maxUploadBytes) {
                reject(new Error(
                    "This file is " + uapHumanSize(file.size) + " — the free Cloudinary plan allows up to " +
                    uapHumanSize(cloudinaryConfig.maxUploadBytes) + ". " +
                    "For anything bigger, use a Google Drive link instead."));
                return;
            }

            var form = new FormData();
            form.append("file", file);
            form.append("upload_preset", cloudinaryConfig.uploadPreset);
            if (folder) form.append("folder", folder);

            /* PDF ke Cloudinary "image" resource hishebe nile */
            var endpoint = "https://api.cloudinary.com/v1_1/" +
                           cloudinaryConfig.cloudName + "/image/upload";

            var xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint, true);

            xhr.upload.onprogress = function (e) {
                if (e.lengthComputable && typeof onProgress === "function") {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = function () {
                var data;
                try { data = JSON.parse(xhr.responseText); }
                catch (err) { reject(new Error("Got an unreadable response from Cloudinary.")); return; }

                if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                    resolve({
                        url: data.secure_url,
                        publicId: data.public_id,
                        bytes: data.bytes,
                        format: data.format,
                        pages: data.pages || null,
                        width: data.width || null,
                        height: data.height || null
                    });
                } else {
                    var msg = (data && data.error && data.error.message) || "Upload fail korlo.";
                    if (/whitelist|preset/i.test(msg)) {
                        msg += "  →  Check whether the upload preset is set to 'Unsigned'.";
                    }
                    reject(new Error(msg));
                }
            };

            xhr.onerror = function () {
                reject(new Error("A connection problem stopped the upload."));
            };

            xhr.send(form);
        });
    };

    /* ---------- Google Drive share link -> embeddable link ---------- */
    window.uapDriveLink = function (shareUrl) {
        if (!shareUrl) return null;
        var id = null;
        var m = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
        if (m) id = m[1];
        if (!id) {
            m = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
            if (m) id = m[1];
        }
        if (!id) return null;

        return {
            id: id,
            preview: "https://drive.google.com/file/d/" + id + "/preview",
            download: "https://drive.google.com/uc?export=download&id=" + id
        };
    };

})();
