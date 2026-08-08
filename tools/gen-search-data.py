# -*- coding: utf-8 -*-
"""
gen-search-data.py — search-data.js regenerate kore.

Notun semester / subject / batch page add korar por eta chalao:
    python3 tools/gen-search-data.py
(site root theke chalate hobe)
"""
import os, re, json, glob

SUBJ = {
    "cse207": "Data Structure and Algorithm II (CSE 207)",
    "cse208": "Data Structure and Algorithm II Lab (CSE 208)",
    "cse209": "Digital Logic Design (CSE 209)",
    "cse210": "Digital Logic Design Lab (CSE 210)",
    "cse211": "Database System (CSE 211)",
    "cse212": "Database System Lab (CSE 212)",
    "ecn201": "Engineering Economics (ECN 201)",
    "math203": "Probability and Statistics (MATH 203)",
}
EXAM = {"22ct1":"CT.1","22ct2":"CT.2","22ct3":"CT.3","22ct4":"CT.4",
        "22mid":"Mid","22final":"Final"}

pages = [
    {"title":"Home","tag":"Page","url":"home.html"},
    {"title":"Browse Semesters","tag":"Page","url":"semester.html"},
    {"title":"Notes","tag":"Page","url":"notes.html"},
    {"title":"Updates","tag":"Page","url":"updates.html"},
    {"title":"Gallery","tag":"Page","url":"gallery.html"},
    {"title":"Contribute a question","tag":"Page","url":"contribute.html"},
    {"title":"About","tag":"Page","url":"about.html"},
    {"title":"Contact","tag":"Page","url":"contact.html"},
    {"title":"Report a problem","tag":"Page","url":"report.html"},
    {"title":"Sign in","tag":"Page","url":"signin.html"},
    {"title":"Semester 2.1","tag":"Semester","url":"21/21.html"},
    {"title":"Semester 2.2","tag":"Semester","url":"22/22.html"},
    {"title":"Semester 2.2 — CT","tag":"Exam","url":"22/22ct.html"},
    {"title":"Semester 2.2 — Mid","tag":"Exam","url":"22/22mid.html"},
    {"title":"Semester 2.2 — Final","tag":"Exam","url":"22/22final.html"},
]
for n in (1, 2, 3, 4):
    pages.append({"title": f"Semester 2.2 — CT.{n}", "tag": "Exam",
                  "url": f"22/22ct/22ct{n}.html"})

count = 0
for fp in sorted(glob.glob('22/**/*-b*.html', recursive=True)):
    m = re.match(r'^([a-z]+\d+)-b(\d+)\.html$', os.path.basename(fp))
    if not m: continue
    slug, batch = m.group(1), m.group(2)
    parts = fp.split(os.sep)
    exam = EXAM.get(parts[2] if parts[1] == '22ct' else parts[1], "")
    wired = 'class="question-image"' in open(fp, encoding='utf-8').read()
    pages.append({
        "title": f"{SUBJ.get(slug, slug.upper())} — Batch {batch}",
        "tag": f"Semester 2.2 · {exam}" + ("" if wired else " · coming soon"),
        "url": fp.replace(os.sep, "/")
    })
    count += 1

for fp in sorted(glob.glob('22/**/*.html', recursive=True)):
    b = os.path.basename(fp)[:-5]
    if b in SUBJ:
        parts = fp.split(os.sep)
        exam = EXAM.get(parts[2] if parts[1] == '22ct' else parts[1], "")
        pages.append({"title": SUBJ[b], "tag": f"Semester 2.2 · {exam}",
                      "url": fp.replace(os.sep, "/")})

header = '''/* ============================================================
   search-data.js  —  AUTO-GENERATED
   ============================================================
   Navbar-r search box ei list-er moddhe khoje. URL gula "root
   theke" lekha; actual link banano hoy search.js e
   window.SITE_PREFIX diye (proti HTML-e ekta chotto inline
   script e set kora ache).

   ⚠️ Ei file ta hate edit korle porer bar regenerate korle
      chole jabe. Notun semester/subject add korle
      tools/gen-search-data.py abar chalao.
   ============================================================ */

const SITE_PAGES = '''

open('search-data.js', 'w', encoding='utf-8').write(
    header + json.dumps(pages, indent=4, ensure_ascii=False) + ";\n")
print(f"search-data.js: {len(pages)} entries ({count} batch pages)")
