/* UAP Question Archive — protected-page guard */
(function () {
    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    function redirectToSignIn() {
        var current = window.location.pathname + window.location.search + window.location.hash;
        current = current.replace(/^\/+/, "");
        var safe = /^[A-Za-z0-9_./?=&%#:+()\- ]+$/.test(current) && !current.includes("..") && !current.startsWith("/");
        var prefix = window.SITE_PREFIX || "";
        var target = safe ? "signin.html?redirect=" + encodeURIComponent(current) : "signin.html";
        window.location.replace(prefix + target);
    }

    if (!isConfigured() || typeof firebase === "undefined") {
        /* Fail closed: protected pages must not become public if Firebase fails. */
        window.location.replace((window.SITE_PREFIX || "") + "signin.html");
        return;
    }

    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);

    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
            redirectToSignIn();
            return;
        }
        var email = String(user.email || "").toLowerCase();
        var allowed = typeof ALLOWED_EMAIL_DOMAIN === "string" && email.endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
        var admin = typeof uapIsAdmin === "function" && uapIsAdmin(email);
        if (!allowed && !admin) {
            firebase.auth().signOut().finally(redirectToSignIn);
        }
    });
})();
