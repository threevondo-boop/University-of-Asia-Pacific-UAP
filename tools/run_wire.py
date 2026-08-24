# -*- coding: utf-8 -*-
"""
run_wire.py — EITA TUMI CHALABE.

Site root theke:
    python3 tools/run_wire.py

Semester 2.2 er CT.1-CT.4, Mid, Final — shob exam er
chobi gulo abar page e boshiye dibe. Notun chobi add korar
por eta chalao.

Jotobar chalao kono khoti nai — ja already thik ache
oita ke hat dey na.
"""
import sys, os, html

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("UAP_SITE", os.getcwd())
from wire import wire_exam


def crumbs(prefix, links, who):
    """prefix = koto ta ../ , links = [(label, href), ...]"""
    out = ['            <nav class="crumbs" aria-label="Breadcrumb">',
           '                <a href="%ssemester.html">Semesters</a>' % prefix]
    for label, href in links:
        out.append('                <span>/</span>')
        out.append('                <a href="%s">%s</a>' % (href, html.escape(label)))
    out.append('                <span>/</span>')
    out.append('                <b>%s</b>' % html.escape(who))
    out.append('            </nav>')
    return "\n".join(out)


# ---- CT.1 - CT.4 : 22/22ct/22ctN/<Subject>/  -> 4 levels deep ----
def ct_crumbs(n):
    def build(subject, slug, who):
        return crumbs("../../../../", [
            ("2.2", "../../../22.html"),
            ("CT", "../../../22ct.html"),
            ("CT.%d" % n, "../../22ct%d.html" % n),
            (subject, "../%s.html" % slug),
        ], who)
    return build


# ---- Mid / Final : 22/22<exam>/<Subject>/  -> 3 levels deep ----
def mf_crumbs(folder, label):
    def build(subject, slug, who):
        return crumbs("../../../", [
            ("2.2", "../../22.html"),
            (label, "../../%s.html" % folder),
            (subject, "../%s.html" % slug),
        ], who)
    return build


jobs = []
for n in (1, 2, 3, 4):
    jobs.append(("22/22ct/22ct%d" % n, "CT.%d" % n, "../../../../", ct_crumbs(n)))
jobs.append(("22/22mid",   "Mid",   "../../../", mf_crumbs("22mid", "Mid")))
jobs.append(("22/22final", "Final", "../../../", mf_crumbs("22final", "Final")))

tp = ti = 0
for folder, label, prefix, cb in jobs:
    c, i = wire_exam(folder, label, "Semester 2.2", prefix, cb)
    print("%-8s  %2d pages wired, %3d images placed" % (label + ":", c, i))
    tp += c
    ti += i
print("\nTOTAL: %d pages, %d images" % (tp, ti))
