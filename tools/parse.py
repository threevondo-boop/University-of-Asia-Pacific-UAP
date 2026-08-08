import os, re, sys

IMG_EXT = ('.jpg','.jpeg','.png','.gif','.webp')

def parse_filename(fn):
    """Return dict(batch, section, setname, page, note) or None."""
    stem = os.path.splitext(fn)[0]
    d = {'batch':None,'section':None,'set':None,'page':None,'note':None,'raw':fn}

    m = re.search(r'Batch[-\s_]*(\d{2})', stem, re.I)
    if m: d['batch'] = int(m.group(1))

    # CT-n token thakle tar por theke, na thakle (mid/final)
    # "Batch NN" token tuku kete baki ta niye kaj kori.
    m2 = re.search(r'\bCT[-\s]*\d\b', stem, re.I)
    if m2:
        rest = stem[m2.end():]
    elif m:
        rest = stem[:m.start()] + ' ' + stem[m.end():]
    else:
        rest = stem
    rest = rest.strip(' -_')

    # page-N
    mp = re.search(r'(?:^|[\s_\-])page[-\s]*(\d+)', rest, re.I)
    if mp:
        d['page'] = int(mp.group(1))
        rest = (rest[:mp.start()] + ' ' + rest[mp.end():]).strip()

    # Set-X  (letter or digit)
    ms = re.search(r'\bSet[-\s]*([A-Za-z0-9]+)', rest, re.I)
    if ms:
        d['set'] = ms.group(1).upper()
        rest = (rest[:ms.start()] + ' ' + rest[ms.end():]).strip()

    # Sec-XXX
    mc = re.search(r'\bSec(?:tion)?[-\s]*(.+)$', rest, re.I)
    if mc:
        sec = mc.group(1).strip(' -_()')
        sec = re.sub(r'\s+', ' ', sec)
        if re.match(r'^not\s*mentioned$', sec, re.I):
            d['section'] = None
        else:
            d['section'] = sec.upper()
        rest = rest[:mc.start()].strip()

    leftover = rest.strip(' -_')
    # Subject code (CSE-207 / MTH 203 / ECN-201) note na — bad dei.
    leftover = re.sub(r'\b[A-Z]{2,4}[-\s]*\(?[A-Z]*\)?[-\s]*\d{3}\b', '', leftover, flags=re.I)
    # "Final Question(Previous Semester)_" type prefix-o note na.
    leftover = re.sub(r'(?i)final\s*question\s*\(previous\s*semester\)_?', '', leftover)
    leftover = leftover.strip(' -_')
    if leftover:
        d['note'] = re.sub(r'\s+',' ',leftover).strip()
    return d

def section_sort_key(sec):
    if sec is None: return (9, '')
    if re.fullmatch(r'[A-Z]', sec): return (0, sec)
    return (1, sec)

if __name__ == '__main__':
    root = sys.argv[1]
    bad = 0; total = 0
    for dp, dn, fn in os.walk(root):
        for f in sorted(fn):
            if not f.lower().endswith(IMG_EXT): continue
            total += 1
            r = parse_filename(f)
            flag = '' if r['batch'] else '  <<< NO BATCH'
            if not r['batch']: bad += 1
            print(f"{r['batch']!s:>4} | sec={str(r['section']):<12} set={str(r['set']):<5} pg={str(r['page']):<4} note={str(r['note']):<14} | {f}{flag}")
    print(f"\nTOTAL {total}  UNPARSED {bad}")
