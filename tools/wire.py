# -*- coding: utf-8 -*-
"""
wire.py — question paper er chobi gulo batch page e boshay.

Ki kore:
  1. Proti subject folder-e image folder ta AUTO-DETECT kore
     (naam ja-i hok — "CSE 207 image" ba
      "Data Structures and Algorithms II (CSE 207)image")
  2. Proti filename theke batch / section / set / page ber kore
  3. Batch onujayi group kore HTML banay
  4. Page-er <div class="message"> block ta replace kore

Idempotent — jotobar chalao, result eki thakbe.
Purono kichu duplicate ba nosto hobe na.
"""
import os, re, sys, html, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse import parse_filename, IMG_EXT, section_sort_key

SITE = os.environ.get("UAP_SITE", os.getcwd())


# ------------------------------------------------------------------
# Image folder auto-detect
# ------------------------------------------------------------------
def find_image_dir(subject_path):
    cands = [d for d in os.listdir(subject_path)
             if os.path.isdir(os.path.join(subject_path, d))]
    if not cands:
        return None
    for d in cands:
        if 'image' in d.lower():
            return d
    return cands[0]


# ------------------------------------------------------------------
# Group label
# ------------------------------------------------------------------
def group_label(sec, st, note):
    if note and not sec:
        n = re.sub(r'\bsir\b', 'Sir', note.strip(), flags=re.I)
        return n[0].upper() + n[1:]
    if sec:
        base = "Section %s" % sec
        return "%s &middot; Set %s" % (base, st) if st else base
    if st:
        return "Set %s" % st
    return "Section not specified"


def set_sort(st):
    if st is None:
        return (0, 0, '')
    if st.isdigit():
        return (1, int(st), '')
    return (1, 0, st)


# ------------------------------------------------------------------
# HTML block builder
# ------------------------------------------------------------------
def build_block(title, exam_label, sem_label, imgdir, items,
                depth_prefix, crumbs_html, report_from,
                subject_code="", batch_code=""):
    groups = {}
    for it in items:
        key = (it['section'], it['set'], it['note'] if not it['section'] else None)
        groups.setdefault(key, []).append(it)

    ordered = sorted(
        groups.items(),
        key=lambda kv: (section_sort_key(kv[0][0]), set_sort(kv[0][1]), str(kv[0][2] or ''))
    )

    # Ekta matro group, ar tar kono section/set/note nai
    # (mid / final / previous-semester) -> heading dekhabo na, shudhu
    # chobi. Khali "Section not specified" lekha bhalo dekhay na.
    plain = len(ordered) == 1 and ordered[0][0] == (None, None, None)

    n_papers = len(items)
    n_groups = len(ordered)
    if plain:
        subtitle = "%d page%s" % (n_papers, "s" if n_papers != 1 else "")
    else:
        subtitle = "%d section%s &middot; %d paper%s" % (
            n_groups, "s" if n_groups != 1 else "",
            n_papers, "s" if n_papers != 1 else "")

    short = re.sub(r'\s*[\u2014-]\s*Batch\s*\d+\s*$', '', title).strip()

    out = ['<div class="message">', crumbs_html]
    out.append('            <span class="eyebrow">%s &middot; %s</span>' % (sem_label, exam_label))
    out.append('            <h2>%s</h2>' % html.escape(title))
    out.append('            <p class="subtitle">%s</p>' % subtitle)

    for (sec, st, note), lst in ordered:
        lst.sort(key=lambda x: (x['page'] or 0, x['raw']))
        out.append('')
        out.append('            <div class="paper-group">')
        if not plain:
            out.append('                <h3 class="section-heading">%s</h3>'
                       % group_label(sec, st, note))
        multi = len(lst) > 1
        if multi:
            out.append('                <div class="question-image-grid">')
        pad = '                    ' if multi else '                '
        for i, it in enumerate(lst, 1):
            src = urllib.parse.quote("%s/%s" % (imgdir, it['raw']))
            pg = it['page'] or i
            bit = ("Batch %s " % it['batch']) if it['batch'] else ""
            lab = "" if plain else re.sub('&middot;', '-', group_label(sec, st, note)) + " "
            alt = html.escape(re.sub(r'\s+', ' ',
                  "%s %s %s%spage %d" % (short, exam_label, bit, lab, pg)).strip())
            out.append('%s<img src="%s" alt="%s" class="question-image" '
                       'loading="lazy" onclick="openImage(this)">' % (pad, src, alt))
        if multi:
            out.append('                </div>')
        out.append('            </div>')

    # Admin panel theke Cloudinary te upload kora paper gulo ekhane
    # bosbe (live-papers.js Firestore theke ene dey). Static chobi
    # gulo uporer moto file theke, ei ta database theke — duita alada.
    out.append('')
    out.append('            <div class="live-papers" data-sem="%s" data-exam="%s" '
               'data-subject="%s" data-batch="%s"></div>'
               % (html.escape(sem_label.replace("Semester ", "")),
                  html.escape(exam_label), html.escape(subject_code),
                  html.escape(batch_code)))

    out.append('')
    out.append('            <a class="report-inline" href="%sreport.html?from=%s">'
               '\U0001F6A9 Something wrong on this page?</a>'
               % (depth_prefix, urllib.parse.quote(report_from)))
    out.append('        </div>')
    return "\n".join(out)


