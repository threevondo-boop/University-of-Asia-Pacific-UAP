/* ============================================================
   cloudinary-config.js
   ============================================================
   Ekhane SHUDHU duita jinish bosate hobe — Cloud name ar
   Upload preset name. Dutoi PUBLIC value, browser-e thakle kono
   problem nai (Cloudinary nijei eigulo public dhore rakhe).

   ⚠️  API Key / API Secret EKHANE KOKHONO BOSABE NA.
       Oigulo private. Frontend e thakle je keu tomar account er
       shob file delete korte parbe.

   Kothay pabe:
     Cloud name    -> Cloudinary Dashboard -er upore
     Upload preset -> Settings > Upload > Upload presets
                      (Signing Mode obosshoi "Unsigned")

   ============================================================ */

const cloudinaryConfig = {
    cloudName: "PASTE_YOUR_CLOUD_NAME",
    uploadPreset: "PASTE_YOUR_UPLOAD_PRESET",

    /* Folder structure Cloudinary-r vitore — ei naam gulo diyei */
    folders: {
        questions: "uap/questions",
        notes: "uap/notes",
        gallery: "uap/gallery"
    },

    /* Free plan e image ar raw file duitar limit-i 10 MB */
    maxUploadBytes: 10 * 1024 * 1024
};

/* Config bhora hoyeche kina check korar helper — */
function cloudinaryReady() {
    return typeof cloudinaryConfig !== "undefined" &&
           cloudinaryConfig.cloudName.indexOf("PASTE_YOUR") === -1 &&
           cloudinaryConfig.uploadPreset.indexOf("PASTE_YOUR") === -1;
}
