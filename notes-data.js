/* notes-data.js
   Hate likha notes-er list. Admin panel chara notes add korar rasta.
*/

/* ============================================================
   MANUALLY NOTES ADD KORAR NIYOM
   ============================================================
   Notes duijaga theke ashe:
     1. EI FILE — hate likha, repo-r moddhe thake, kokhono muchbe na
     2. Admin panel — Firestore e thake, phone theke-o add kora jay

   Duitai notes.html e ek shathe dekhabe. Student ra parthokko
   bujhbe na.

   ------------------------------------------------------------
   PDF ta kothay rakhbe — DUITA option
   ------------------------------------------------------------
   OPTION A — PDF ta repo-r moddhe (choto file, 5-10 MB porjonto)
     1. Site folder e ekta folder banao: `notes-pdf`
     2. PDF ta okhane rakho, jemon: notes-pdf/dld-handnote.pdf
     3. Niche `url` e likho: "notes-pdf/dld-handnote.pdf"
     ✅ Free, permanent, kono account lage na
     ❌ Boro PDF hole repo bhari hoye jabe

   OPTION B — Google Drive (boro file, 10 MB+)
     1. Drive e PDF ta upload koro
     2. Right-click → Share → "Anyone with the link" → Viewer
     3. Copy link → niche `url` e paste koro (puro link)
     ✅ Koto boro hok problem nai
     ❌ Drive-e "Restricted" thakle site e khulbe na

   ------------------------------------------------------------
   ENTRY ADD KORAR NIYOM
   ------------------------------------------------------------
   Niche STATIC_NOTES = [ ] list-er moddhe ei format e ekta block
   boshao (jekhane khushi — date onujayi automatic sort hoy):

       {
           title:    "DLD full handnote — chapter 1-5",
           subject:  "Digital Logic Design (CSE 209)",
           semester: "2.2",
           batch:    "55",
           author:   "Abdullah Usama",
           date:     "2026-08-07",
           url:      "notes-pdf/dld-handnote.pdf"
       },

   ⚠️ Proti block-er shesh e comma (,) bhulo na.
   ⚠️ date shob shomoy "YYYY-MM-DD" format e.

   Save korar por `firebase deploy --only hosting` — byas.
   ============================================================ */

const STATIC_NOTES = [

    // ---- 👇 Notun note ekhane, ei block-er moto kore, paste koro 👇 ----

    {
        title:    "CSE 207 Handnote — 1st week",
        subject:  "CSE 207",
        semester: "2.2",
        batch:    "56",
        author:   "Avi Debnath",
        date:     "2026-08-07",
        url:      "https://drive.google.com/file/d/1oMc1Ri65m3nfkCv4iDI-wv9D8nwGnVt9/view?usp=sharing"
    },
    {
        title:    "CSE 203 Handnote — full",
        subject:  "CSE 203",
        semester: "2.1",
        batch:    "56",
        author:   "Avi Debnath",
        date:     "2026-08-07",
        url:      "https://drive.google.com/file/d/18pVc2c_Wpw9Ize4NFNAxQDqrzqAhM1TQ/view?usp=drive_link"
    },
    {
        title:    "EEE 201 Handnote — full",
        subject:  "EEE 201",
        semester: "2.1",
        batch:    "56",
        author:   "Avi Debnath",
        date:     "2026-08-07",
        url:      "https://drive.google.com/file/d/1d9hCyB5OHgZ-aAhdA0rc2Zlaf0BJpFF9/view?usp=drive_link"
    },

];