# ------------------------------------------------------------------
# Main driver
# ------------------------------------------------------------------
def wire_exam(exam_dir, exam_label, sem_label, depth_prefix, crumb_builder):
    """exam_dir-er shob subject-er shob batch page wire kore."""
    changed = 0
    wired_imgs = 0
    base = os.path.join(SITE, exam_dir)

    for subject in sorted(os.listdir(base)):
        sp = os.path.join(base, subject)
        if not os.path.isdir(sp):
            continue
        imgdir = find_image_dir(sp)
        if not imgdir:
            continue
        files = [f for f in sorted(os.listdir(os.path.join(sp, imgdir)))
                 if f.lower().endswith(IMG_EXT)]
        if not files:
            continue

        by_batch = {}
        no_batch = []
        for f in files:
            r = parse_filename(f)
            if r['batch'] is None:
                no_batch.append(r)
            else:
                by_batch.setdefault(r['batch'], []).append(r)

        for page in sorted(os.listdir(sp)):
            if not page.endswith('.html'):
                continue

            mb = re.match(r'^([a-z]+\d+)-b(\d+)\.html$', page)
            mp = re.match(r'^([a-z]+\d+)-previous-semester\.html$', page)

            if mb:
                batch = int(mb.group(2))
                if batch not in by_batch:
                    continue
                items, slug, who = by_batch[batch], mb.group(1), "Batch %d" % batch
                batch_code = str(batch)
            elif mp:
                if not no_batch:
                    continue
                items, slug, who = no_batch, mp.group(1), "Previous semester"
                batch_code = ""
            else:
                continue

            fp = os.path.join(sp, page)
            src = open(fp, encoding='utf-8').read()

            mt = re.search(r'<div class="message">(.*?)</div>\s*</main>', src, re.S)
            if not mt:
                print("  !! no message block:", fp)
                continue

            mh2 = re.search(r'<h2>(.*?)</h2>', mt.group(1), re.S)
            title = html.unescape(re.sub(r'<[^>]+>', '', mh2.group(1))).strip() \
                    if mh2 else who

            crumbs = crumb_builder(subject, slug, who)
            report_from = "%s - %s - %s - %s" % (sem_label, exam_label, subject, who)
            block = build_block(title, exam_label, sem_label, imgdir, items,
                                depth_prefix, crumbs, report_from,
                                subject, batch_code)

            new = src[:mt.start()] + block + "\n    </main>" + src[mt.end():]
            if new != src:
                open(fp, 'w', encoding='utf-8').write(new)
                changed += 1
                wired_imgs += len(items)

    return changed, wired_imgs
