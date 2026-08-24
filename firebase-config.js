

const firebaseConfig = {
    apiKey: "AIzaSyByS_XgE23bqGY4UoeS3rPqqyspVI-xaQs",
    authDomain: "uap-question-archive-11bc4.firebaseapp.com",
    projectId: "uap-question-archive-11bc4",
    storageBucket: "uap-question-archive-11bc4.firebasestorage.app",
    messagingSenderId: "1039215559426",
    appId: "1:1039215559426:web:29783e2501ff1ae552f81b"
};


const ALLOWED_EMAIL_DOMAIN = "@uap-bd.edu";



const ADMIN_EMAILS = [

    "threevondo@gmail.com",

    "24201147@uap-bd.edu",
    "abdullahusama204@gmail.com",

    "24201154@uap-bd.edu",
    "afrindiya345@gmail.com",

    "24201165@uap-bd.edu",
    "avidbnth@gmail.com"
];

function uapIsAdmin(email) {
    if (!email) return false;
    return ADMIN_EMAILS.some(function (e) {
        return e.toLowerCase() === email.toLowerCase();
    });
}
