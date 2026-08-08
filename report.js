/* report.js
   Report form submit kore Firestore-er 'reports' collection e.
*/

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reportForm");
    const status = document.getElementById("reportStatus");
    if (!form || !status) return;

    function isConfigured() {
        return typeof firebaseConfig !== "undefined" &&
               firebaseConfig.apiKey &&
               firebaseConfig.apiKey.indexOf("PASTE_YOUR") === -1;
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        status.textContent = "";
        status.className = "report-status";

        if (typeof firebase === "undefined" || !isConfigured()) {
            status.textContent = "Reporting isn't set up yet (Firebase not configured).";
            status.classList.add("error");
            return;
        }
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        if (typeof firebase.firestore !== "function") {
            status.textContent = "Firestore isn't enabled on this Firebase project yet.";
            status.classList.add("error");
            return;
        }

        const type = document.getElementById("reportType").value;
        const page = document.getElementById("reportPage").value.trim();
        const message = document.getElementById("reportMessage").value.trim();
        if (!message) {
            status.textContent = "Please describe the problem.";
            status.classList.add("error");
            return;
        }

        const user = firebase.auth().currentUser;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        firebase.firestore().collection("reports").add({
            type: type,
            page: page || "not specified",
            message: message,
            email: user ? user.email : "anonymous",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            status.textContent = "Thanks — your report was submitted.";
            status.classList.add("success");
            form.reset();
        }).catch(function (err) {
            status.textContent = "Couldn't submit: " + err.message;
            status.classList.add("error");
        }).finally(function () {
            submitBtn.disabled = false;
        });
    });

    // Pre-fill "page" field with whatever page the student came from,
    // if they clicked Report from somewhere other than report.html.
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from) {
        document.getElementById("reportPage").value = from;
    }
});
