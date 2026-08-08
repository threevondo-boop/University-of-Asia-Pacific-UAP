/* auth-guard.js
   Sign-in na thakle page theke signin.html e redirect kore.
*/

(function () {
    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    if (typeof firebase === "undefined" || !isConfigured()) return;

    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            const here = window.location.pathname.split("/").pop();
            window.location.href = (window.SITE_PREFIX || "") +
                "signin.html?redirect=" + encodeURIComponent(here);
        }
    });
})();
