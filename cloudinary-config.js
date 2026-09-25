

const cloudinaryConfig = {
    cloudName: "gdsu8pd5",
    uploadPreset: "uap_unsigned",

    
    folders: {
        questions: "uap/questions",
        notes: "uap/notes",
        gallery: "uap/gallery"
    },

    
    maxUploadBytes: 10 * 1024 * 1024
};


function cloudinaryReady() {
    return typeof cloudinaryConfig !== "undefined" &&
           cloudinaryConfig.cloudName.indexOf("PASTE_YOUR") === -1 &&
           cloudinaryConfig.uploadPreset.indexOf("PASTE_YOUR") === -1;
}
