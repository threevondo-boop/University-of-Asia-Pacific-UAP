/* auth.js
   Google sign-in / sign-out, ar navbar e user chip dekhano.
*/

(function () {
    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    function initFirebase() {
        if (typeof firebase === "undefined" || !isConfigured()) return null;
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        return firebase.auth();
    }

    // Google Popup Sign-in — signin.html-er button ei function call kore.
    window.uapSignIn = function () {
        const auth = initFirebase();
        if (!auth) {
            alert("Firebase isn't configured yet. Add your Firebase project keys in firebase-config.js.");
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        // UAP-er email domain diye e login korte bolar jonno hint
        provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN.replace("@", "") });

        auth.signInWithPopup(provider).then(function (result) {
            const email = result.user.email || "";
            // Normal student: shudhu UAP domain.
            // Admin: firebase-config.js-er ADMIN_EMAILS e thakle
            // gmail hoileo dhukte parbe (admin-der personal mail
            // diyeo panel e dhoka lagte pare).
            const domainOk = email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
            const adminOk  = (typeof uapIsAdmin === "function") && uapIsAdmin(email);
            if (!domainOk && !adminOk) {
                auth.signOut();
                alert("Only a UAP email (" + ALLOWED_EMAIL_DOMAIN + ") can sign in.");
                return;
            }
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect");
            window.location.href = redirect || (window.SITE_PREFIX || "") + "home.html";
        }).catch(function (err) {
            alert("Sign-in failed: " + err.message);
        });
    };

    window.uapSignOut = function () {
        const auth = initFirebase();
        if (auth) auth.signOut();
    };

    // Navbar er "Sign in" link ke login obostay user-chip e bodle deya
    document.addEventListener("DOMContentLoaded", function () {
        const auth = initFirebase();
        if (!auth) return;

        auth.onAuthStateChanged(function (user) {
            const signinLink = document.querySelector(".signin-link");
            if (!signinLink) return;

            if (user) {
                const name = user.displayName || user.email || "Student";
                const initial = name.charAt(0).toUpperCase();
                const chip = document.createElement("span");
                chip.className = "user-chip";
                chip.innerHTML =
                    '<span class="avatar">' + initial + '</span>' +
                    '<span>' + name.split(" ")[0] + '</span>' +
                    '<button type="button">Sign out</button>';
                chip.querySelector("button").addEventListener("click", function () {
                    window.uapSignOut();
                    window.location.reload();
                });
                signinLink.replaceWith(chip);

                // Admin hole navbar e ekta "Admin" link add kore dei
                if (typeof uapIsAdmin === "function" && uapIsAdmin(user.email)) {
                    const links = document.querySelector(".nav-links");
                    if (links && !links.querySelector(".admin-link")) {
                        const a = document.createElement("a");
                        a.className = "admin-link";
                        a.href = (window.SITE_PREFIX || "") + "admin.html";
                        a.textContent = "⚙ Admin";
                        links.insertBefore(a, chip);
                    }
                }
            }
        });
    });
})();
