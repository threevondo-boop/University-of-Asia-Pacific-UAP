# -*- coding: utf-8 -*-
"""Regenerate search-data.js from the current Semester 2.1/2.2 pages."""
import json, re
from pathlib import Path
ROOT=Path('.')
SUBJ={
'cse201':'Object Oriented Programming (CSE 201)','cse203':'Data Structure and Algorithms (CSE 203)','cse205':'Law and Ethics (CSE 205)','eee201':'Electrical and Electronic Engineering (EEE 201)','mth201':'Mathematics II (MTH 201)',
'cse207':'Data Structure and Algorithm II (CSE 207)','cse209':'Digital Logic Design (CSE 209)','cse211':'Database System (CSE 211)','ecn201':'Engineering Economics (ECN 201)','math203':'Probability and Statistics (MATH 203)'}
pages=[
{'title':'Home','tag':'Page','url':'home.html'},{'title':'Browse Semesters','tag':'Page','url':'semester.html'},{'title':'Notes','tag':'Page','url':'notes.html'},{'title':'Updates','tag':'Page','url':'updates.html'},{'title':'Gallery','tag':'Page','url':'gallery.html'},{'title':'Upload','tag':'Page','url':'upload.html'},{'title':'About','tag':'Page','url':'about.html'},{'title':'Contact','tag':'Page','url':'contact.html'},{'title':'Report a problem','tag':'Page','url':'report.html'},{'title':'Sign in','tag':'Page','url':'signin.html'}]
for sem,label in [('21','2.1'),('22','2.2')]:
 pages += [{'title':f'Semester {label}','tag':'Semester','url':f'{sem}/{sem}.html'},{'title':f'Semester {label} — CT','tag':'Exam','url':f'{sem}/{sem}ct.html'},{'title':f'Semester {label} — Mid','tag':'Exam','url':f'{sem}/{sem}mid.html'},{'title':f'Semester {label} — Final','tag':'Exam','url':f'{sem}/{sem}final.html'}]
 for i in range(1,5): pages.append({'title':f'Semester {label} — CT.{i}','tag':'Exam','url':f'{sem}/{"21CT/21ct" if sem=="21" else "22ct/22ct"}{i}.html'})
# subject indexes
for sem,patterns in [('21',['21/21CT/22ct*/*.html','21/21Mid/*.html','21/21Final/*.html']),('22',['22/22ct/22ct*/*.html','22/22mid/*.html','22/22final/*.html'])]:
 label='2.1' if sem=='21' else '2.2'
 for pat in patterns:
  for p in ROOT.glob(pat):
   slug=p.stem.lower()
   if slug not in SUBJ: continue
   parts=p.as_posix().split('/')
   if sem=='21':
    if '21CT' in parts: ex='CT.'+re.search(r'22ct(\d)',p.parent.name).group(1)
    elif '21Mid' in parts: ex='Mid'
    else: ex='Final'
   else:
    if parts[1]=='22ct': ex='CT.'+re.search(r'22ct(\d)',p.parent.name).group(1)
    elif parts[1]=='22mid': ex='Mid'
    else: ex='Final'
   pages.append({'title':SUBJ[slug],'tag':f'Semester {label} · {ex}','url':p.as_posix()})
# batch pages
for p in ROOT.rglob('*-b*.html'):
 slug=p.stem.rsplit('-b',1)[0].lower(); m=re.search(r'-b(\d+)$',p.stem,re.I)
 if slug not in SUBJ or not m: continue
 parts=p.as_posix().split('/')
 if parts[0]=='21':
  sem='2.1'; ex='CT.'+re.search(r'22ct(\d)',parts[2]).group(1) if '21CT' in parts else ('Mid' if '21Mid' in parts else 'Final')
 elif parts[0]=='22':
  sem='2.2'; ex='CT.'+re.search(r'22ct(\d)',parts[2]).group(1) if parts[1]=='22ct' else ('Mid' if parts[1]=='22mid' else 'Final')
 else: continue
 pages.append({'title':f'{SUBJ[slug]} — Batch {m.group(1)}','tag':f'Semester {sem} · {ex}','url':p.as_posix()})
seen=set(); clean=[]
for x in pages:
 if x['url'] not in seen: seen.add(x['url']); clean.append(x)
header='''/* ============================================================\n   search-data.js — AUTO-GENERATED\n   ============================================================\n   Generated from the current Semester 2.1 and 2.2 pages.\n   ============================================================ */\n\nconst SITE_PAGES = '''
Path('search-data.js').write_text(header+json.dumps(clean,indent=4,ensure_ascii=False)+';\n',encoding='utf-8')
print(f'search-data.js: {len(clean)} entries')
