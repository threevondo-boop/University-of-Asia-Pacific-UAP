/* ============================================================
   updates-data.js
   ============================================================
   "Check out for updates" card e ja dekhay, oita ei file theke
   ashe. updates.html ei array ta pore, notun-theke-purono order e
   ekta timeline banay.

   ⚠️ EI PAGE STUDENT RA DEKHE — tai entry gula SHORT, FORMAL, ar
      shudhu "ki notun eshechhe" bole. Kono technical/internal detail
      (kon field flexible hoyeche, kon bug fix hoyeche, ki design
      change hoyeche) EKHANE lekha hobe na — shudhu major content
      update (notun exam/semester/subject) mention hobe. Ekhane shudhu major content update
      (notun exam/semester/subject add hoyeche) mention hobe.

   ============================================================
   NOTUN UPDATE MANUALLY ADD KORAR NIYOM
   ============================================================
   1. Ei file ta text editor e kholo
   2. SITE_UPDATES = [ ] list-er shobar UPORE (prothom { ta-r age)
      ei format e ekta block boshao:

          {
              date: "2026-09-15",
              title: "Notun ki add hoyeche — ek line e",
              description: "1 line e aro kichu detail, thakle.",
              link: "22/22ct.html",       // optional — na thakle button dekhabe na
              linkLabel: "Visit CT papers →"  // optional, na dile default "Visit →"
          },

   3. `link` field ta root theke relative path — jemon "22/22ct.html"
      ba "notes.html". Kono update-er shathe specific page na thakle
      `link` ar `linkLabel` duita-i bad diye dite paro.
   4. Save koro, `git push` koro. Order automatic date onujayi hoy.

   ⚠️ Shesh e comma (,) bhulo na.
   ============================================================ */

const SITE_UPDATES = [
    {
        date: "2026-08-06",
        title: "New question papers added for CT.2, CT.3 and CT.4",
        description: "Semester 2.2 now has CT.2 through CT.4 question papers across all subjects.",
        link: "22/22ct.html",
        linkLabel: "Visit CT papers →"
    },
    {
        date: "2026-08-06",
        title: "Notes section launched",
        description: "Handnotes and slides shared by students can now be read directly in the browser.",
        link: "notes.html",
        linkLabel: "Visit Notes →"
    },
    {
        date: "2026-08-06",
        title: "Upload your own question papers",
        description: "Students can now submit question papers directly from the site for admin review.",
        link: "upload.html",
        linkLabel: "Visit Upload →"
    }
];
