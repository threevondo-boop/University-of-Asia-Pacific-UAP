/* UAP Question Archive — authentication */
(function () {
    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    function initFirebase() {
        if (typeof firebase === "undefined" || !isConfigured()) return null;
        if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
        return firebase.auth();
    }

    function allowedEmail(email) {
        var e = String(email || "").toLowerCase();
        var domain = String(typeof ALLOWED_EMAIL_DOMAIN === "string" ? ALLOWED_EMAIL_DOMAIN : "").toLowerCase();
        return !!domain && e.endsWith(domain);
    }

    function isSafeRedirect(value) {
        if (!value || typeof value !== "string") return false;
        if (/^https?:\/\//i.test(value) || value.indexOf("\\") !== -1 || value.startsWith("//")) return false;
        return /^[A-Za-z0-9_./?=&%#:+()\- ]+$/.test(value) && !value.includes("..") && !value.startsWith("/");
    }

    function getTarget() {
        var params = new URLSearchParams(window.location.search);
        var fromUrl = params.get("redirect");
        var fromSession = null;
        try { fromSession = sessionStorage.getItem("uap-login-redirect"); } catch (_) {}
        var value = isSafeRedirect(fromUrl) ? fromUrl : (isSafeRedirect(fromSession) ? fromSession : null);
        try { sessionStorage.removeItem("uap-login-redirect"); } catch (_) {}
        return value || ((window.SITE_PREFIX || "") + "home.html");
    }

    function validateAndRedirect(user) {
        var email = user && user.email || "";
        var adminOk = (typeof uapIsAdmin === "function") && uapIsAdmin(email);
        if (!allowedEmail(email) && !adminOk) {
            return firebase.auth().signOut().then(function () {
                throw new Error("Only a UAP email (" + ALLOWED_EMAIL_DOMAIN + ") can sign in.");
            });
        }
        window.location.replace(getTarget());
    }

    window.uapSignIn = function () {
        var auth = initFirebase();
        if (!auth) {
            alert("Firebase isn't configured yet. Check firebase-config.js.");
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var redirect = params.get("redirect");
        if (isSafeRedirect(redirect)) {
            try { sessionStorage.setItem("uap-login-redirect", redirect); } catch (_) {}
        }

        var provider = new firebase.auth.GoogleAuthProvider();
        if (typeof ALLOWED_EMAIL_DOMAIN === "string" && ALLOWED_EMAIL_DOMAIN.startsWith("@")) {
            provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN.slice(1) });
        }

        auth.signInWithRedirect(provider).catch(function (err) {
            alert("Sign-in failed: " + (err && err.message ? err.message : "Unknown error"));
        });
    };

    window.uapSignOut = function () {
        var auth = initFirebase();
        if (auth) return auth.signOut();
        return Promise.resolve();
    };

    function updateNavUser(user) {
        var signinLink = document.querySelector(".signin-link");
        if (!signinLink) return;
        if (!user) return;
        var name = user.displayName || user.email || "Student";
        var chip = document.createElement("span");
        chip.className = "user-chip";
        var avatar = document.createElement("span");
        avatar.className = "avatar";
        avatar.textContent = name.charAt(0).toUpperCase();
        var label = document.createElement("span");
        label.textContent = name.split(" ")[0];
        var signout = document.createElement("button");
        signout.type = "button";
        signout.textContent = "Sign out";
        chip.append(avatar, label, signout);
        signout.addEventListener("click", function () {
            window.uapSignOut().finally(function () { window.location.reload(); });
        });
        signinLink.replaceWith(chip);
    }

    document.addEventListener("DOMContentLoaded", function () {
        var auth = initFirebase();
        if (!auth) return;

        /* Complete Google redirect login on the dedicated sign-in page. */
        if (window.location.pathname.toLowerCase().endsWith("/signin.html") || window.location.pathname.toLowerCase().endsWith("signin.html")) {
            auth.getRedirectResult().then(function (result) {
                if (result && result.user) return validateAndRedirect(result.user);
                return null;
            }).catch(function (err) {
                try { sessionStorage.removeItem("uap-login-redirect"); } catch (_) {}
                alert("Sign-in failed: " + (err && err.message ? err.message : "Unknown error"));
            });
        }

        auth.onAuthStateChanged(function (user) {
            if (user) updateNavUser(user);
        });
    });
})();
