(function () {
    var authStatePromise = null;
    var signInBusy = false;

    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    function initFirebase() {
        if (typeof firebase === "undefined" || !isConfigured()) return null;
        if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
        var auth = firebase.auth();
        if (!authStatePromise) {
            authStatePromise = new Promise(function (resolve) {
                var unsubscribe = auth.onAuthStateChanged(function (user) {
                    unsubscribe();
                    resolve(user || null);
                });
            });
        }
        return auth;
    }

    function allowedEmail(email) {
        var e = String(email || "").toLowerCase();
        var domain = String(typeof ALLOWED_EMAIL_DOMAIN === "string" ? ALLOWED_EMAIL_DOMAIN : "").toLowerCase();
        return !!domain && e.endsWith(domain);
    }

    function isAllowedUser(user) {
        if (!user || !user.email) return false;
        return allowedEmail(user.email) ||
               (typeof uapIsAdmin === "function" && uapIsAdmin(user.email));
    }

    function isSafeRedirect(value) {
        if (!value || typeof value !== "string") return false;
        if (/^https?:\/\//i.test(value) || value.indexOf("\\") !== -1 || value.startsWith("//")) return false;
        return /^[A-Za-z0-9_./?=&%#:+()\- ]+$/.test(value) && !value.includes("..") && !value.startsWith("/");
    }

    function currentTarget() {
        var value = window.location.pathname + window.location.search + window.location.hash;
        value = value.replace(/^\/+/, "");
        return isSafeRedirect(value) ? value : "home.html";
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

    function rememberRedirect(value) {
        if (!isSafeRedirect(value)) return;
        try { sessionStorage.setItem("uap-login-redirect", value); } catch (_) {}
    }

    function showError(message) {
        var el = document.getElementById("setupNotice");
        if (el) {
            el.textContent = "⚠️ " + message;
            el.style.display = "inline-block";
            return;
        }
        alert(message);
    }

    function validateAndRedirect(user) {
        if (!isAllowedUser(user)) {
            return initFirebase().signOut().then(function () {
                throw new Error("Only a UAP email (" + ALLOWED_EMAIL_DOMAIN + ") can sign in.");
            });
        }
        window.location.replace(getTarget());
        return Promise.resolve();
    }

    window.uapIsAllowedUser = isAllowedUser;

    window.uapGetAuthState = function () {
        var auth = initFirebase();
        if (!auth) return Promise.resolve(null);
        if (auth.currentUser) return Promise.resolve(auth.currentUser);
        return authStatePromise;
    };

    window.uapStartSignIn = function (target) {
        var value = isSafeRedirect(target) ? target : currentTarget();
        rememberRedirect(value);
        window.location.replace((window.SITE_PREFIX || "") + "signin.html?redirect=" + encodeURIComponent(value));
    };

    window.uapSignIn = function () {
        if (signInBusy) return;
        var auth = initFirebase();
        if (!auth) {
            showError("Firebase isn't configured yet. Check firebase-config.js.");
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var redirect = params.get("redirect");
        rememberRedirect(isSafeRedirect(redirect) ? redirect : "home.html");

        var provider = new firebase.auth.GoogleAuthProvider();
        if (typeof ALLOWED_EMAIL_DOMAIN === "string" && ALLOWED_EMAIL_DOMAIN.startsWith("@")) {
            provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN.slice(1) });
        }

        signInBusy = true;
        var button = document.querySelector('button[onclick="uapSignIn()"]');
        if (button) button.disabled = true;

        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(function () {})
            .then(function () {
                return auth.signInWithPopup(provider);
            })
            .then(function (result) {
                return validateAndRedirect(result.user);
            })
            .catch(function (err) {
                if (err && err.message && err.message.indexOf("Only a UAP email") === 0) {
                    showError(err.message);
                } else if (err && err.code === "auth/popup-closed-by-user") {
                    showError("Sign-in was cancelled.");
                } else if (err && err.code === "auth/popup-blocked") {
                    showError("The Google sign-in popup was blocked. Allow popups for this site and try again.");
                } else {
                    showError("Sign-in failed: " + (err && err.message ? err.message : "Unknown error"));
                }
            })
            .finally(function () {
                signInBusy = false;
                if (button) button.disabled = false;
            });
    };

    window.uapSignOut = function () {
        var auth = initFirebase();
        if (auth) return auth.signOut();
        return Promise.resolve();
    };

    function updateNavUser(user) {
        var signinLink = document.querySelector(".signin-link");
        if (!signinLink || !isAllowedUser(user)) return;
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

        var isSignInPage = window.location.pathname.toLowerCase().endsWith("/signin.html") ||
                           window.location.pathname.toLowerCase().endsWith("signin.html");

        if (isSignInPage) {
            var existing = auth.currentUser;
            if (existing) {
                validateAndRedirect(existing).catch(function (err) {
                    showError(err && err.message ? err.message : "Sign-in failed.");
                });
                return;
            }
            auth.getRedirectResult().then(function (result) {
                if (result && result.user) return validateAndRedirect(result.user);
                return null;
            }).catch(function (err) {
                if (err && err.code === "auth/no-auth-event") return;
                showError("Sign-in failed: " + (err && err.message ? err.message : "Unknown error"));
            });
            return;
        }

        auth.onAuthStateChanged(function (user) {
            if (user && isAllowedUser(user)) updateNavUser(user);
        });
    });
})();
